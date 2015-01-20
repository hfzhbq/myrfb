var test = require('../../support/test');
var expect = test.expect;
var PR = require('../../../src/PredefinedRectangles');

describe('CopyRect rectangle', function () {
    beforeEach(function (done) {
        this.reqHead = {
            xPosition:  100,
            yPosition:  110,
            width:      400,
            height:     200,
            encodingType: 1
        };

        this.copyrect = PR.create(this.reqHead);

        // FIXME: this should come from protocol somehow!!!
        this.copyrect.bytesPerPixel = 2;

        done();
    });
    
    it('should be created with RectangleFactory.create', function (done) {
        expect(this.copyrect).to.exist;
        done();
    });
    
    describe('#encodingType()', function () {
        it('should return "CopyRect"', function (done) {
            expect(this.copyrect.encodingType()).to.equal('CopyRect');
            done();
        });
    });
    
    
    describe('#requiredLength()', function () {
        it('should return 4', function (done) {
            expect(this.copyrect.requiredLength()).to.equal(4);
            done();
        });
    });
    
    
    describe('#addChunk(chunk)', function () {
        it('should set #data property to chunk and make #requiredLength() return 0', function (done) {
            var chunk = new Buffer(4);
            this.copyrect.addChunk(chunk);
            
            expect(this.copyrect.data).to.equal(chunk);
            expect(this.copyrect.requiredLength()).to.equal(0);
            
            done();
        });
    });

});