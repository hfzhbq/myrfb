var test = require('../support/test');
var expect = test.expect;

describe('FramebufferUpdate', function () {
    beforeEach(function (done) {
        this.RectangleFactory = test.mock('RectangleFactory');
        
        this.FramebufferUpdate = test.proxyquire('../../src/FramebufferUpdate', {
            './RectangleFactory':   this.RectangleFactory
        });
        
        this.fbu = this.FramebufferUpdate.prepareIncoming();
        
        this.rectangle = test.mock('rectangle');
        
        done();
    });
    
    it('should exist', function (done) {
        expect(this.FramebufferUpdate).to.exist;
        done();
    });
    
    
    describe('.prepareIncoming()', function () {
        it('should be a static method', function (done) {
            expect(this.FramebufferUpdate.prepareIncoming).to.be.a('function');
            done();
        });
        
        it('should instantiate FramebufferUpdate that implements Message interface', function (done) {
            var fbu = this.fbu;
            expect(fbu).to.exist;
            expect(fbu.requiredLength).to.be.a('function');
            expect(fbu.addChunk).to.be.a('function');
            expect(fbu.name).to.be.a('function');
            expect(fbu.getProperty).to.be.a('function');
            expect(fbu.toBuffer).to.be.a('function');
            done();
        });
    });
    
    
    describe('#name()', function () {
        it('should return "FramebufferUpdate"', function (done) {
            expect(this.fbu.name()).to.equal('FramebufferUpdate');
            done();
        });
    });
    
    
    
    describe('#toBuffer()', function () {
        it('should return a buffer with length equal to rectHead length + all rectangles', function (done) {
            var rectangles = [{
                toBuffer:   function () { return new Buffer(42) },
            }, {
                toBuffer:   function () { return new Buffer(32) },
            }];
            
            var dataLength = 42 + 32;
            
            this.fbu._state = 'ready';
            this.fbu._rectangles = rectangles;
            this.fbu._setProperty('numberOfRectangles', rectangles.length);
            
            var buf = this.fbu.toBuffer();
            
            expect(buf).to.be.instanceof(Buffer)
            .and.have.length(dataLength + 4)
            
            done();
        });
    });
    
    
    
    describe('#setPixelFormat(pixelFormat)', function () {
        it('should be an instance method', function (done) {
            expect(this.fbu.setPixelFormat).to.be.a('function');
            done();
        });
        
        it('should set #bytesPerPixel', function (done) {
            var pixelFormat = {bitsPerPixel: 16};
            this.fbu.setPixelFormat(pixelFormat);
            
            expect(this.fbu.bytesPerPixel).to.equal(pixelFormat.bitsPerPixel / 8);
            
            done();
        });
    });
    
    
    describe('#requiredLength()', function () {
        
        it('should return 4 before any chunks added', function (done) {
            expect(this.fbu.requiredLength()).to.equal(4);
            done();
        });
        
        it('should return 12 in the state "rectHead"', function (done) {
            this.fbu._state = 'rectHead';
            expect(this.fbu.requiredLength()).to.equal(12);
            done();
        });
        
        it('should return requiredLength of the current rectangle in "rectBody" state', function (done) {
            var length = 66;
            this.fbu._state = 'rectBody';
            this.fbu._currentRect = this.rectangle;
            
            this.rectangle.requiredLength.returns(length);
            
            expect(this.rectangle.requiredLength).not.called;
            
            expect(this.fbu.requiredLength()).to.equal(length);
            expect(this.rectangle.requiredLength).calledOnce;
            done();
        });
        
        it('should return 0 in "ready" state', function (done) {
            this.fbu._state = 'ready';
            expect(this.fbu.requiredLength()).to.equal(0);
            done();
        });
        
        it('should throw internal error in unknown state', function (done) {
            var fbu = this.fbu;
            fbu._state = 'unknown state';
            
            expect( function () {
                fbu.requiredLength();
            }).to.throw('Internal error');
            
            done();
        });
    });
    
    
    
    describe('#addChunk(chunk)', function () {
        beforeEach(function (done) {
            this.fbu._addMSGHead = test.sinon.spy();
            this.fbu._addRectHead = test.sinon.spy();
            this.fbu._addRectBody = test.sinon.spy();
            done();
        });
        
        it('should throw if chunk is too small or too big', function (done) {
            var length = 12;
            var fbu = this.fbu;
            var chunk;
            
            fbu.requiredLength = test.sinon.stub().returns(length);
            
            chunk = new Buffer(length - 1);
            
            expect( function () {
                fbu.addChunk(chunk);
            }).to.throw();
            
            chunk = new Buffer(length + 1);
            
            expect( function () {
                fbu.addChunk(chunk);
            }).to.throw('octets long');
            
            expect(fbu.requiredLength).calledTwice;
            done();
        });
        
        
        it('should call #_addMSGHead in "msgHead" state', function (done) {
            this.fbu._state = 'msgHead';
            var chunk = new Buffer(4);
            this.fbu.addChunk(chunk);
            
            expect(this.fbu._addMSGHead).calledOnce
            .and.calledWithExactly(chunk);
            
            expect(this.fbu._addRectHead).not.called;
            expect(this.fbu._addRectBody).not.called;
            
            done();
        });
        
        it('should call #_addRectHead in "rectHead" state', function (done) {
            this.fbu._state = 'rectHead';
            var chunk = new Buffer(12);
            this.fbu.addChunk(chunk);

            expect(this.fbu._addRectHead).calledOnce
            .and.calledWithExactly(chunk);

            expect(this.fbu._addMSGHead).not.called;
            expect(this.fbu._addRectBody).not.called;
            done();
        });
        
        it('should call #_addRectBody in "rectBody" state', function (done) {
            this.fbu._state = 'rectBody';
            this.fbu._currentRect = this.rectangle;
            
            this.rectangle.requiredLength.returns(44);
            
            var chunk = new Buffer(44);
            this.fbu.addChunk(chunk);

            expect(this.fbu._addRectBody).calledOnce
            .and.calledWithExactly(chunk);

            expect(this.fbu._addRectHead).not.called;
            expect(this.fbu._addMSGHead).not.called;
            done();
        });
        
        it('should throw in "ready" state', function (done) {
            var fbu = this.fbu;
            fbu._state = 'ready';
            
            expect( function () {
                fbu.addChunk( new Buffer(0) );
            }).to.throw('No more data required');
            
            done();
        });
        
        it('should throw on unknown state (internal error)', function (done) {
            var fbu = this.fbu;
            fbu._state = 'UnknownState';
            fbu.requiredLength = test.sinon.stub().returns(0);
            
            expect( function () {
                fbu.addChunk( new Buffer(0) );
            }).to.throw('Internal error');
            
            done();
        });
    });
    
    
    describe('#_addMSGHead(chunk)', function () {
        it('should throw if messageType is not 0', function (done) {
            var fbu = this.fbu;
            var chunk = new Buffer(4);

            chunk.writeUInt8(1, 0);
            chunk.writeUInt16BE(1, 2);

            expect( function () {
                fbu._addMSGHead(chunk);
            }).to.throw('message type');

            done();
        });

        it('should set properties', function (done) {
            var chunk = new Buffer(4);
            chunk.writeUInt8(0, 0);
            chunk.writeUInt16BE(12, 2);

            this.fbu._addMSGHead(chunk);

            expect(this.fbu.getProperty('messageType')).to.equal(0);
            expect(this.fbu.getProperty('numberOfRectangles')).to.equal(12);

            done();
        });
    });
    
    
    describe('#_addRectHead(chunk)', function () {
        beforeEach(function (done) {
            this.rectangleHead = {
                xPosition:  100,
                yPosition:  200,
                width:      400,
                height:     300,
                encodingType: -33
            };
            
            this.rectangleHeadBuffer = function (h) {
                var buf = new Buffer(12);
                buf.writeUInt16BE(h.xPosition, 0);
                buf.writeUInt16BE(h.yPosition, 2);
                buf.writeUInt16BE(h.width, 4);
                buf.writeUInt16BE(h.height, 6);
                buf.writeInt32BE(h.encodingType, 8);
                return buf;
            };
            
            done();
        });
        
        it('should instantiate _curentRect', function (done) {
            var chunk = this.rectangleHeadBuffer( this.rectangleHead );
            
            this.RectangleFactory.create.returns(this.rectangle);
            
            expect(this.fbu._currentRect).to.be.null;
            
            this.fbu._addRectHead(chunk);
            
            expect(this.RectangleFactory.create).calledOnce
            .and.calledWithExactly(this.rectangleHead);
            
            expect(this.fbu._currentRect).to.equal(this.rectangle);
            
            done();
        });
        
        it('should set _currentRect.bytesPerPixel', function (done) {
            var bytesPerPixel = 4;
            var chunk = this.rectangleHeadBuffer( this.rectangleHead );
            
            this.fbu.bytesPerPixel = bytesPerPixel;
            this.RectangleFactory.create.returns(this.rectangle);

            this.fbu._addRectHead(chunk);

            expect(this.rectangle.bytesPerPixel).to.equal(bytesPerPixel);

            done();
        });
        
        it('should change the state to "rectBody"', function (done) {
            var chunk = this.rectangleHeadBuffer( this.rectangleHead );
            this.RectangleFactory.create.returns(this.rectangle);
            expect(this.fbu._state).to.not.equal('rectBody');
            this.fbu._addRectHead(chunk);
            expect(this.fbu._state).to.equal('rectBody');
            done();
        });
    });
    
    
    describe('#_addRectBody', function () {
        beforeEach(function (done) {
            this.fbu._state = 'rectBody';
            this.fbu._currentRect = this.rectangle;
            this.fbu.getProperty = test.sinon.stub();
            done();
        });
        
        it('should pass the chunk to _currentRect.addChunk', function (done) {
            var length = 44;
            
            // next chunk length %-)
            this.rectangle.requiredLength.returns(length+32);
            
            var chunk = new Buffer(length);
            
            this.fbu._addRectBody(chunk);
            expect(this.rectangle.addChunk).calledOnce
            .and.calledWithExactly(chunk);
            
            done();
        });
        
        it('should leave the state as "readBody" if the rectangle is not retrieved yet', function (done) {
            var length = 44;
            
            // next chunk length
            this.rectangle.requiredLength.returns(length + 24);
            var chunk = new Buffer(length);

            this.fbu._addRectBody(chunk);
            
            expect(this.fbu._state).to.equal('rectBody');
            done();
        });
        
        it('should change the state to "rectHead" if the current rectangle is retrieved but more rectangles expected', function (done) {
            var length = 44;
            this.fbu.getProperty.withArgs('numberOfRectangles').returns(12);
            
            // next chunk length
            this.rectangle.requiredLength.returns(0);
            var chunk = new Buffer(length);

            this.fbu._addRectBody(chunk);
            
            expect(this.fbu._state).to.equal('rectHead');

            done();
        });
        
        it('should change the state to "ready" if the current rectangle is retrieved and no more rectangles expected', function (done) {
            var length = 44;
            this.fbu.getProperty.withArgs('numberOfRectangles').returns(1);

            // next chunk length
            this.rectangle.requiredLength.returns(0);
            var chunk = new Buffer(length);

            this.fbu._addRectBody(chunk);

            expect(this.fbu._state).to.equal('ready');

            done();
        });

    });
    
    
    describe('#getProperty(name)', function () {
        it('should return undefined for "rectangles" in any state but "ready"', function (done) {
            expect(this.fbu.getProperty('rectangles')).to.be.undefined;
            done();
        });
        
        it('should return _rectangles in "ready" state', function (done) {
            var rectangles = [ {a: 'rectangle'}, {a: 'another rectangle'}];
            this.fbu._state = 'ready';
            this.fbu._rectangles = rectangles;
            
            expect(this.fbu.getProperty('rectangles')).to.equal(rectangles);
            
            done();
        });
    });
    
});
