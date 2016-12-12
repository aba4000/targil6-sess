var express = require('express');
var router = express.Router();
var debug = require('debug')('sess:index');

/* GET home page. */
router.get('/', function(req, res, next) {
  debug('requested');
  // if (!req.user) {
  //   res.redirect('/login');
  //   return;
  // }
  if (req.session.count === undefined)
    req.session.count = 1;
  else
    req.session.count++;
  res.render('index', { title: 'Express', count: req.session.count , user: req.user });
});

router.get('/logout', function(req, res, next) {
    debug('logging out');
    req.logout();
    req.session.regenerate(function(err) {
        debug('logged out');
        res.redirect('/');
    });
});

module.exports = router;
