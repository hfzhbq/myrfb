var test = require('../support/test');
var expect = test.expect;

describe('ClientMessageFactory', function () {
    
    it.skip('should exist', function (done) {
        expect(this.ClientMessageFactory).to.exist;
        done();
    });
    
    describe('.create(msgName)', function () {
        it.skip('should be a static method', function (done) {
            expect(this.create).to.be.a('function');
            done();
        });
    });
});
