var test = require('../../support/test');
var expect = test.expect;
var PR = require('../../../src/PredefinedRectangles');

describe('ZRLE rectangle', function () {
    beforeEach(function (done) {
        this.reqHead = {
            xPosition:  100,
            yPosition:  110,
            width:      400,
            height:     200,
            encodingType:16
        };

        this.zrle = PR.create(this.reqHead);

        // FIXME: this should come from protocol somehow!!!
        this.zrle.bytesPerPixel = 2;

        done();
    });

    it('should be created with RectangleFactory.create', function (done) {
        expect(this.zrle).to.exist;
        done();
    });

    describe('#encodingType()', function () {
        it('should return "ZRLE"', function (done) {
            expect(this.zrle.encodingType()).to.equal('ZRLE');
            done();
        });
    });
    
    describe('#requiredLength()', function () {
        it('should return 4 in "head" state', function (done) {
            expect(this.zrle.requiredLength()).to.equal(4);
            done();
        });
        
        it('should return _length in "data" state', function (done) {
            var l = 333;
            this.zrle._state = 'data';
            this.zrle._length = l;
            
            expect(this.zrle.requiredLength()).to.equal(l);
            
            done();
        });
        
        it('should return 0 in "ready" state', function (done) {
            this.zrle._state = 'ready';
            expect(this.zrle.requiredLength()).to.equal(0);
            done();
        });
    });
    
    
    describe('#addChunk(chunk)', function () {
        it('should set #_length and set #_state to "data" and save chunk', function (done) {
            var length = 223;
            var buf = new Buffer(4);
            buf.writeUInt32BE(length, 0);
            
            this.zrle.addChunk(buf);
            
            expect(this.zrle.data).to.contain(buf);
            expect(this.zrle._state).to.equal('data');
            expect(this.zrle._length).to.equal(length);
            
            done();
        });
        
        it('should add data to #data and set #_state to "ready"', function (done) {
            this.zrle._state = 'data';
            var buf = new Buffer(123);
            
            this.zrle.addChunk(buf);
            
            expect(this.zrle.data).to.contain(buf);
            expect(this.zrle._state).to.equal('ready');
            done();
        });
    });

});