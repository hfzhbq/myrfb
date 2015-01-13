var sinon = require('sinon');

module.exports = function (options) {
    var factory = {};
    
    factory.prepare = sinon.stub();
    
    return factory;
};