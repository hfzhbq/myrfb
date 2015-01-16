var test = require('../support/test');
var expect = test.expect;

describe('MessageFactory', function () {
    beforeEach(function (done) {
        this.plans = {
            predefinedPlan: [{nbytes:1, type: 'U8', name: 'some name'}]
        };
        
        this.data = { 'some name': 8 };

        this.RFBType = test.mock('RFBType');
        this.MessageFactory = test.proxyquire('../../src/MessageFactory', {
            './plans': this.plans,
            './RFBType': this.RFBType
        });
        done();
    });
    
    
    describe('.prepareOutgoing(plan, data)', function () {
        it('should be a static method', function (done) {
            expect(this.MessageFactory.prepareOutgoing).to.be.a('function');
            done();
        });
        
        it('should require data', function (done) {
            var MF = this.MessageFactory;
            
            expect(function () {
                MF.prepareOutgoing('predefinedPlan');
            }).to.throw('data are required');
            
            done();
        });
        
        it('should return an outgoing message', function (done) {
            var msg = this.MessageFactory.prepareOutgoing('predefinedPlan', this.data);

            expect(msg).to.exist
            .and.to.be.instanceof(this.MessageFactory.Message);

            // TODO: isIncoming(), isOutgoing() ?

            done();
        });
        
        it('should initialize properties', function (done) {
            var msg = this.MessageFactory.prepareOutgoing('predefinedPlan', this.data);
            expect(msg.getProperty('some name')).to.equal(this.data['some name']);
            done();
        });
        
        it('should calculate lengths', function (done) {
            var descr = [
                {type: 'u32', nbytes: 4, name: 'length'},
                {type: 'u8', nbytes: 'length', name: 'numbers'}
            ];
            var numbers = [1, 2, 3, 4, 5];
            
            this.MessageFactory.addPlan('custom', descr);
            var msg = this.MessageFactory.prepareOutgoing('custom', {numbers: numbers});
            
            expect(msg.getProperty('length')).to.equal(numbers.length);
            
            done();
        });
        
        it('should correctly calculate length for 16bit base types', function (done) {
            var descr = [
                {type: 'u32', nbytes: 4, name: 'length'},
                {type: 'S16', nbytes: 'length', name: 'numbers'}
            ];
            var numbers = [1, 2, 3, 4, 5];

            this.MessageFactory.addPlan('custom', descr);
            var msg = this.MessageFactory.prepareOutgoing('custom', {numbers: numbers});

            expect(msg.getProperty('length')).to.equal(2*numbers.length);
            
            done();
        });
        
        it('should correctly calculate length for 32bit base types', function (done) {
            var descr = [
                {type: 'u32', nbytes: 4, name: 'length'},
                {type: 'u32', nbytes: 'length', name: 'numbers'}
            ];
            var numbers = [1, 2, 3, 4, 5];

            this.MessageFactory.addPlan('custom', descr);
            var msg = this.MessageFactory.prepareOutgoing('custom', {numbers: numbers});

            expect(msg.getProperty('length')).to.equal(4*numbers.length);

            done();
        });

        
        it('should throw if some value is missing', function (done) {
            var descr = [
                {type: 'u32', nbytes: 4, name: 'length'},
                {type: 'u8', nbytes: 'length', name: 'numbers'}
            ];
            
            var MF = this.MessageFactory;
            
            MF.addPlan('custom', descr);
            
            expect( function () {
                MF.prepareOutgoing('custom', {});
            }).to.throw('missing value for property');
            
            done();
        });
        
        
        it('should respect defaults', function (done) {
            var descr = [
                {type: 'u32', nbytes: 4, name: 'length', default: 15},
            ];

            var MF = this.MessageFactory;
            var msg;

            MF.addPlan('custom', descr);

            expect( function () {
                msg = MF.prepareOutgoing('custom', {});
            }).to.not.throw();
            
            expect(msg.getProperty('length')).to.equal(15);
            
            done();
        });
        
        it('should ignore padding', function (done) {
            var descr = [
                {type: 'u8', nbytes: 1, name: 'a'},
                {type: 'padding', nbytes: 3},
                {type: 'u32', nbytes: 4, name: 'c'}
            ];

            var data = {a: 1, c: 32};
            
            var MF = this.MessageFactory;

            MF.addPlan('custom', descr);
            expect( function () {
                var msg = MF.prepareOutgoing('custom', data);
            }).to.not.throw();
            
            done();
        });
    });
    
    
    describe('#name()', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareOutgoing('predefinedPlan', this.data);
            expect(msg.name).to.be.a('function');
            done();
        });

        it('should return the name of the plan', function (done) {
            var msg = this.MessageFactory.prepareOutgoing('predefinedPlan', this.data);
            expect(msg.name()).to.equal('predefinedPlan');
            done();
        });
    });
    
    describe('#requiredLength()', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareOutgoing('predefinedPlan', this.data);
            expect(msg.requiredLength).to.be.a('function');
            done();
        });
        
        it('should return required buffer length', function (done) {
            var descr = [
                {type: 'u8', nbytes: 1, name: 'a'},
                {type: 'padding', nbytes: 3, name: 'b'},
                {type: 'u32', nbytes: 4, name: 'c'}
            ];
            
            var data = {a: 1, c: 32};
            
            this.MessageFactory.addPlan('custom', descr);
            var msg = this.MessageFactory.prepareOutgoing('custom', data);
            
            expect(msg.requiredLength()).to.equal(8);
            done();
        });
        
        it('should work with variable-length messages', function (done) {
            var descr = [
                {type: 'u32', nbytes: 4, name: 'a'},
                {type: 's16', nbytes: 'a', name: 'b'}
            ];

            var data = {b: [1, 2]};

            this.MessageFactory.addPlan('custom', descr);
            var msg = this.MessageFactory.prepareOutgoing('custom', data);

            expect(msg.requiredLength()).to.equal(4+2*data.b.length);
            done();
        });
    });
    
    describe('#getPoperty(propertyName)', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareOutgoing('predefinedPlan', this.data);
            expect(msg.getProperty).to.be.a('function');
            done();
        });
    });
    
    
    
    describe('#toBuffer()', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareOutgoing('predefinedPlan', this.data);

            expect(msg.toBuffer).to.be.a('function');
            done();
        });
        
        it('should return a buffer with data', function (done) {
            var descr = [
                {type: 'u8', nbytes: 1, name: 'a'},
                {type: 'padding', nbytes: 3},
                {type: 'u32', nbytes: 4, name: 'c'},
                {type: 's32', nbytes: 'c', name: 'd'}
            ];
            
            var data = {
                a:  12,
                d:  [2, 4, 6, 8, 10]
            };
            
            var aBuffer = test.sinon.match.instanceOf(Buffer);
            
            var MF = this.MessageFactory;
            MF.addPlan('custom', descr);
            var msg = MF.prepareOutgoing('custom', data);
            var buf = msg.toBuffer();
            
            expect(buf).to.be.instanceOf(Buffer);
            expect(buf.length).to.equal(1 + 3 + 4 + 4 * data.d.length);
            
            expect(this.RFBType.toBuffer).calledThrice
            .and.calledWithMatch(aBuffer, 0, 'u8', data.a)
            .and.calledWithMatch(aBuffer, 4, 'u32', 4*data.d.length)
            .and.calledWithMatch(aBuffer, 8, 's32', data.d);
            done();
        });

    });


});