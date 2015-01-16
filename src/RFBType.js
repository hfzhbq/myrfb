var util = require('util');

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
        read:   readU8String,
        write:  writeU8String
    },
    VERSION:    {
        read:   readVersion,
        write:  writeVersion
    },
    RGB:        {
        read:   readRGB,
        write:   writeRGB
    },
    PIXEL_FORMAT: {
        read:   readPixelFormat,
        write:  writePixelFormat
    }
};

function readBaseTypeArray (buf, pos, method, l, nbytes) {
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


function writeBaseTypeArray (buf, pos, l, method, arr) {
    arr.forEach( function (n, i) {
        buf[method](n, pos + i*l);
    });
}



function readU8String (buf, pos, nbytes) {
    return buf.toString('utf8', pos, pos+nbytes);
}

function writeU8String (buf, pos, string) {
    // TODO: check the return value: whether all the string was written
    buf.write(string, pos);
}


function readVersion (buf, pos, nbytes) {
    var s = buf.toString('utf8', pos, pos+nbytes);
    var maj = parseInt(s.substr(4,3), 10);
    var min = parseInt(s.substr(8,3), 10);
    
    return util.format('%d.%d',maj, min);
}

function writeVersion (buf, pos, version) {
    var a = version.split('.');
    var maj = '00' + parseInt(a[0], 10);
    var min = '00' + parseInt(a[1], 10);
    
    buf.write( util.format('RFB %s.%s\n', maj.substr(-3), min.substr(-3)), pos );
}


function readRGB (buf, pos, nbytes) {
    // FIXME: check nbytes
    var rgb = {};
    
    rgb.red = buf.readUInt16BE(pos);
    rgb.green = buf.readUInt16BE(pos+2);
    rgb.blue = buf.readUInt16BE(pos+4);
    
    return rgb;
}


function writeRGB (buf, pos, rgb) {
    buf.writeUInt16BE(rgb.red, pos);
    buf.writeUInt16BE(rgb.green, pos+2);
    buf.writeUInt16BE(rgb.blue, pos+4);
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

function writePixelFormat (buf, pos, format) {
    buf.writeUInt8(format.bitsPerPixel, pos+0);
    buf.writeUInt8(format.depth, pos+1);
    buf.writeUInt8(format.bigEndianFlag, pos+2);
    buf.writeUInt8(format.trueColourFlag, pos+3);
    buf.writeUInt16BE(format.redMax, pos+4);
    buf.writeUInt16BE(format.greenMax, pos+6);
    buf.writeUInt16BE(format.blueMax, pos+8);
    buf.writeUInt8(format.redShift, pos+10);
    buf.writeUInt8(format.greenShift, pos+11);
    buf.writeUInt8(format.blueShift, pos+12);
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

        return readBaseTypeArray(buf, pos, method, l, nbytes);
    }
    else if ( COMPLEX_TYPES[type] && typeof COMPLEX_TYPES[type].read === 'function' ) {
        return COMPLEX_TYPES[type].read(buf, pos, nbytes);
    }

    throw Error('Unknown type "' + type + '"');
}



function toBuffer (buf, pos, type, value) {
    var method, l;

    if ( typeof type !== 'string' || type == '' ) {
        throw Error('The type is required and must be a non-empty string');
    }

    type = type.toUpperCase();

    if ( BASE_TYPES[type] ) {
        method = 'write' + BASE_TYPES[type];
        if ( Array.isArray(value) ) {
            l = parseInt(type.substr(1), 10) / 8;
            return writeBaseTypeArray(buf, pos, l, method, value);
        }

        return buf[method](value, pos);
    }
    else if ( COMPLEX_TYPES[type] && typeof COMPLEX_TYPES[type].write === 'function' ) {
        return COMPLEX_TYPES[type].write(buf, pos, value);
    }

    throw Error('Type ' + type + ' is not defined');
}


module.exports = {
    fromBuffer: fromBuffer,
    toBuffer:   toBuffer
};