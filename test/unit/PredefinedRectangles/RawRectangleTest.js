var test = require('../../support/test');
var expect = test.expect;
var PR = require('../../../src/PredefinedRectangles');

describe('Raw rectangle', function () {
    beforeEach(function (done) {
        this.reqHead = {
            xPosition:  100,
            yPosition:  110,
            width:      400,
            height:     200,
            encodingType: 0
        };
        
        this.raw = PR.create(this.reqHead);
        
        // FIXME: this should come from protocol somehow!!!
        this.raw.bytesPerPixel = 2;
        
        done();
    });
    
    it('should be created with RectangleFactory.create', function (done) {
        expect(this.raw).to.exist;
        done();
    });
    
    describe('#requiredLength()', function () {
        it('should return height * width * bytesPerPixel', function (done) {
            expect(this.raw.requiredLength()).to.equal(this.raw.bytesPerPixel * this.reqHead.width * this.reqHead.height);
            done();
        });
    });
    
    describe('#addChunk(chunk)', function () {
        it('should set #data property to chunk and make requiredLength() to return 0', function (done) {
            var length = this.raw.requiredLength();
            var chunk = new Buffer(length);
            this.raw.addChunk(chunk);
            
            expect(this.raw.data).to.equal(chunk);
            expect(this.raw.requiredLength()).to.equal(0);
            
            done();
        });
        
    });
    
    
    describe('#encodingType()', function () {
        it('should return "Raw"', function (done) {
            expect(this.raw.encodingType()).to.equal('Raw');
            done();
        });
    });
    
});
