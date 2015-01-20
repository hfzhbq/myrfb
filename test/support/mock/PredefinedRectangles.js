var sinon = require('sinon');

module.exports = function (options) {
    var prs = {};
    
    prs.create = sinon.stub();
    
    return prs;
};