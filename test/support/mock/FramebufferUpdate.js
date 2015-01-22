var sinon = require('sinon');

module.exports = function (options) {
    var FBU = {};
    
    FBU.prepareIncoming = sinon.stub();
    
    return FBU;
};