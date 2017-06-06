var teztaksiServer = {
    start: function(){
        var out = require('out');
        var connectHandler = require('./connectHandler');
        var serverParams = require('./serverParams');
        var net = require('net');

        this.clientServer = net.createServer();
        this.clientServer.setMaxListeners(0);
        this.clientServer.on('connection', function(sock) {
            out.connectionsInfo('Client connected: ' + sock.remoteAddress +':'+ sock.remotePort);
            connectHandler.initClientSocket(sock);
        });
        this.clientServer.on('error', function(err) {
            out.serversInfo('Client server error', err);
        });
        this.clientServer.on('close', function() {
            out.serversInfo('Client server closed');
        });
        this.clientServer.listen(serverParams.client_port, serverParams.host, null, function(){
            var address =  teztaksiServer.clientServer.address();
            out.serversInfo('Client server listening on ' + address.address +':'+ address.port);
        });

        this.taksistServer = net.createServer();
        this.taksistServer.setMaxListeners(0);
        this.taksistServer.on('connection', function(sock) {
            out.connectionsInfo('Taksist connected: ' + sock.remoteAddress +':'+ sock.remotePort);
            connectHandler.initTaksistSocket(sock);
        });
        this.taksistServer.on('error', function(err) {
            out.serversInfo('Taksist server error', err);
        });
        this.taksistServer.on('close', function() {
            out.serversInfo('Taksist server closed');
        });
        this.taksistServer.listen(serverParams.taksist_port, serverParams.host, null, function(){
            var address =  teztaksiServer.taksistServer.address();
            out.serversInfo('Taksist server listening on ' + address.address +':'+ address.port);
        });
    }
};

module.exports = teztaksiServer;