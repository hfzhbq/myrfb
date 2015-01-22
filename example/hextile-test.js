var fs = require('fs');
var RFBIS = require('../src/RFBIncomingStream');

var socket = fs.createReadStream('hextile.buf');
var is = RFBIS.create(socket, false);

is.setPixelFormat({
    bitsPerPixel:   32
});

is.setAsyncMode(onAsyncMessage);

function onAsyncMessage (err, msg) {
    if (err) {
        throw err;
    }
    
    var name = msg.name();
    console.log('Got async message «%s»', name);
};