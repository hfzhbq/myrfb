var util = require('util');
var F = util.format;

var net = require('net');

var MyRFB = require('../src/MyRFB');

var rfb;

var socket = net.connect({
    host:   'mark.codetek.ru',
    port:   7103
}, function () {
    rfb = MyRFB.create(socket, 'client');
    rfb.on('handshake', onHandshakeMessage);
});

function onHandshakeMessage (msg, cb) {
    console.log('Got handshake message %s', msg.name());
    cb(null);
}


