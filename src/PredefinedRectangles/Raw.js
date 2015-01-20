function RawRectangle (reqHead) {
    this.head = reqHead;
    this.data = null;
    // FIXME: pass bytesPerPixel somehow!
    //this.bytesPerPixel = 2;
}

var p = RawRectangle.prototype;

p.encodingType = function encodingType () {
    return 'Raw';
};

p.requiredLength = function requiredLength () {
    return this.data ?
        0 : this.bytesPerPixel * this.head.width * this.head.height;
};

p.addChunk = function (chunk) {
    this.data = chunk;
};

module.exports = RawRectangle;