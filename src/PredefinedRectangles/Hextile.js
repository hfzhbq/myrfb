function HextileRectangle (reqHead) {
    this.head = reqHead;
    this.data = [];

    this.irow = 0;
    this.nrows = Math.ceil(this.head.height / 16);
    this.bottomHeight = this.head.height % 16;

    this.icol = 0;
    this.ncols = Math.ceil(this.head.width / 16);
    this.rightWidth = this.head.width % 16;

    this._state = 'tileHead';

    // FIXME: pass bytesPerPixel somehow!
    //this.bytesPerPixel = 2;
}

var p = HextileRectangle.prototype;

p.encodingType = function encodingType () {
    return 'Hextile';
};


p.requiredLength = function requiredLength () {
    var w, h, l;

    if ( this._state === 'ready' ) {
        return 0;
    }

    if ( this._state === 'tileHead' ) {
        return 1;
    }

    if ( this._state === 'tileBody' ) {
        if ( this._subencodingMask & 0x01 ) {
            w = this.icol === this.ncols - 1 ? this.rightWidth : 16;
            h = this.irow === this.nrows - 1 ? this.bottomHeight : 16;
            return this.bytesPerPixel * w * h;
        }
        l = 0;
        if ( this._subencodingMask & 0x02 ) {
            l += this.bytesPerPixel;
        }
        if ( this._subencodingMask & 0x04 ) {
            l += this.bytesPerPixel;
        }
        if ( this._subencodingMask & 0x08 ) {
            l += 1;
        }
        return l;
    }

    if ( this._state === 'subtiles' ) {
        return this._subencodingMask & 0x10 ?
            (4 + this.bytesPerPixel) * this._numberOfSubrectangles : 2 * this._numberOfSubrectangles;

    }
};



p.addChunk = function addChunk (chunk) {
    
    this.data.push(chunk);
    
    if ( this._state === 'tileHead' ) {
        this._subencodingMask = chunk.readUInt8(0);
        this._state = 'tileBody';
        return;
    }
    
    if ( this._state === 'tileBody' ) {
        if ( this._subencodingMask & 8 ) {
            this._numberOfSubrectangles = chunk.readUInt8(0);
            this._state = 'subtiles';
        }
        else {
            this.nextTile();
        }
        return;
    }
    
    if ( this._state === 'subtiles' ) {
        this.nextTile();
    }
};


p.nextTile = function nextTile () {
    this._state = 'tileHead';
    this.icol++;
    if ( this.icol === this.ncols ) {
        this.icol = 0;
        this.irow++;
    }
    
    if ( this.irow === this.nrows ) {
        this._state = 'ready';
    }
};

module.exports = HextileRectangle;