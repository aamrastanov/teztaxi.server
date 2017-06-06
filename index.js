global.basedir = __dirname + '/';
process.env.TZ = 'Asia/Baku';
var server = require('./anv/teztaksiServer');
server.start();
var dumpHandler = require('./anv/dumpHandler');
dumpHandler.start();
var garbageHandler = require('./anv/garbageHandler');
garbageHandler.start();
