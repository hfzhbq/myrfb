function ZRLERectangle (reqHead) {
    this.head = reqHead;
    this.data = [];
    this._state = 'head';
    // FIXME: pass bytesPerPixel somehow!
    //this.bytesPerPixel = 2;
}

var p = ZRLERectangle.prototype;

p.encodingType= function encodingType () {
    return 'ZRLE';
};


p.requiredLength = function requiredLength () {
    return this._state === 'ready' ? 
        0 : this._state === 'head' ?
        4 : this._length;
};

p.addChunk = function addChunk (chunk) {
    this.data.push(chunk);
    
    if ( this._state === 'head' ) {
        this._state = 'data';
        this._length = chunk.readUInt32BE(0);
    }
    else {
        this._state = 'ready';
    }
};

module.exports = ZRLERectangle;