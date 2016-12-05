var express = require('express');
var User = require('../models/user');
var debug = require('debug')('sess:users');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    debug('requested');
    if (req.session.userId === undefined) {
        res.redirect('/login');
        return;
    }
    User.find({}, function (err, users) {
        if (err)
            debug("get users failure: " + err);
        else
            res.render('users', {title: 'User List', admin: req.session.admin, users: users});
    });
});

router.get('/add', function (req, res, next) {
    debug('requested');
    if (req.session.userId === undefined) {
        res.redirect('/login');
        return;
    }
    if (!req.session.admin) {
        debug("Must be admin to add a user!!!");
        res.redirect('/users');
        return;
    }
    res.render('adduser', {title: 'Add user', admin: req.session.admin});
});

router.post('/add', function (req, res, next) {
    debug('requested');
    if (req.session.userId === undefined) {
        res.redirect('/login');
        return;
    }
    if (!req.session.admin) {
        debug("Must be admin to add a user!!!");
        res.redirect('/users');
        return;
    }
    if (req.body.user === undefined || req.body.user === null || req.body.user === "") {
        debug("Must be admin to add a user!!!");
        res.redirect('/users');
        return;
    }
    if (req.body.password === undefined || req.body.password === null || req.body.password === "") {
        debug("Must be admin to add a user!!!");
        res.redirect('/users');
        return;
    }
    if (req.body.name === undefined || req.body.name === null || req.body.name === "") {
        debug("Must be admin to add a user!!!");
        res.redirect('/users');
        return;
    }

    User.findOne({username: req.body.user}, function (err, user) {
        if (err) {
            debug("get user for adding failure: " + err);
            res.redirect('/users');
            return;
        }
        if (user !== null) {
            console.log('User to be added already exists!');
            res.redirect('/users');
            return;
        }
        User.create({
            name: req.body.name,
            username: req.body.user,
            password: req.body.password,
            admin: req.body.admin !== undefined
        }, function (err, user) {
            if (err)
                debug("Error creating a user: " + err);
            else
                debug('User created:' + user);
            res.redirect('/users');
        });
    });


});

router.get('/delete/:name', function (req, res, next) {
    debug('delete');
    if (req.session.userId === undefined) {
        res.redirect('/login');
        return;
    }
    if (!req.session.admin || req.params.name === 'moishe') {
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
