var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/', function (req, res, next) {
    if (req.user) {
        res.redirect('/');
        return;
    }

    if (req.headers.referer && !req.session.referer) {
        req.session.referer = req.headers.referer;
    }

    var error = req.flash('error');
    res.render("login", {title: "Login", problem: error.length ? error[0] : undefined });
});

router.post('/',
    passport.authenticate('local', { failureRedirect: '/login',
                                     failureFlash: true }),
    function(req, res) {
        // If this function gets called, authentication was successful.
        res.redirect(req.session.referer ? req.session.referer : '/users');
        delete req.session.referer;
    }
);

module.exports = router;
