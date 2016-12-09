var express = require('express');
var router = express.Router();
var debug = require('debug')('sess:login');
var passport = require('passport');
var sha1 = require('sha1');

router.get('/', function (req, res, next) {
    if (req.user) {
        res.redirect('/');
        return;
    }
    req.session.random = Math.floor((Math.random() * 1000000) + 1);
    if (req.headers.referer && !req.session.referer) {
        req.session.referer = req.headers.referer;
    }

    var error = req.flash('error');
    res.render("login", {title: "Login", random: req.session.random, problem: error.length ? error[0] : undefined });
});

router.post('/', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        //get user object from LocalStrategy
        if (err) { return next(err); }
        if (!user) {
            debug("Unknown user '" + req.body.username + "'");
            req.flash('error', info.message);
            return res.redirect('/login');
        }

        //check the login details that were hashed by random number
        var realHash =  sha1(user.username + ':' + user.password + ':' + req.session.random);
        if (realHash !== req.body.hashedLogin) {
            debug("Wrong password for '" + user.username + "'");
            req.flash('error', "Wrong password for '" + user.username + "'");
            return res.redirect('/login');
        }

        // If we are here then authentication was successful.
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            debug("Logged to: " + user.username);
            var referer = req.session.referer ? req.session.referer : '/';
            delete req.session.referer;
            return res.redirect(referer);
        });
    })(req, res, next);
});

module.exports = router;
