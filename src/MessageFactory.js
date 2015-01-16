var util = require('util');
var F = util.format;
// TODO: use require-directory there %-)
var predefinedPlans = require('./plans');
var RFBType = require('./RFBType');

var customPlans = {};

function getPlan (planName) {
    var plan = predefinedPlans[planName] || customPlans[planName] || null;

    if ( ! plan ) {
        throw Error('The message plan is not defined: ' + planName);
    }

    return plan.slice();
}

function addPlan (planName, description) {
    if ( typeof predefinedPlans[planName] !== 'undefined' ) {
        throw Error('Uable to replace predefined plan ' + planName);
    }
    
    this.checkPlan(description);
    
    customPlans[planName] = description;
}


function checkPlan (descr) {
    var context = {};
    
    if ( ! Array.isArray(descr) || descr.length === 0 ) {
        throw Error('Message plan description must be a non-empty array');
    }
    
    descr.forEach( function (p, i) {
        // types are required strings
        if ( typeof p.type !== 'string' || p.type === '') {
            throw Error( F('in element %d: type must be a non-empty string', i) );
        }
        
        // nbytes must be defined
        if ( typeof p.nbytes === 'string' ) {
            // special case
            if ( p.nbytes === '' ) {
                throw Error( F('in element %d: nbytes must be positive integer or a reference to property', i) );
            }
            if ( typeof context[p.nbytes] === 'undefined' ) {
                throw Error( F('in element %d: nbytes refers to unread property %s', i, p.nbytes) );
            }
        }
        else if ( typeof p.nbytes !== 'number' || p.nbytes === 0 ) {
            throw Error( F('in element %d: nbytes must be positive integer or a reference to property', i) );
        }
        
        context[p.name] = true;
    });

}


function Message (planName, plan, data) {
    this._planPos = 0;
    this._name = planName;
    this._plan = plan;
    this._properties = {
    };
    
    this._feedData(data);
};


var p = Message.prototype;

p.name = function () {
    return this._name;
};

p._feedData = function _feedData (data) {
    var pl, i, v, l;
    
    if ( typeof data !== 'object' ) {
        return;
    }
    
    for ( i = this._plan.length - 1; i >= 0; i-- ) {
        pl = this._plan[i];
        
        if ( 'PADDING' === pl.type.toUpperCase() ) {
            continue;
        }
        
        v = this.getProperty(pl.name);
        if ( typeof v !== 'undefined' ) {
            // already set (e.g. by length calculation
            continue;
        }
        
        v = data[pl.name] || pl.default;
        if ( typeof v === 'undefined' ) {
            throw Error('missing value for property "' + pl.name + '"');
        }
        
        this._setProperty(pl.name, v);
        if ( typeof pl.nbytes === 'string' ) {
            l = data[pl.name].length;
            // length to nbytes
            if ( pl.type.substr(1) === '16' ) {
                l *= 2;
            }
            if ( pl.type.substr(1) === '32' ) {
                l *= 4;
            }
            this._setProperty(pl.nbytes, l);
        }
    }
};

p.requiredLength = function requiredLength () {
    var i = this._planPos;
    var l = this._plan.length;
    var len = 0;
    var nbytes;

    for ( ; i < l; i++ ) {
        nbytes = this._plan[i].nbytes;
        nbytes = typeof nbytes === 'string' ?
            this.getProperty(nbytes) : nbytes;

        if ( typeof nbytes === 'number' ) {
            len += nbytes;
        }
        else {
            break;
        }
    }

    return len;
};

p.getProperty = function getProperty (propertyName) {
    return this._properties[propertyName];
};

p._setProperty = function _setProperty (propertyName, value) {
    this._properties[propertyName] = value;
};

p.addChunk = function addChunk (chunk) {
    var error = chunk.length === this.requiredLength() ?
        null : chunk.length > this.requiredLength() ?
        'much' : 'little';

    var chunkPos = 0;
    var descr, value, nbytes;

    if (error) {
        throw Error('Chunk contains too '+error+' data');
    }

    while (this._planPos < this._plan.length && chunkPos < chunk.length) {
        descr = this._plan[this._planPos];
        
        if ( 'PADDING' !== descr.type.toUpperCase() ) {
            nbytes = typeof descr.nbytes === 'string' ?
                this.getProperty(descr.nbytes) : descr.nbytes;
            
            value = RFBType.fromBuffer(chunk, chunkPos, descr.type, nbytes);
            
            this._setProperty(descr.name, value);
        }
        
        chunkPos += descr.nbytes;
        this._planPos++;
    }
};

p.toBuffer = function toBuffer() {
    var buf = new Buffer( this.requiredLength() );
    var planPos = 0;
    var bufPos  = 0;
    var part, nbytes, value;
    
    while ( bufPos < buf.length && planPos < this._plan.length ) {
        part = this._plan[planPos];
        nbytes = typeof part.nbytes === 'string' ?
            this.getProperty(part.nbytes) : part.nbytes;
        
        if ( part.type.toUpperCase() !== 'PADDING' ) {
            value = this.getProperty(part.name);
            RFBType.toBuffer(buf, bufPos, part.type, value);
        }
        
        bufPos += nbytes;
        planPos++;

    }
    
    return buf;
};

function prepareIncoming (planName) {
    var plan = this.getPlan(planName);
    var msg = new Message(planName, plan);
    return msg;
}


function prepareOutgoing (planName, data) {
    if ( typeof data !== 'object' ) {
        throw Error('can not prepare outgoing message "'+planName+'": data are required');
    }
    var plan = this.getPlan(planName);
    var msg = new Message(planName, plan, data);
    return msg;
}


module.exports = {
    getPlan:    getPlan,
    addPlan:    addPlan,
    checkPlan:  checkPlan,
    
    prepareIncoming:    prepareIncoming,
    prepareOutgoing:    prepareOutgoing,
    
    Message:    Message
};