var ENCODINGS = {
    0:  'Raw',
    1:  'CopyRect',
    2:  'RRE',
    5:  'Hextile',
    7:  'Tight',
    16: 'ZRLE',
    '-223': 'DesktopSize',
    '-239': 'Cursor',
    '-260': 'TightPNG'
    
};

var util = require('util');
var F = util.format;

var net = require('net');

var MyRFB = require('../src/MyRFB');
var Tight = require('myrfb-tight');

MyRFB.use(Tight);

var rfb = {
    protocol:   null,
    incremental:0,
    stats:      {
        _total: 0
    }
};

var socket = net.connect({
    host:   'localhost',
    port:   5900
}, function () {
    console.log('Socket connected');
    rfb.protocol = MyRFB.create(socket, 'client');
    rfb.protocol.on('handshake',  onHSIMessage.bind(null, 'handshake'));
    rfb.protocol.on('initialise', onHSIMessage.bind(null, 'initialise'));
    rfb.protocol.on('message', onAsyncMessage);
    
    rfb.protocol.handshake( function (err) {
        if (err) {
            console.log('Handshake is failed');
            throw err;
        }
        
        rfb.protocol.initialise( function (err) {
            if (err) {
                console.log('Initialise failed');
                throw err;
            }
            rfb.protocol.send('SetEncodings', {
                encodingTypes: [-260, 7]
            }, function (err) {
                if (err) {
                    console.log('SetEncodings failed');
                    throw err;
                }
                startPoll(rfb);
            });
        });
    });
});

function onHSIMessage (phase, msg, cb) {
    var msgName = msg.name();
    console.log('Got %s message «%s»', phase, msg.name());
    
    if ( typeof rfb[msgName] === 'function' ) {
        rfb[msgName](msg, cb);
    }
}

function onAsyncMessage (msg) {
    //console.log('Got async message %s', msg.name());
    var name = msg.name();
    if (name !== 'FramebufferUpdate') {
        return;
    }
    
    var buf = msg.toBuffer();
    rfb.stats._total += buf ? buf.length : 0;
    
    msg._rectangles.forEach( function (r) {
        var buf = r.toBuffer();
        var type = buf.readInt32BE(8);
        var name = ENCODINGS[type] || 'unknown';
        addEncodingStats(name, buf.length)
    });
}

function addEncodingStats (name, length) {
    if ( typeof rfb.stats[name] === 'undefined' ) {
        rfb.stats[name] = {
            count:  0,
            bytes:  0
        };
    }
    
    rfb.stats[name].count++;
    rfb.stats[name].bytes += length;
}

rfb.Version = function (msg, cb) {
    console.log('Server supports versions up to %s', msg.getProperty('version'));
    this.protocol.setHSIData('Version', {version: '3.8'});
    cb(null);
};

rfb.SecurityTypes = function (msg, cb) {
    var types, n, error;
    
    n = msg.getProperty('numberOfSecurityTypes');
    if ( n === 0 ) {
        console.log('Server sent an empty SecurityTypes list: retrieve an error');
        return this.receiveError(cb);
    }
    
    types = msg.getProperty('securityTypes');
    console.log('Server supports security types: [%s]', types.join(', '));
    if ( types.indexOf(1) === -1 ) {
        return cb( Error('Security is not supported yet') );
    }
    
    this.protocol.setHSIData('SecurityType', {securityType: 1});
    cb(null);
};

rfb.SecurityResult = function (msg, cb) {
    var status = msg.getProperty('status');
    
    if ( status !== 0 ) {
        console.log('Authentication failed!');
        return this.receiveError(cb);
    }
    
    console.log('Authentication passed!');
    this.protocol.setHSIData('ClientInit', {sharedFlag: 1})
    cb(null);
};


rfb.ServerInit = function (msg, cb) {
    this.fb = msg.toObject();
    var pf = this.fb.serverPixelFormat;
    
    console.log('  Framebuffer [%s]: %dx%d px @ %d bits per pixel; depth=%d, trueColourFlag=%d',
        this.fb.name,
        this.fb.framebufferWidth,
        this.fb.framebufferHeight,
        pf.bitsPerPixel,
        pf.depth, pf.trueColourFlag
    );
    
    cb(null);
};


rfb.receiveError = function (cb) {
    this.protocol.retrieve('Error', function (error, msg) {
        var errstr = msg.getProperty('reasonString');
        console.log('Server sent error: %s', errstr);
        cb( Error(errstr) );
    });
}


function startPoll (rfb) {
    rfb.interval = setInterval(function () {
        rfb.protocol.send('FramebufferUpdateRequest', {
            incremental:    rfb.incremental,
            xPosition:      0,
            yPosition:      0,
            width:          rfb.fb.framebufferWidth,
            height:         rfb.fb.framebufferHeight
        }, function (err) {
            if (err) {
                console.dir(err);
            }
            rfb.incremental = 1;
        });
    }, 66);
    
    rfb.statsInterval = setInterval( function () {
        var stats = {
            _total: _human(rfb.stats._total)
        };
        var msgName;
        
        for ( msgName in rfb.stats ) {
            if (msgName.charAt(0) === '_') {
                continue;
            }
            
            stats[msgName] = {
                count:  _human(rfb.stats[msgName].count),
                size:   _human(rfb.stats[msgName].bytes)
            }
        }
        
        console.dir(stats);
    }, 5000);
}

function _human (n) {
    var letter = ['', 'k', 'm', 'g', 't', 'p', 'e', 'z', 'y'];
    var i = 0;
    var m = n;
    var k = 1;
    
    while ( m > 1000 ) {
        k = k * 1000;
        m = n / k;
        i++;
    }
    
    m = ('' + m).split('.');
    if (m.length === 2) { m[1] = m[1].substr(0,2); }
    m = m.join('.');
    
    return '' + m + ' ' + letter[i];
}

