var test = require('../support/test');
var expect = test.expect;

describe('RectangleFactory', function () {
    beforeEach(function (done) {
        this.PredefinedRectangles = test.mock('PredefinedRectangles');
        this.RectangleFactory = test.proxyquire('../../src/RectangleFactory', {
            './PredefinedRectangles': this.PredefinedRectangles
        });
        done();
    });

    it('should exist', function (done) {
        expect(this.RectangleFactory).to.exist;
        done();
    });

    describe('.create(rectHead)', function () {
        it('should be a static method', function (done) {
            expect(this.RectangleFactory.create).to.be.a('function');
            done();
        });

        it('should instantiate the predefined rectangles', function (done) {
            var rectHead = {
                encodingType:   222
            };

            var rect = {a: 'predefined rectangle'};

            this.PredefinedRectangles.create.withArgs(rectHead).returns(rect);

            var res = this.RectangleFactory.create(rectHead);

            expect(this.PredefinedRectangles.create).calledOnce
            .and.calledWithExactly(rectHead);

            expect(res).to.equal(rect);

            done();
        });
        
        it('should instantiate custom rectangles', function (done) {
            var rectHead = {
                encodingType:   333
            };
            var rect = {a: 'custom rectangle'};
            var Constr = test.sinon.stub().withArgs(rectHead).returns(rect);
            this.PredefinedRectangles.create.withArgs(rectHead).returns(null);
            
            this.RectangleFactory.addRectangle(rectHead.encodingType, Constr);
            
            var res = this.RectangleFactory.create(rectHead);
            
            expect(res).to.equal(rect);
            
            done();
        });
        
        it('should throw if encoding is unknown', function (done) {
            var rectHead = {
                encodingType:   333
            };
            this.PredefinedRectangles.create.withArgs(rectHead).returns(null);
            
            var RF = this.RectangleFactory;
            
            expect( function () {
                RF.create(rectHead);
            }).to.throw('encoding is unknown');
            
            done();
        });
    });
    
    
    describe('.addRectangle(messageType, Constructor)', function () {
        it('should be a static method', function (done) {
            expect(this.RectangleFactory.addRectangle).to.be.a('function');
            done();
        });
    });


    describe('#toBuffer()', function () {
        beforeEach(function (done) {
            this.rectHead = {
                xPosition:  1,
                yPosition:  2,
                width:      3,
                height:     4,
                encodingType: 5
            };

            this.rectangle = {head: this.rectHead};

            this.PredefinedRectangles.create.withArgs(this.rectHead).returns(this.rectangle);

            done();
        });

        it('should be an instance method', function (done) {
            var rect = this.RectangleFactory.create(this.rectHead);
            expect(rect.toBuffer).to.be.a('function');
            done();
        });

        it('should return Buffer with length 12 containing rectHead if there is no data', function (done) {
            var rect = this.RectangleFactory.create(this.rectHead);
            var buf = rect.toBuffer();

            expect(buf).to.be.instanceOf(Buffer)
            .and.have.property('length').that.equals(12);

            expect(buf.readUInt16BE(4)).to.equal(this.rectHead.width);
            done();
        });

        it('should insert data too (data is a buffer)', function (done) {
            var rect = this.RectangleFactory.create(this.rectHead);
            this.rectangle.data = new Buffer(10);
            
            var buf = rect.toBuffer();
            
            expect(buf.length).to.equal(12+10);
            expect(buf.slice(12, 22).toString('hex')).to.equal(this.rectangle.data.toString('hex'));
            done();
        });
        
        it('should insert data too (data is an Array)', function (done) {
            var rect = this.RectangleFactory.create(this.rectHead);
            this.rectangle.data = [new Buffer(10), new Buffer(32)];

            var buf = rect.toBuffer();

            expect(buf.length).to.equal(12+10+32);
            
            expect(buf.slice(12, 22).toString('hex')).to.equal(this.rectangle.data[0].toString('hex'));

            done();
        });
    });
});
