var sinon = require('sinon');

module.exports = function (options) {
    var socket = {};
    socket.write = sinon.spy();
    socket.on = sinon.spy();
    return socket;
};