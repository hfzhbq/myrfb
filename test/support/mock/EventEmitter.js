var sinon = require('sinon');

module.exports = function (options) {
    var ee = function () {};
    
    ee.prototype.on = sinon.stub();
    ee.prototype.mit = sinon.stub();
    
    return ee;
};