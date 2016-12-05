var express = require('express');
var router = express.Router();
var User = require('../models/user');
var debug = require('debug')('sess:login');

router.get('/', function (req, res, next) {
    if (req.session.userId === undefined) {
        req.session.referer = req.get('Referer');
        res.render("login", {title: "Login", problem: req.session.badLogin});
    }
    else {
        res.redirect('/');
    }
});

router.post('/', function (req, res, next) {
    var session = req.session;
    User.findOne({username: req.body.user}, function (error, user) {
        if (error) {
            debug("Login error: " + error);
            session.badLogin = "Login error";
            res.redirect(req.session.referer);
            return;
        }
        if (user === null) {
            debug("Login no user: " + error);
            session.badLogin = "User '" + req.body.user + "' doesn't exist";
            res.redirect(req.session.referer);
            return;
        }
        if (user.password !== req.body.password) {
            debug("Login wrong password: " + req.body.password + "/" + user.password);
            session.badLogin = "Wrong password for '" + req.body.user + "'";
            res.redirect(req.session.referer);
            return;
        }
        debug("Logged to: " + user.username);
        delete session.badLogin;
        session.userId = user._id;
        session.userName = user.username;
        session.admin = user.admin;
        session.userName = user.name;
        session.count = 0;
        res.redirect(req.session.referer);
    });
});

module.exports = router;
