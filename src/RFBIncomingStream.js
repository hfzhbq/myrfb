var debug = require('debug')('MyRFB_IncomingStream');

// FIXME: this is for debugging only
var fs = require('fs');
// ---------------------------------
var MessageFactory = require('./MessageFactory');

var KNOWN_ROLES = ['client', 'server'];

function RFBIncomingStream (socket, isServer) {
    this._buffer = new Buffer(0);
    this._requests = [];
    this._setRole(isServer);
    this._mode = 'sync';
    // FIXME: this is for debugging only
    this._fs = fs;
    // ---------------------------------
    socket.on('data', this.addChunk.bind(this));
    
    // FIXME: listen to socket's 'error' and 'end' events too!
}

var p = RFBIncomingStream.prototype;

p._setRole = function _setRole (isServer) {
    if ( typeof isServer === 'undefined' ) {
        this._isServer = false;
        return;
    }
    
    if ( typeof isServer === 'boolean' ) {
        this._isServer = isServer;
        return;
    }
    
    if ( typeof isServer === 'string' && KNOWN_ROLES.indexOf(isServer) !== -1 ) {
        this._isServer = (isServer === 'server');
        return;
    }
    
    throw Error('incorrect isServer argument: must be true or false, (alternatively "server" or "client" or undefined, which means false)');
};

p.isServer = function isServer () {
    return this._isServer;
};


p.setPixelFormat = function setBytesPerPixel (pixelFormat) {
    this._pixelFormat = pixelFormat;
};


// FIXME: move message preparation here!
p.receive = function receive (msg, cb) {
    this._requests.push({
        msg: msg,
        cb: cb
    });
    
    this.processHeadRequest();
};


p.setAsyncMode = function setAsyncMode (listener) {
    if ( this._mode === 'sync' && this._requests.length > 0 ) {
        throw Error('Synchronous requests queue should be empty before setting the asynchronous mode');
    }
    
    if ( typeof listener === 'function' ) {
        this._asyncListener = listener;
    }
    
    if ( this._mode === 'async' ) {
        return;
    }
    
    this._mode = 'async';
    this.processHeadRequest();
};

p.addChunk = function addChunk (chunk) {
    var length;
    if (chunk instanceof Buffer ) {
        length = this._buffer.length + chunk.length;
        this._buffer = Buffer.concat([this._buffer, chunk], length);
    }
    
    debug('got %d octets', chunk.length);
    this.processHeadRequest();
};


p.detachChunk = function detachChunk (length) {
    var chunk = null;
    var head, tail, dl;
    
    if ( length === this._buffer.length ) {
        chunk = this._buffer;
        this._buffer = new Buffer(0);
    }
    
    if ( length < this._buffer.length ) {
        dl = this._buffer.length - length;
        head = new Buffer(length);
        tail = new Buffer(dl);
        this._buffer.copy(head, 0, 0, length);
        this._buffer.copy(tail, 0, length);
        this._buffer = tail;
        chunk = head;
    }
    
    return chunk;
};


p.buffer = function buffer () {
    return this._buffer;
};

p.bufferedOctetsCount = function bufferdOctetsCount () {
    return this._buffer.length;
};

p.checkAsyncMessage = function checkAsyncMessage () {
    var msg, buf, messageType;
    
    if ( this._mode !== 'async' ) {
        return;
    }
    
    buf = this.buffer();
    
    if ( buf.length < 1 ) {
        return;
    }
    
    messageType = buf.readUInt8(0);
    msg = MessageFactory.guessAndPrepareIncoming(messageType, this.isServer());
    
    if ( typeof msg.setPixelFormat === 'function' ) {
        msg.setPixelFormat(this._pixelFormat);
    }
    
    this._requests.push({msg: msg});
    
};

p.processHeadRequest = function processHeadRequest () {
    var req, chunk, cb;
    var requiredLength, availableLength;
    
    if ( this._requests.length === 0 && this._mode === 'async' ) {
        this.checkAsyncMessage();
    }
    
    if ( this._requests.length === 0 ) {
        // no receive requests
        return;
    }
    
    req = this._requests[0];
    requiredLength = req.msg.requiredLength();
    availableLength = this.bufferedOctetsCount();
    if ( requiredLength > availableLength ) {
        // not enough data
        return;
    }
    
    while ( requiredLength > 0 && requiredLength <= availableLength ) {
        chunk = this.detachChunk(requiredLength);
        req.msg.addChunk(chunk);
        requiredLength = req.msg.requiredLength();
        availableLength = this.bufferedOctetsCount();
    }
    
    if ( requiredLength === 0 ) {
        req = this._requests.pop();
        cb = this._mode === 'async' ?
            this._asyncListener : req.cb
        cb.call(null, null, req.msg);
    }
};

function create (socket, isServer) {
    return new RFBIncomingStream(socket, isServer);
}

module.exports = {
    create: create,
    RFBIncomingStream: RFBIncomingStream
};