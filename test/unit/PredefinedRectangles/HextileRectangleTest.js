var test = require('../../support/test');
var expect = test.expect;
var PR = require('../../../src/PredefinedRectangles');

describe('Hextile rectangle', function () {
    beforeEach(function (done) {
        this.reqHead = {
            xPosition:  100,
            yPosition:  110,
            width:      410,
            height:     200,
            encodingType: 5
        };

        this.hextile = PR.create(this.reqHead);

        // FIXME: this should come from protocol somehow!!!
        this.hextile.bytesPerPixel = 2;

        done();
    });

    it('should be created with RectangleFactory.create', function (done) {
        expect(this.hextile).to.exist;
        done();
    });
    
    it('should set irow/nrows, icol/ncols, rightWidth, bottomHeight properties', function (done) {
        expect(this.hextile.irow).to.equal(0);
        expect(this.hextile.icol).to.equal(0);
        expect(this.hextile.nrows).to.equal(13);
        expect(this.hextile.ncols).to.equal(26);
        expect(this.hextile.rightWidth).to.equal(10);
        expect(this.hextile.bottomHeight).to.equal(8);
        done();
    });

    describe('#encodingType()', function () {
        it('should return "Hextile"', function (done) {
            expect(this.hextile.encodingType()).to.equal('Hextile');
            done();
        });
    });
    
    
    describe('#requiredLength()', function () {
        it('should return 0 in "ready" state', function (done) {
            this.hextile._state = 'ready';
            expect(this.hextile.requiredLength()).to.equal(0);
            done();
        });
        
        describe('next tile is 16x16', function () {
            it('should return 1 in tileHead state', function (done) {
                expect(this.hextile._state).to.equal('tileHead');
                expect(this.hextile.requiredLength()).to.equal(1);
                done();
            });
            
            it('should return w*h*bytesPerPixel in tileBody state for raw tile', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 1;
                
                expect(this.hextile.requiredLength()).to.equal(this.hextile.bytesPerPixel*16*16);
                
                done();
            });
            
            it('should return bytesPerPixel for BackroundSpecified-only subencoding', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 2;
                
                expect(this.hextile.requiredLength()).to.equal(this.hextile.bytesPerPixel);
                
                done();
            });
            
            it('should return 2 * bytesPerPixel for BackgroundSpecified and ForegroundSpecified', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 6;

                expect(this.hextile.requiredLength()).to.equal(2*this.hextile.bytesPerPixel);

                done();
            });
            
            it('should return bytesPerPixel for ForegroundSpecified-only subencoding', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 4;

                expect(this.hextile.requiredLength()).to.equal(this.hextile.bytesPerPixel);

                done();
            });
            
            it('should return 1 for AnySubrects to fetch numberOfSubrectangles', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 8;
                expect(this.hextile.requiredLength()).to.equal(1);
                done();
            });
            
            it('should return 1 + 2 * bytesPerPixel if AnySubrects and BackgroundSpecified and ForegroundSpecified are set', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 30;
                expect(this.hextile.requiredLength()).to.equal(1+2*this.hextile.bytesPerPixel);
                done();
            });
            
            it('should return _numberOfSubrectangles * 2 in subtiles mode if not SubrectsColoured', function (done) {
                this.hextile._state = 'subtiles';
                this.hextile._subencodingMask = 8;
                this.hextile._numberOfSubrectangles = 4;
                expect(this.hextile.requiredLength()).to.equal(2*this.hextile._numberOfSubrectangles);
                
                done();
            });
            
            it('should return _numberOfSubrectangles * (4+bytesPerPixel) in subtiles mode if SubrectsColoured', function (done) {
                this.hextile._state = 'subtiles';
                this.hextile._subencodingMask = 24;
                this.hextile._numberOfSubrectangles = 4;
                expect(this.hextile.requiredLength()).to.equal((4+this.hextile.bytesPerPixel)*this.hextile._numberOfSubrectangles);

                done();
            });
        });
        
        describe('next tile is not 16x16', function () {
            it('should return rightWidth*16*bytesPerPixel in tileBody state for raw tile (right edge tile)', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 1;
                this.hextile.icol = this.hextile.ncols - 1;

                expect(this.hextile.requiredLength()).to.equal(this.hextile.bytesPerPixel*16*this.hextile.rightWidth);

                done();
            });
            
            it('should return rightWidth*bottomHeight*bytesPerPixel in tileBody state for raw right-bottom tile', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 1;
                this.hextile.icol = this.hextile.ncols - 1;
                this.hextile.irow = this.hextile.nrows - 1;

                expect(this.hextile.requiredLength()).to.equal(this.hextile.bytesPerPixel*this.hextile.bottomHeight*this.hextile.rightWidth);

                done();
            });
        });
    });
    
    
    
    describe('#addChunk(chunk)', function () {
        beforeEach(function (done) {
            this.tileHead = function (subencoding) {
                var buf = new Buffer(1);
                subencoding = subencoding || 1;
                buf.writeUInt8(subencoding, 0);
                return buf;
            };
            done();
        });
        
        it('should be an instance method', function (done) {
            expect(this.hextile.addChunk).to.be.a('function');
            done();
        });
        
        describe('tileHead state', function () {
            it('should set #_subencodingMask, add head to #data and set _state to "tileBody"', function (done) {
                var mask = 1;
                var chunk = this.tileHead(mask);
                this.hextile.addChunk(chunk);
                expect(this.hextile._subencodingMask).to.equal(mask);
                expect(this.hextile.data).to.contain(chunk);
                expect(this.hextile._state).to.equal('tileBody');
                done();
            });
        });
        
        describe('tileBody state', function () {
            it('should add chunk to data, and call #nextTile() if no subrectanglles expected', function (done) {
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 6;
                this.hextile.nextTile = test.sinon.stub();
                var chunk = new Buffer(2*this.hextile.bytesPerPixel);
                
                expect(this.hextile.icol).to.equal(0);
                this.hextile.addChunk(chunk);
                
                expect(this.hextile.data).to.contain(chunk);
                expect(this.hextile.nextTile).calledOnce;
                done();
            });
            
            it('should set _numberOfSubrectangles, push chunk to data, set _state to subtiles if AnySubrects', function (done) {
                var nsr = 11;
                var chunk = new Buffer(1);
                chunk.writeUInt8(nsr, 0);
                
                this.hextile._state = 'tileBody';
                this.hextile._subencodingMask = 24;
                
                this.hextile.addChunk(chunk);
                
                expect(this.hextile._numberOfSubrectangles).to.equal(nsr);
                expect(this.hextile.data).to.contain(chunk);
                expect(this.hextile._state).to.equal('subtiles');
                
                done();
            });
        });
        
        describe('subtiles state', function () {
            it('should add chunk to data and call #nextTile', function (done) {
                var chunk = new Buffer(1);
                this.hextile._state = 'subtiles';
                this.hextile.nextTile = test.sinon.stub();
                
                this.hextile.addChunk(chunk);
                
                expect(this.hextile.data).to.contain(chunk);
                expect(this.hextile.nextTile).calledOnce;
                done();
            });
        });
    });
    
    describe('#nextTile()', function () {
        it('should set _state to "tileHead"', function (done) {
            this.hextile._state = 'anyState';
            this.hextile.nextTile();
            expect(this.hextile._state).to.equal('tileHead');
            done();
        });
        
        it('should increment icol then irow', function (done) {
            expect(this.hextile.icol).to.equal(0);
            expect(this.hextile.irow).to.equal(0);
            
            this.hextile.nextTile();
            
            expect(this.hextile.icol).to.equal(1);
            expect(this.hextile.irow).to.equal(0);
            
            this.hextile.icol = this.hextile.ncols - 1;
            
            this.hextile.nextTile();
            
            expect(this.hextile.icol).to.equal(0);
            expect(this.hextile.irow).to.equal(1);
            
            done();
        });
        
        it('should set state to "ready" when finished', function (done) {
            this.hextile.icol = this.hextile.ncols - 1;
            this.hextile.irow = this.hextile.nrows - 1;
            
            this.hextile.nextTile();
            
            expect(this.hextile._state).to.equal('ready');
            
            done();
        });
    });
});