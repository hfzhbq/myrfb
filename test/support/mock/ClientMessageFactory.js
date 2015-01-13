var sinon = require('sinon');

module.exports = function (options) {
    var CMF = {};
    
    CMF.create = sinon.stub();
    
    return CMF;
};