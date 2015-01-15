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


function Message (plan) {
    this._planPos = 0;
    this._plan = plan;
    this._properties = {
    };
};


var p = Message.prototype;

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

function prepare (planName) {
    var plan = this.getPlan(planName);
    var msg = new Message(plan);
    return msg;
}

module.exports = {
    getPlan:    getPlan,
    addPlan:    addPlan,
    checkPlan:  checkPlan,
    prepare:    prepare,
    Message:    Message
};