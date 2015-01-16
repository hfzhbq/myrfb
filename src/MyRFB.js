var async = require('async');

var RFBServerStream = require('./RFBServerStream');
var MessageFactory = require('./MessageFactory');

function MyRFB (socket) {
    this._socket = socket;
    this._serverStream = RFBServerStream.create(socket);
}


var p = MyRFB.prototype;

p.handshake = function handshake (cb) {
    var tasks = [
        this.receive.bind(this, 'Version'),
        this.send.bind(this, 'Version'),
        this.receive.bind(this, 'SecurityTypes'),
        this.send.bind(this, 'SecurityType'),
        this.authenticate.bind(this),
        this.receive.bind(this, 'SecurityResult')
    ];
    
    async.waterfall(tasks, function (err) {
        cb(err);
    });
};


p.initialise = function initialise (cb) {
    var tasks = [
        this.send.bind(this, 'ClientInit'),
        this.receive.bind(this, 'ServerInit')
    ];
    
    async.waterfall(tasks, function (err) {
        cb(err);
    });
};


p.send = function send (msgName, cb) {
    // FIXME: data to prepare an outcoming message ???
    var msg = MessageFactory.prepareOutgoing(msgName);
    this._socket.send(msg.toBuffer(), cb);
};

p.receive = function receive (msgName, cb) {
    var msg = MessageFactory.prepareIncoming(msgName);
    this._serverStream.receive(msg, cb);
};

function create (socket) {
    return new MyRFB(socket);
}

module.exports = {
    create: create
};