let crypto = require('crypto');

console.log(crypto.randomBytes(16).toString('hex').substring(0, 32));