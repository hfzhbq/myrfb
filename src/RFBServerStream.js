function RFBServerStream (socket) {
    this._buffer = new Buffer(0);
    this._requests = [];
    socket.on('data', this.addChunk.bind(this));
    
    // FIXME: listen to socket's 'error' and 'end' events too!
}

var p = RFBServerStream.prototype;

p.receive = function receive (msg, cb) {
    this._requests.push({
        msg: msg,
        cb: cb
    });
    
    this.processHeadRequest();
};

p.addChunk = function addChunk (chunk) {
    var length;
    if (chunk instanceof Buffer ) {
        length = this._buffer.length + chunk.length;
        this._buffer = Buffer.concat([this._buffer, chunk], length);
    }
    
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


p.processHeadRequest = function processHeadRequest () {
    var req, chunk;
    var requiredLength, availableLength;
    
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
        req.cb.call(null, null, req.msg);
    }
};

function create (socket) {
    return new RFBServerStream(socket);
}

module.exports = {
    create: create,
    RFBServerStream: RFBServerStream
};