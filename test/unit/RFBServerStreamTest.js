var test = require('../support/test');
var expect = test.expect;

describe('RFBServerStream', function () {
    it.skip('should exist', function (done) {
        expect(this.RFBServerStream).to.exist;
        done();
    });
    
    describe('.create(socket)', function () {
        it.skip('should be a static method', function (done) {
            expect(this.RFBServerStream.create).to.be.a('function');
            done();
        });
    });
    
    
    describe('#receive(msg, cb)', function () {
        it.skip('should be an instance method', function (done) {
            expect(this.serverStream.receive).to.be.a('function');
            done();
        });
    });
});
