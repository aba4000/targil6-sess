var NodeRSA = require('node-rsa');
var rsa = new NodeRSA({b: 1024});
rsa.setOptions({encryptionScheme: 'pkcs1'});
module.exports = rsa;