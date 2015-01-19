var sinon = require('sinon');

module.exports = function (options) {
    var r = {};
    
    r.requiredLength = sinon.stub();
    r.addChunk = sinon.stub();
    
    return r;
};