var test = require('../support/test');
var expect = test.expect;

var Plans = require('../../src/plans');

var clientToServer = 'SetPixelFormat:3:0, SetEncodings:4:2, FramebufferUpdateRequest:6:3, KeyEvent:4:4, PointerEvent:4:5, ClientCutText:4:6';
var serverToClient = 'FramebufferUpdate:4:0, SetColourMapEntries:5:1, Bell:1:2, ServerCutText:4:3';

describe('Predefined message plans', function () {

    it('should include the handshake messages plans', function (done) {
        var plans = 'Version:1, SecurityTypes:2, Error:2, SecurityType:1, SecurityResult:1';
        includes(plans);
        done();
    });

    it('should include initialization messages plans', function (done) {
        var plans = 'ClientInit:1, ServerInit:5';
        includes(plans);
        done();
    });

    it('should include client to server messages with defaults for messageType', function (done) {
        var plans = clientToServer;
        includes(plans);
        done();
    });

    it('should include server to client messages with defaults for messageType', function (done) {
        var plans = serverToClient;
        includes(plans);
        done();
    });


});

function includes (plans) {
    if ( typeof plans === 'string' ) {
        plans = plans.split(/\s*,\s*/g);
    }

    if ( ! Array.isArray(plans) || plans.length === 0 ) {
        throw Error ('plans should be either a string or an array and be non-empty!');
    }

    plans.forEach( function (p) {
        var a = p.split(':');
        var name = a[0];
        var len = parseInt(a[1], 10);

        expect(Plans)
        .to.have.property(name)
        .that.is.an('array')
        .and.has.length(len);
        
        if (a.length < 3) {return;}
        
        var mt, p0;
        try {
            mt = parseInt(a[2], 10);
            p0 = Plans[name][0];
            expect(p0).have.property('name').that.equals('messageType');
            expect(p0).have.property('default').that.equals(mt);
        }
        catch (e) {
            throw Error('expect ' + p + ' to look like Name:<nsteps>:<defaultMessageType>, i.e.: "ServerCutText:4:3"');
        }
    });
}

