var sinon = require('sinon');

module.exports = function (options) {
    var socket = {};
    socket.send = sinon.spy();
    socket.on = sinon.spy();
    return socket;
};