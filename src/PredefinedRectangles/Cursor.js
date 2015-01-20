function CursorRectangle (reqHead) {
    this.head = reqHead;
    this.data = [];
    this._state = 'data';
    
    // FIXME: pass bytesPerPixel somehow!
    //this.bytesPerPixel = 2;
}

var p = CursorRectangle.prototype;

p.encodingType= function encodingType () {
    return 'Cursor';
};


p.requiredLength = function requiredLength () {
    if ( this._state === 'ready' ) {
        return 0;
    }
    
    var w = this.head.width;
    var h = this.head.height;
    var bpp = this.bytesPerPixel;
    
    return w * h * bpp + h *  Math.floor((w+7) / 8);
};

p.addChunk = function addChunk (chunk) {
    this.data.push(chunk);
    this._state = 'ready';
};

module.exports = CursorRectangle;