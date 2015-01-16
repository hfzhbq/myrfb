var sinon = require('sinon');

module.exports = function (options) {
    var MF = {};
    
    MF.prepareIncoming = sinon.stub();
    MF.prepareOutgoing = sinon.stub();
    
    return MF;
};