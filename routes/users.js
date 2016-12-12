var express = require('express');
var User = require('../models/user');
var debug = require('debug')('sess:users');
var router = express.Router();
var emailValidator = require("email-validator");
var crypto = require('crypto');
var rsa = require('../rsa');

/* GET users listing. */
router.get('/', function (req, res, next) {
    debug('requested');
    if (!req.user) {
        res.redirect('/login');
        return;
    }

    var query = User.find();
    query.select('-password');
    query.exec(function (err, users) {
        if (err)
            debug("get users failure: " + err);
        else
            res.render('users', {title: 'User List', admin: req.user.admin, users: users});
    });
});

router.get('/recover', function (req, res) {
    if (!req.query.username || !req.query.recoveryNumber) {
        req.flash('error', "Not enough parameters for recovery");
        res.redirect('/login');
        return;
    }

    var recoveryNumber;
    try {
        recoveryNumber = parseInt(req.query.recoveryNumber);
    }
    catch (e){
        req.flash('error', "Invalid recovery number");
        res.redirect('/login');
        return;
    }

    User.findOne({username: req.query.username, recoveryNumber: recoveryNumber}, function (error, user) {
        if (error) {
            req.flash('error', error);
            return res.redirect('/login');
        }
        if (!user) {
            req.flash('error', "Invalid username or recovery number");
            return res.redirect('/login');
        }

        req.session.regenerate(function(err) {
            if (err) {
                debug("Error login in with the new user: " + err);
                return res.redirect('/login');
            }

            req.logIn(user, function (err) {
                if (err) {
                    req.flash('error', "Error login in with user: " + err);
                    return res.redirect('/login');
                }

                debug("Logged to: " + user.username);
                res.render('userDetails', {
                    title: 'Add user',
                    admin: req.user.admin,
                    publicKey: rsa.exportKey('public'),
                    currentUserForEdit: req.user
                });

                user.recoveryNumber = undefined;
                user.save(function (error) {
                    if (error) {
                        debug("failed to undefine recovery number: " + error);
                    }
                });
            });
        });
    });
});

router.get('/add', function (req, res, next) {
    if (req.user && !req.user.admin) { //add new user by normal logged-in user
        debug("Must be admin to add a user!!!");
        res.redirect('/users');
        return;
    }

    req.flash('registration', !req.user);
    req.flash('referer', req.headers.referer ? req.headers.referer : '/');
    res.render('userDetails', {title: 'userDetails', admin: req.user && req.user.admin, publicKey: rsa.exportKey('public'), currentUserForEdit: null });
});

router.get('/editCurrent', function (req, res) {
    debug('editCurrent');
    if (!req.user) {
        res.redirect('/login');
        return;
    }

    res.render('userDetails', {title: 'Add user', admin: req.user.admin, publicKey: rsa.exportKey('public'), currentUserForEdit: req.user });
});

router.post('/editCurrent', function (req, res) {
    debug('edit user');
    if (!req.user) {
        debug('not logged in');
        res.redirect('/');
        return;
    }

    if (!req.body.name) {
        debug("Name cannot be empty!!!");
        res.redirect('/');
        return;
    }

    if (!req.body.username) {
        debug('Username cannot be empty!');
        res.redirect('/');
        return;
    }

    if (!emailValidator.validate(req.body.email)) {
        debug("Invalid email address - " + req.body.email);
        res.redirect('/');
        return;
    }

    if (!req.body.encryptedPassword) {
        debug("Password cannot be empty!!!");
        res.redirect('/');
        return;
    }

    //decrypt password
    var buffer = Buffer.from(req.body.encryptedPassword, "base64");
    var decryptedPassword = rsa.decrypt(buffer);
    var password = decryptedPassword.toString();
    if (!password) {
        debug("Password cannot be empty!!!");
        res.redirect('/');
        return;
    }

    User.findOne({ $or:[ {username: req.body.username}, {email: req.body.email} ] }, function (err, user) { //TODO improve
        if (err) {
            debug("get user for adding failure: " + err);
            res.redirect('/');
            return;
        }
        if (req.body.username !== req.user.username && user && user.username === req.body.username) {
            console.log('Requested username already exists!');
            res.redirect('/');
            return;
        }

        if (req.body.email !== req.user.email && user && user.email === req.body.email) {
            console.log('Requested email already exists!');
            res.redirect('/');
            return;
        }

        req.user.username = req.body.username;
        req.user.password = password;
        req.user.name = req.body.name;
        req.user.email = req.body.email;

        req.user.save(function (err) {
            if (err)
                debug("Error creating a user: " + err);
            else
                debug('User updated: ' + req.user);

            res.redirect('/');
        });
    });
});

router.post('/add', function (req, res, next) {
    debug('add user');
    var flashedRegistration = req.flash('registration') || [false];
    var flashedReferer = req.flash('referer') || ['/'];
    var registration = flashedRegistration[0];
    var referer = flashedReferer[0];

    if (req.body.username === undefined || req.body.username === null || req.body.username === "") {
        debug("Username cannot be empty!!!");
        res.redirect(referer);
        return;
    }
    if (req.body.encryptedPassword === undefined || req.body.encryptedPassword === null || req.body.encryptedPassword === "") {
        debug("Password cannot be empty!!!");
        res.redirect(referer);
        return;
    }

    //decrypt password
    var buffer = Buffer.from(req.body.encryptedPassword, "base64");
    var decryptedPassword = rsa.decrypt(buffer);
    var password = decryptedPassword.toString();
    if (!password) {
        debug("Password cannot be empty!!!");
        res.redirect(referer);
        return;
    }

    if (req.body.name === undefined || req.body.name === null || req.body.name === "") {
        debug("Name cannot be empty!!!");
        res.redirect(referer);
        return;
    }
    if (req.body.admin && (!req.user || !req.user.admin)) {
        debug("Only admin can add other admin users!");
        res.redirect(referer);
        return;
    }

    if (!emailValidator.validate(req.body.email)) {
        debug("Invalid email address - " + req.body.email);
        res.redirect(referer);
        return;
    }

    User.findOne({ $or:[ {username: req.body.username}, {email: req.body.email} ] }, function (err, user) {
        if (err) {
            debug("get user for adding failure: " + err);
            res.redirect(referer);
            return;
        }
        if (user !== null) {
            console.log('Username or email to be added already exist!');
            res.redirect(referer);
            return;
        }

        User.create({
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            password: password,
            admin: req.body.admin && req.user && req.user.admin
        }, function (err, newUser) {
            if (err) {
                debug("Error creating a user: " + err);
                res.redirect(referer);
                return;
            }
            debug('User created:' + newUser);
            if (!registration) {
                res.redirect(referer);
            }
            else {
                req.session.regenerate(function(err) {
                    if (err) {
                        debug("Error login in with the new user: " + err);
                        res.redirect(referer);
                        return;
                    }
                    req.logIn(newUser, function(err) {
                        if (err) {
                            debug("Error login in with the new user: " + err);
                            res.redirect(referer);
                            return
                        }
                        debug("Logged to: " + newUser.username);
                        res.redirect('/');
                    });
                });
            }
        });
    });
});

router.get('/delete/:name', function (req, res, next) {
    debug('delete');
    if (!req.user) {
        res.redirect('/login');
        return;
    }
    if (!req.user.admin || req.params.name === 'dzilbers') {
        debug("Must be admin to delete a user or can't delete THE ADMIN!!!");
        res.redirect('/users');
        return;
    }
    User.findOne({username: req.params.name}, function (err, user) {
        if (err) {
            debug("get user for deleting failure: " + err);
            res.redirect('/users');
            return;
        }
        if (user === null) {
            console.log('User to be deleted does not exist!');
            res.redirect('/users');
            return;
        }
        debug("REMOVING");
        user.remove(function (err) {
            if (err)
                debug("Failed deleting user: " + err);
            else
                debug('User successfully deleted!');
            res.redirect('/users');
        });
    });
});

module.exports = router;
