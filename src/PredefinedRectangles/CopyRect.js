function CopyRectRectangle (reqHead) {
    this._head = reqHead;
    this.data = null;
    // FIXME: pass bytesPerPixel somehow!
    //this.bytesPerPixel = 2;
}

var p = CopyRectRectangle.prototype;

p.encodingType = function encodingType () {
    return 'CopyRect';
};

p.requiredLength = function requiedLength () {
    return this.data ? 0 : 4;
};

p.addChunk = function addChunk (chunk) {
    this.data = chunk;
};
module.exports = CopyRectRectangle;