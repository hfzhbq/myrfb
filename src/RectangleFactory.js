var PredefinedRectangles = require('./PredefinedRectangles');

var CustomRectangles = {};

function create (rectHead) {
    //var t = rectHead.encodingType;
    var rect = PredefinedRectangles.create(rectHead);
    
    if ( rect === null ) {
        if ( typeof CustomRectangles[rectHead.encodingType] === 'function' ) {
            rect = new CustomRectangles[rectHead.encodingType](rectHead);
        }
        else {
            throw Error('Can\t create Rectangle: encoding is unknown: ' + rectHead.encodingType);
        }
    }
    
    rect.toBuffer = toBuffer;
    return rect;
}

function addRectangle (encodingType, Constr) {
    CustomRectangles[encodingType] = Constr;
}

function toBuffer () {
    var head = new Buffer(12);
    
    var data = Array.isArray(this.data) ?
        this.data.slice() : (this.data instanceof Buffer) ?
        [this.data] : [];
    
    data.unshift(head);
    
    head.writeUInt16BE(this.head.xPosition, 0);
    head.writeUInt16BE(this.head.yPosition, 2);
    head.writeUInt16BE(this.head.width, 4);
    head.writeUInt16BE(this.head.height, 6);
    head.writeInt32BE(this.head.encodingType, 8);
    
    
    return Buffer.concat.call(Buffer, data);
}

module.exports = {
    create: create,
    addRectangle: addRectangle
};