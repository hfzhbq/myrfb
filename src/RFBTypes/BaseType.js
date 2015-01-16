var util = require('util');
var F = util.format;

var BASE_TYPES = {
    U8:     {method: 'UInt8', nbytes: 1},
    U16:    {method: 'UInt16BE', nbytes: 2},
    U32:    {method: 'UInt32BE', nbytes: 4},
    S8:     {method: 'Int8', nbytes: 1},
    S16:    {method: 'Int16BE', nbytes: 2},
    S32:    {method: 'Int32BE', nbytes: 4},
};



function BaseType (descr, value) {
    
    if ( typeof descr.type !== 'string' ||
        descr.type === '' ||
        ! BaseType.isBasic(descr.type)
       ) {
        throw Error('Type description must have type that is a string that matches /[us](8|16|32)/i');
    }
    
    this._type = descr.type.toUpperCase();
    this._BASE = BASE_TYPES[this._type];
        
    if ( descr.nbytes % this._BASE.nbytes !== 0 ) {
        throw Error(F('nbytes must be a multiple of %d for type %s', this._BASE.nbytes, this._type));
    }
    
    this._name = descr.name;
    this._value = value;
    this._nbytes = descr.nbytes;
    this._default = descr.default;
    
}

var p = BaseType.prototype;

p.name = function name () {
    return this._name;
};

p.type = function type () {
    return this._type;
};

p.fromBuffer = function fromBuffer (buf, pos) {
    if ( this._BASE.nbytes === this._nbytes ) {
        return this._value = buf['read'+this._BASE.method](pos);
    }

    var i;
    var len = this._nbytes / this._BASE.nbytes;
    this._value = [];
    for ( var i = 0; i < len; i++ ) {
        this._value.push(
            buf['read'+this._BASE.method](pos+i*this._BASE.nbytes)
        );
    }
};

p.toBuffer = function toBuffer (buf, pos) {
    var b;
    if ( Array.isArray(this._value) ) {
        b = this._BASE;
        this._value.forEach( function(n, i) {
            buf['write'+b.method](n, pos + i * b.nbytes);
        });
    }
    else {
        return buf['write'+this._BASE.method](this._value, pos);
    }
};

p.value = function value () {
    return this._value;
};

p.requiredLength = function requiredLength () {
    return this._nbytes;
};


BaseType.isBasic = function isBasic (type) {
    return typeof type === 'string' ?
        !!BASE_TYPES[type.toUpperCase()] : false;
};

module.exports = BaseType;
