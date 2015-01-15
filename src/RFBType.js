var BASE_TYPES = {
    U8:     'UInt8',
    U16:    'UInt16BE',
    U32:    'UInt32BE',
    S8:     'Int8',
    S16:    'Int16BE',
    S32:    'Int32BE'
};

var COMPLEX_TYPES = {
    U8STRING:   {
        read:   readU8String
    },
    PIXEL_FORMAT: {
        read:   readPixelFormat
    }
};

function baseTypeArray (buf, pos, method, l, nbytes) {
    var result = [];
    var i;
    
    for ( i = 0; i < nbytes; i+=l ) {
        result.push(
            buf[method](pos)
        );
        pos += l;
    }
    
    return result;
}


function readU8String (buf, pos, nbytes) {
    return buf.toString('utf8', pos, pos+nbytes);
}

function readPixelFormat (buf, pos, nbytes) {
    var format = {};
    
    if ( nbytes !== 16 ) {
        throw Error('nbytes value for type PIXEL_FORMAT must be exactly 16');
    }
    
    format.bitsPerPixel     = buf.readUInt8(pos+0);
    format.depth            = buf.readUInt8(pos+1);
    format.bigEndianFlag    = buf.readUInt8(pos+2);
    format.trueColourFlag   = buf.readUInt8(pos+3);
    format.redMax           = buf.readUInt16BE(pos+4);
    format.greenMax         = buf.readUInt16BE(pos+6);
    format.blueMax          = buf.readUInt16BE(pos+8);
    format.redShift         = buf.readUInt8(pos+10);
    format.greenShift       = buf.readUInt8(pos+11);
    format.blueShift        = buf.readUInt8(pos+12);
    
    return format;
}


function fromBuffer (buf, pos, type, nbytes) {
    var method, l;
    
    if ( typeof type !== 'string' ) {
        throw Error('The type is required and must be a string');
    }
    
    if ( typeof nbytes !== 'number' || nbytes < 1 ) {
        throw Error('The nbytes is required and must be a positive number');
    }
    
    type = type.toUpperCase();
    
    if ( BASE_TYPES[type] ) {
        l = parseInt(type.substr(1), 10) / 8;
        if ( nbytes % l !== 0 ) {
            throw Error('nbytes value for type ' + type + ' must be multiple of ' + l);
        }
        
        method = 'read' + BASE_TYPES[type];
        
        if ( nbytes === l ) {
            return buf[method](pos);
        }
        
        return baseTypeArray(buf, pos, method, l, nbytes);
    }
    else if ( COMPLEX_TYPES[type] && typeof COMPLEX_TYPES[type].read === 'function' ) {
        return COMPLEX_TYPES[type].read(buf, pos, nbytes);
    }
    
    throw Error('Unknown type "' + type + '"');
}



module.exports = {
    fromBuffer: fromBuffer
};