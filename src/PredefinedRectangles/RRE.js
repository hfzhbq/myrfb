function RRERect (reqHead) {
    this.head = reqHead;
    this.data = null;
    // FIXME: pass bytesPerPixel somehow!
    //this.bytesPerPixel = 2;
}

var p = RRERect.prototype;

p.encodingType = function encodingType () {
    return 'RRE';
};


p.requiredLength = function requiredLength () {
    if ( this.data && this.data.length === 2 ) {
        return 0;
    }
    if ( typeof this.numberOfSubrectangles === 'undefined' ) {
        return 4 + this.bytesPerPixel;
    }
    else {
        return this.numberOfSubrectangles * (8+this.bytesPerPixel);
    }
};


p.addChunk = function addChunk (chunk) {
    if ( typeof this.numberOfSubrectangles === 'undefined' ) {
        this.numberOfSubrectangles = chunk.readUInt32BE(0);
        this.data = [chunk];
    }
    else {
        this.data.push(chunk);
    }
};

module.exports = RRERect;