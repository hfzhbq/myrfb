function DesktopSizeRectangle (reqHead) {
    this.head = reqHead;
    this.data = [];
    
    // FIXME: pass bytesPerPixel somehow!
    //this.bytesPerPixel = 2;
}

var p = DesktopSizeRectangle.prototype;

p.encodingType= function encodingType () {
    return 'DesktopSize';
};


p.requiredLength = function requiredLength () {
    return 0;
};

p.addChunk = function addChunk (chunk) {
};

module.exports = DesktopSizeRectangle;