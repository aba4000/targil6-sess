var express = require('express');
var router = express.Router();
var debug = require('debug')('sess:login');
var passport = require('passport');
var sha1 = require('sha1');
var User = require('../models/user');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://targil666%40walla.co.il:qwerty12@out.walla.co.il:587');// ('smtps://user%40gmail.com:pass@smtp.gmail.com');

router.get('/', function (req, res, next) {
    if (req.user) {
        res.redirect('/');
        return;
    }
    req.session.random = Math.floor((Math.random() * 2000000000) + 1);
    req.flash('referer', req.headers.referer ? req.headers.referer : '/');

    var error = req.flash('error');
    res.render("login", {title: "Login", random: req.session.random, problem: error.length ? error[0] : undefined });
});

router.post('/', function(req, res, next) {
    if (req.body.btnForgotPassword) {
        if (!req.body.username) {
            req.flash('error', "Username must be sent for password recovery");
            return res.redirect('/login');
        }

        User.findOne({username: req.body.username}, function (error, user) {
            if (error) {
                req.flash('error', error);
                return res.redirect('/login');
            }
            if (!user) {
                req.flash('error', "User not exist");
                return res.redirect('/login');
            }

            user.recoveryNumber = Math.floor((Math.random() * 2000000000) + 1);
            user.save(function (error) {
                if (error) {
                    req.flash('error', error);
                    return res.redirect('/login');
                }
                debug('User ' + user.username + ' updated with recovery link number - ' + user.recoveryNumber);

                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: '"Targil 6" <targil666@walla.co.il>', // sender address
                    to: user.email, // list of receivers
                    subject: 'Password recovery link for tragil 6', // Subject line
                    text: 'The recovery link is http://localhost:' + req.socket.localPort + '/users/recover?username=' + user.username + '&recoveryNumber=' + user.recoveryNumber // plaintext body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        req.flash('error', error.message);
                        return res.redirect('/login');
                    }
                    req.flash('error', "recovery link sent to " + user.email); //not really an error, but for using the same mechanism
                    return res.redirect('/login');
                });
            });
        });
    } else {
        passport.authenticate('local', function (err, user, info) {
            //get user object from LocalStrategy
            if (err) {
                return next(err);
            }
            if (!user) {
                debug("Unknown user '" + req.body.username + "'");
                req.flash('error', info.message);
                return res.redirect('/login');
            }

            //check the login details that were hashed by random number
            var realHash = sha1(user.username + ':' + user.password + ':' + req.session.random);
            if (realHash !== req.body.hashedLogin) {
                debug("Wrong password for '" + user.username + "'");
                req.flash('error', "Wrong password for '" + user.username + "'");
                return res.redirect('/login');
            }

            // If we are here then authentication was successful.
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                debug("Logged to: " + user.username);

                var flashedReferer = req.flash('referer') || ['/'];
                var referer = flashedReferer[0];
                return res.redirect(referer);
            });
        })(req, res, next);
    }
});

module.exports = router;
