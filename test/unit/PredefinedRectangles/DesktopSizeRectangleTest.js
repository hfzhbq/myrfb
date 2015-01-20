var test = require('../../support/test');
var expect = test.expect;
var PR = require('../../../src/PredefinedRectangles');

describe('DesktopSize rectangle', function () {
    beforeEach(function (done) {
        this.reqHead = {
            xPosition:  100,
            yPosition:  110,
            width:      400,
            height:     200,
            encodingType:-223
        };

        this.ds = PR.create(this.reqHead);

        done();
    });

    it('should be created with RectangleFactory.create', function (done) {
        expect(this.ds).to.exist;
        done();
    });

    describe('#encodingType()', function () {
        it('should return "DesktopSize"', function (done) {
            expect(this.ds.encodingType()).to.equal('DesktopSize');
            done();
        });
    });
    
    describe('#requiredLength()', function () {
        it('should return 0', function (done) {
            expect(this.ds.requiredLength()).to.equal(0);
            done();
        });
    });
    
    describe('#addChunk(chunk)', function () {
        it('should be an instance method', function (done) {
            expect(this.ds.addChunk).to.be.a('function');
            done();
        });
        
        it.skip('should throw?', function (done) {
            done();
        });
    });

});