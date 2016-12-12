var mongo = require("mongoose");
var Schema = mongo.Schema;
var debug = require("debug")("sess:user");

var userConnStr = 'mongodb://localhost/sess-users';
var db = mongo.createConnection()
db.on('connecting', function() { debug('Connecting to MongoDB: '); });
db.on('connected', function() { debug('Connected to MongoDB: '); });
db.on('disconnecting', function() { debug('Disconnecting to MongoDB: '); });
db.on('disconnected', function() { debug('Disconnected to MongoDB: '); });
db.on('reconnected', function() { debug('Reconnected to MongoDB: '); });
db.on('error', function(err) { debug('Error to MongoDB: ' + err); });
db.on('open', function() { debug('MongoDB open : '); });
db.on('close', function() { debug('MongoDB close: '); });
process.on('SIGINT', function() { db.close(function () { process.exit(0); });});
db.open(userConnStr);

var User = db.model('User', new Schema({
        name: String,
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        admin: Boolean,
        recoveryNumber: Number
    }));

module.exports = User;
