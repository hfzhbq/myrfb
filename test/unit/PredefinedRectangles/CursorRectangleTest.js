var test = require('../../support/test');
var expect = test.expect;
var PR = require('../../../src/PredefinedRectangles');

describe('Cursor rectangle', function () {
    beforeEach(function (done) {
        this.reqHead = {
            xPosition:  100,
            yPosition:  110,
            width:      400,
            height:     200,
            encodingType:-239
        };

        this.cur = PR.create(this.reqHead);

        // FIXME: this should come from protocol somehow!!!
        this.cur.bytesPerPixel = 2;

        done();
    });

    it('should be created with RectangleFactory.create', function (done) {
        expect(this.cur).to.exist;
        done();
    });

    describe('#encodingType()', function () {
        it('should return "Cursor"', function (done) {
            expect(this.cur.encodingType()).to.equal('Cursor');
            done();
        });
    });
    
    describe('#requiredLength()', function () {
        it('should return width*height*bytesPerPixel + floor((width+7)/8)*height', function (done) {
            var expected = this.reqHead.width * this.reqHead.height * this.cur.bytesPerPixel +
                this.reqHead.height * Math.floor( (this.reqHead.width + 7) / 8);
            expect(this.cur.requiredLength()).to.equal(expected);
            done();
        });
        
        it('should return 0 in "ready" state', function (done) {
            this.cur._state = 'ready';
            expect(this.cur.requiredLength()).to.equal(0);
            done();
        });
    });
    
    describe('#addChunk(chunk)', function () {
        it('should add chunk to data and make requiredLength and set #_state to "ready"', function (done) {
            var buf = new Buffer(122);
            this.cur.addChunk(buf);
            expect(this.cur.data).to.contain(buf);
            expect(this.cur._state).to.equal('ready');
            done();
        });
    });
});