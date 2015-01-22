var util = require('util');
var F = util.format;

var predefinedPlans = require('./plans');
var RFBType = require('./RFBType');

// TODO: this may be generalized as "Dynamic messages"
var FramebufferUpdate = require('./FramebufferUpdate');

var customPlans = {};

var CLIENT_TO_SERVER = {
    0:  'SetPixelFormat',
    2:  'SetEncodings',
    3:  'FramebufferUpdateRequest',
    4:  'KeyEvent',
    5:  'PointerEvent',
    6:  'ClientCutText'
};

var SERVER_TO_CLIENT = {
    0:  'FramebufferUpdate',
    1:  'SetColourMapEntries',
    2:  'Bell',
    3:  'ServerCutText'
};

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
    // FIXME: FramebufferUpdate requires the instantiation of each Rectangle
    // FIXME when the number of rectangles is known
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
        
        v = typeof data[pl.name] === 'undefined' ? pl.default : data[pl.name];
        if ( typeof v === 'undefined' ) {
            throw Error('missing value for property "' + pl.name + '"');
        }
        
        this._setProperty(pl.name, v);
        if ( typeof pl.nbytes === 'string' ) {
            l = data[pl.name].length;
            // length to nbytes
            /*
            if ( pl.type.substr(1) === '16' ) {
                l *= 2;
            }
            if ( pl.type.substr(1) === '32' ) {
                l *= 4;
            }
            */
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
        
        if ( typeof nbytes === 'string' ) {
            nbytes = this._arrayNBytes(nbytes, this._plan[i].type);
        }
        
        if ( typeof nbytes === 'number' ) {
            len += nbytes;
        }
        else {
            break;
        }
    }

    return len;
};

p._arrayNBytes = function _arrayNBytes (property, type) {
    var nbytes = this.getProperty(property);
    type = type.substr(1);
    if ( typeof nbytes === 'number' ) {
        if ( type === '32' ) { nbytes *= 4; }
        if ( type === '16' ) { nbytes *= 2; }
    }
    
    return nbytes;
};

p.getProperty = function getProperty (propertyName) {
    return this._properties[propertyName];
};

p._setProperty = function _setProperty (propertyName, value) {
    this._properties[propertyName] = value;
};

p.toObject = function () {
    return this._properties;
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
            if ( nbytes === 1 && typeof descr.nbytes === 'string' ) {
                value = [value];
            }
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
            this._arrayNBytes(part.nbytes, part.type) : part.nbytes;
        
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
    var plan, msg;
    
    if ( planName === 'FramebufferUpdate' ) {
        msg = FramebufferUpdate.prepareIncoming();
        return msg;
    }
    
    plan = this.getPlan(planName);
    msg = new Message(planName, plan);
    return msg;
}


function guessAndPrepareIncoming (messageType, isServer) {
    var index = isServer ? CLIENT_TO_SERVER : SERVER_TO_CLIENT;
    var messageName = index[messageType];
    
    if ( typeof messageName === 'string' ) {
        return this.prepareIncoming(messageName);
    }
    
    throw Error(F('Unknown message type %d', messageType));
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
    
    guessAndPrepareIncoming: guessAndPrepareIncoming,
    prepareIncoming:    prepareIncoming,
    prepareOutgoing:    prepareOutgoing,
    
    Message:    Message
};