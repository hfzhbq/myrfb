var sinon = require('sinon');

module.exports = function (options) {
    var RFBType = {};
    
    RFBType.fromBuffer = sinon.stub();
    
    return RFBType;
};