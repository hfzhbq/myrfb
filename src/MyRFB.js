var util = require('util');
var EventEmitter = require('events').EventEmitter;

var async = require('async');

var RFBIncomingStream = require('./RFBIncomingStream');
var MessageFactory = require('./MessageFactory');
var RectangleFactory = require('./RectangleFactory');

var ROLES = ['server', 'client'];

// who sends the message
var HANDSHAKE = [
    {role: 'server', msg: 'Version' },
    {role: 'client', msg: 'Version' },
    {role: 'server', msg: 'SecurityTypes' },
    {role: 'client', msg: 'SecurityType' },
    'authenticate',
    {role: 'server', msg: 'SecurityResult' }
];

var INIT = [
    {role: 'client', msg: 'ClientInit'},
    {role: 'server', msg: 'ServerInit'}
];

util.inherits(MyRFB, EventEmitter);

function create (socket, role) {
    return new MyRFB(socket, role);
}

function use (mod) {
    if ( typeof mod !== 'function' ) {
        throw Error('Mod must be a function');
    }
    
    
    mod(this);
}

function addRectangle (encodingType, Constr) {
    if ( typeof encodingType !== 'number' || isNaN(encodingType) ) {
        throw Error('encodingType must be a number');
    }
    
    if ( typeof Constr !== 'function' ) {
        throw Error('Constr must be a function');
    }
    
    RectangleFactory.addRectangle(encodingType, Constr);
}


function MyRFB (socket, role) {
    EventEmitter.call(this);
    this._socket = socket;
    this._setRole(role);
    this._incomingStream = RFBIncomingStream.create(socket, this.isServer());
    this._state = 'handshake';
    this._hsi = {};
}


var p = MyRFB.prototype;

p._setRole = function (role) {

    if ( typeof role === 'string' && ROLES.indexOf(role) !== -1) {
        this._role = role;
        return;
    }

    if ( typeof role === 'undefined' ) {
        this._role = 'client';
        return;
    }

    throw Error('Role must be either "server" or "client" or undefined');
};



p.isServer = function isServer () {
    return this._role === 'server';
};


p.setHSIData = function setHSIData (msgName, data) {
    this._hsi[msgName] = data;
};

p.getHSIData = function (msgName) {
    return this._hsi[msgName];
};



p.handshake = function handshake (cb) {
    var tasks = HANDSHAKE.map( this._getStage.bind(this) );
    var _this = this;
    
    async.waterfall(tasks, function (err) {
        if ( ! err ) {
            _this._state = 'initialise';
        }
        cb(err);
    });
};


p.initialise = function initialise (cb) {
    var tasks = INIT.map( this._getStage.bind(this) );
    var _this = this;
    
    async.waterfall(tasks, function (err) {
        if ( !err ) {
            _this._state = 'ready';
            _this._incomingStream.setAsyncMode(_this.onAsyncMessage.bind(_this));
        }
        cb(err);
    });
};


p.getCurrentPixelFormat = function getCurrentPixelFormat () {
    return this._pixelFormat;
};

p.onAsyncMessage = function (error, message) {
    if (message.name() === 'SetPixelFormat') {
        this._pixelFormat = message.getProperty('pixelFormat');
        this._incomingStream.setPixelFormat(this._pixelFormat);
    }
    
    this.emit('message', message);
};


p._getStage = function _getStage (stage) {
    if ( typeof stage === 'string' && stage === 'authenticate' ) {
        return this.authenticate.bind(this);
    }

    var sr = stage.role === 'server';

    // isServer (xor) sr
    var method = (this.isServer() ? sr : !sr ) ?
        'send' : 'receive';

    return this[method].bind(this, stage.msg);
}

p.send = function send (msgName, data, cb) {
    if ( typeof cb === 'undefined' && typeof data === 'function' ) {
        cb = data;
        data = null;
    }
    
    data = data || this.getHSIData(msgName);
    var msg = MessageFactory.prepareOutgoing(msgName, data);
    
    if ( msgName === 'ServerInit' ) {
        this._pixelFormat = data.serverPixelFormat;
        this._incomingStream.setPixelFormat(this._pixelFormat);
    }
    
    if ( msgName === 'SetPixelFormat' ) {
        this._pixelFormat = data.pixelFormat;
        this._incomingStream.setPixelFormat(this._pixelFormat);
    }

    
    this._socket.write(msg.toBuffer(), cb);
};

p.receive = function receive (msgName, cb) {
    if ( this._state === 'ready' ) {
        throw Error('call to #receive() is illegal in asynchronous mode');
    }
    var msg = MessageFactory.prepareIncoming(msgName);
    var _this = this;
    
    this._incomingStream.receive(msg, function (error, message) {
        var name = message.name();
        
        if ( name === 'ServerInit' ) {
            _this._pixelFormat = message.getProperty('serverPixelFormat');
            _this._incomingStream.setPixelFormat(_this._pixelFormat);
        }
        
        _this.emit(_this._state, message, cb);
    });
};

p.authenticate = function authenticate (cb) {
    cb(null);
};



module.exports = {
    create: create,
    use:    use,
    addRectangle: addRectangle
};