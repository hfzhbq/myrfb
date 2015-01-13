var sinon = require('sinon');

module.exports = function (options) {
    var async = {};
    
    async.waterfall = sinon.stub();
    
    return async;
};