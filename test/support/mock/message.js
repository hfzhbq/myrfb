var sinon = require('sinon');

module.exports = function (options) {
    var msg = {};
    
    msg.requiredLength = sinon.stub();
    msg.addChunk = sinon.spy();
    
    return msg;
};