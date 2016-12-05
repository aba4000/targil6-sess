var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var connectMongo = require('connect-mongo');
var debug = require('debug')('sess:app');

var routes = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');

var app = express();

var MongoStore = connectMongo(session);
var sessConnStr = "mongodb://127.0.0.1/lab6-sessions";
var sessionConnect = mongoose.createConnection();
sessionConnect.on('connecting', function() { debug('Connecting to MongoDB: '); });
sessionConnect.on('connected', function() { debug('Connected to MongoDB: '); });
sessionConnect.on('disconnecting', function() { debug('Disconnecting to MongoDB: '); });
sessionConnect.on('disconnected', function() { debug('Disconnected to MongoDB: '); });
sessionConnect.on('reconnected', function() { debug('Reconnected to MongoDB: '); });
sessionConnect.on('error', function(err) { debug('Error to MongoDB: ' + err); });
sessionConnect.on('open', function() { debug('MongoDB open : '); });
sessionConnect.on('close', function() { debug('MongoDB close: '); });
process.on('SIGINT', function() { sessionConnect.close(function () { process.exit(0); });});
sessionConnect.open(sessConnStr);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(session({
    name: 'myapp.sid',
    secret: "my special secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new MongoStore({ mongooseConnection: sessionConnect }),
    cookie: { maxAge: 900000, httpOnly: true, sameSite: true }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/login', login);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
