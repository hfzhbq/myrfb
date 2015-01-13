var test = require('../support/test');
var expect = test.expect;

describe('ServerMessageFactory', function () {
    it.skip('should exist', function (done) {
        expect(this.ServerMessageFactory).to.exist;
        done();
    });
    
    describe('.prepare(msgName)', function () {
        it.skip('should be a static method', function (done) {
            expect(this.ServerMessageFactory.prepare).to.be.a('function');
            done();
        });
    });
});
