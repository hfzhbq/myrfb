var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');
var chai = require('chai');
chai.use( require('sinon-chai') );

var mock = require('./mock');

module.exports = {
    chai:   chai,
    expect: chai.expect,
    mock:   mock,
    sinon:  sinon,
    proxyquire: proxyquire
};