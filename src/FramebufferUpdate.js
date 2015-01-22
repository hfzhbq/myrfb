var util = require('util');
var F = util.format;

var RectangleFactory = require('./RectangleFactory');

function FramebufferUpdate () {
    this._properties = {};
    this._state = 'msgHead';
    this._currentRect = null;
    this._rectangles = [];
}

var p = FramebufferUpdate.prototype;

p.name = function name () {
    return 'FramebufferUpdate';
};


p.setPixelFormat = function setPixelFormat (pixelFormat) {
    this._pixelFormat = pixelFormat;
    this.bytesPerPixel = pixelFormat.bitsPerPixel / 8;
};


p.requiredLength = function requiredLength () {
    var length;
    
    switch (this._state) {
        case 'msgHead':
            length = 4;
            break;
        case 'rectHead':
            length = 12;
            break;
        case 'rectBody':
            length = this._currentRect.requiredLength();
            break;
        case 'ready':
            length = 0;
            break;
        default:
            throw Error(F('Internal error: unknown state "%s"',this._state));
            break;
    }
    
    return length;
};



p.addChunk = function addChunk (chunk) {
    var l = this.requiredLength();
    
    if ( chunk.length !== l ) {
        throw Error(F('Expected chunk %d octets long but got %d', l, chunk.length));
    }
    
    switch (this._state) {
        case 'msgHead':
            this._addMSGHead(chunk);
            break;
        case 'rectHead':
            this._addRectHead(chunk);
            break;
        case 'rectBody':
            this._addRectBody(chunk);
            break;
        case 'ready':
            throw Error(F('No more data required but got %d octets', chunk.length));
            break;
        default:
            throw Error(F('Internal error: unknown state "%s"', this._state));
            break;
    }
    
    
};


p._addMSGHead = function _addMSGHead (chunk) {
    var mt = chunk.readUInt8(0);
    if ( mt !== 0 ) {
        throw Error(F('Expected message type to be 0 but got %d', mt));
    }

    this._setProperty('messageType', 0);
    this._setProperty('numberOfRectangles', chunk.readUInt16BE(2));
    //TODO: should we check the number of rectangles is 0?
    this._state = 'rectHead';
};



p._addRectHead = function _addRectHead (chunk) {
    var head = {};
    
    head.xPosition = chunk.readUInt16BE(0);
    head.yPosition = chunk.readUInt16BE(2);
    head.width = chunk.readUInt16BE(4);
    head.height = chunk.readUInt16BE(6);
    head.encodingType = chunk.readInt32BE(8);
    
    this._currentRect = RectangleFactory.create(head);
    this._currentRect.bytesPerPixel = this.bytesPerPixel;
    this._state = 'rectBody';
};

p._addRectBody = function _addRectBody (chunk) {
    this._currentRect.addChunk(chunk);
    if ( this._currentRect.requiredLength() === 0 ) {
        this._rectangles.push(this._currentRect);
        this._currentRect = null;
        this._state = this._rectangles.length < this.getProperty('numberOfRectangles') ?
            'rectHead' : 'ready';
    }
};

p.getProperty = function getProperty (name) {
    var value;
    
    if ( name === 'rectangles' ) {
        value = this._state === 'ready' ? this._rectangles : undefined;
    }
    else {
        value = this._properties[name];
    }
    
    return value;
};

p._setProperty = function _setProperty (name, value) {
    this._properties[name] = value;
};

p.toBuffer = function () {
    var length = 4;
    var rectangles = this.getProperty('rectangles')
    var buffers = [];
    var buf;
    
    if ( ! Array.isArray(rectangles) ) {
        return;
    }
    
    buf = new Buffer(4);
    buf.writeUInt8(0, 0)
    buf.writeUInt16BE(rectangles.length, 2);
    
    buffers.push(buf);
    
    rectangles.forEach( function (r) {
        buffers.push(r.toBuffer());
    });
    
    return Buffer.concat.call(Buffer, buffers);
    
};




function prepareIncoming () {
    return new FramebufferUpdate();
}

module.exports = {
    prepareIncoming:    prepareIncoming
};