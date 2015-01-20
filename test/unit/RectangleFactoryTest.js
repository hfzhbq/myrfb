var test = require('../support/test');
var expect = test.expect;

/* not clever at all!
var predefinedEncodings = [
    {
        type:   0,
        name:   'Raw'
    },
    {
        type:   1,
        name:   'CopyRect'
    },
    {
        type:   2,
        name:   'RRE'
    },
    {
        type:   5,
        name:   'Hextile'
    },
    {
        type:   16,
        name:   'ZRLE'
    },
    {
        type:   -239,
        name:   'Cursor'
    },
    {
        type:   -223,
        name:   'DesktopSize'
    },
];
*/
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
    });
});
