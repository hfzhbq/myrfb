var sinon = require('sinon');

module.exports = function (options) {
    var RFBIS = {};
    
    RFBIS.create = sinon.stub();
    
    return RFBIS;
};