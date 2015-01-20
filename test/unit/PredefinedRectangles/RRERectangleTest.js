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
            encodingType: 2
        };

        this.rre = PR.create(this.reqHead);

        // FIXME: this should come from protocol somehow!!!
        this.rre.bytesPerPixel = 2;

        done();
    });

    it('should be created with RectangleFactory.create', function (done) {
        expect(this.rre).to.exist;
        done();
    });

    describe('#encodingType()', function () {
        it('should return "RRE"', function (done) {
            expect(this.rre.encodingType()).to.equal('RRE');
            done();
        });
    });
    
    
    describe('#requiredLength()', function () {
        it('should return 4 + bytesPerPixel if no numberOfSubrectangles is set', function (done) {
            expect(this.rre.requiredLength()).to.equal(4+this.rre.bytesPerPixel);
            done();
        });
        
        it('should return numberOfSubrectangles * (8+bytesPerPixel) when numberOfSubrectangles is defined', function (done) {
            var nsr = 4;
            this.rre.numberOfSubrectangles = nsr;
            
            expect(this.rre.requiredLength()).to.equal(nsr*(8+this.rre.bytesPerPixel));
            
            done();
        });
    });
    
    
    describe('#addChunk(chunk)', function () {
        beforeEach(function (done) {
            this.numberOfSubrectangles = 3;
            this.head = new Buffer(4+this.rre.bytesPerPixel);
            this.head.writeUInt32BE(this.numberOfSubrectangles, 0);
            done();
        });
        
        it('should 1) set numberOfSubrectangles and push the header data to #data[]', function (done) {
            expect(this.rre.data).to.be.null;
            this.rre.addChunk(this.head);
            
            expect(this.rre.numberOfSubrectangles).to.equal(this.numberOfSubrectangles);
            expect(this.rre.data).to.deep.equal([this.head]);
            done();
        });
        
        it('should 2) push chunk to data and make #requiredLength() return 0', function (done) {
            this.rre.numberOfSubrectangles = this.numberOfSubrectangles;
            this.rre.data = [this.head];
            
            var chunk = new Buffer( this.rre.requiredLength() );
            
            this.rre.addChunk(chunk);
            
            expect(this.rre.data).to.deep.equal([this.head, chunk]);
            expect(this.rre.requiredLength()).to.equal(0);
            done();
        });
    });


});