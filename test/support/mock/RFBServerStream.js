var sinon = require('sinon');

module.exports = function (options) {
    var RFBSS = {};
    
    RFBSS.create = sinon.stub();
    
    return RFBSS;
};