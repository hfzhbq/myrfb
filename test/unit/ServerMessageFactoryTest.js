var test = require('../support/test');
var expect = test.expect;

describe('ServerMessageFactory', function () {
    beforeEach(function (done) {
        this.plans = {
            predefinedPlan: [{nbytes:1, type: 'U8', name: 'some name'}]
        };
        
        this.anyPlan = [{type: 'u8', nbytes: 1}];

        this.RFBType = test.mock('RFBType');
        this.ServerMessageFactory = test.proxyquire('../../src/ServerMessageFactory', {
            './plans': this.plans,
            './RFBType': this.RFBType
        });
        done();
    });

    it('should exist', function (done) {
        expect(this.ServerMessageFactory).to.exist;
        done();
    });

    describe('.getPlan(planName)', function () {
        it('should be a static method', function (done) {
            expect(this.ServerMessageFactory.getPlan).to.be.a('function');
            done();
        });

        it('should return a copy of a predefined plan', function (done) {
            var planName, plan;
            for ( planName in this.plans ) {
                plan = this.ServerMessageFactory.getPlan(planName);
                expect(plan).to.deep.equal(this.plans[planName]);
                expect(plan).to.not.equal(this.plans[planName]);
            }
            done();
        });

        it('should throw if the plan is not [pre]defined', function (done) {
            var smf = this.ServerMessageFactory;
            expect( function () {
                smf.getPlan('undefined plan');
            }).to.throw('plan is not defined');
            done();
        });
    });

    describe('.addPlan(planName, description)', function () {
        it('should be a static method', function (done) {
            expect(this.ServerMessageFactory.addPlan).to.be.a('function');
            done();
        });

        it('should throw if planName appears among predefined plans', function (done) {
            var planName, plan;
            var smf = this.ServerMessageFactory;
            for ( planName in this.plans ) {
                expect(function () {
                    smf.addPlan(planName, []);
                }).to.throw('replace predefined plan');
            }
            done();
        });

        it('should allow to replace a custom plan', function (done) {
            var smf = this.ServerMessageFactory;
            var anyPlan = this.anyPlan;
            expect( function () {
                smf.addPlan('customPlan', anyPlan);
                smf.addPlan('customPlan', anyPlan);
            }).to.not.throw(Error);
            done();
        });

        it('should actually add a custom plan', function (done) {
            var smf = this.ServerMessageFactory;
            var planName = 'customPlan';
            var description = [{nbytes: 2, type: 'U16', name: 'propertyName'}];

            smf.addPlan(planName, description);
            expect(smf.getPlan(planName)).to.deep.equal(description);

            done();
        });
        
        it('should check plan description for errors and throw f any', function (done) {
            var smf = this.ServerMessageFactory;
            var planName = 'customPlan';
            var description = [];
            var error = Error('wrong description');
            
            test.sinon.stub(smf, 'checkPlan');
            
            smf.addPlan(planName, description);
            
            expect(smf.checkPlan).calledOnce
            .and.calledWithExactly(description);
            
            
            smf.checkPlan.reset();
            smf.checkPlan.throws(error);
            
            expect( function () {
                smf.addPlan(planName, description);
            });
            
            smf.checkPlan.restore();
            
            done();
        });
    });
    
    
    describe('.checkPlan(description)', function () {
        it('should be a static method', function (done) {
            expect(this.ServerMessageFactory.checkPlan).to.be.a('function');
            done();
        });
        
        it('should throw for empty plan or if non-array is given', function (done) {
            var smf = this.ServerMessageFactory;
            var wrongDescriptions = [
                null, undefined, 1234, 'abcde', 
                {an: 'object'},
                [], // is empty
                test.sinon.spy()
            ];
            
            wrongDescriptions.forEach( function (d) {
                expect( function () {
                    smf.checkPlan(d);
                }).to.throw();
            });
            done();
        });
        
        it('should throw if any type or nbytes is missing', function (done) {
            var smf = this.ServerMessageFactory;
            
            expect( function () {
                smf.checkPlan([{nbytes: 5}]);
            }).to.throw();
            
            expect( function () {
                smf.checkPlan([{type: 'aaa'}]);
            }).to.throw();
            
            expect( function () {
                smf.checkPlan([{type: 'aaa', nbytes: ''}]);
            }).to.throw();
            
            expect( function () {
                smf.checkPlan([{type: 'aaa', nbytes: 'qqq'}]);
            }).to.throw();
            
            expect( function () {
                smf.checkPlan([{type: 'bbb', nbytes: 1, name: 'qqq'}, {type: 'aaa', nbytes: 'qqq'}]);
            }).to.not.throw();
            
            done();
        });
    });

    describe('.prepare(planName)', function () {
        it('should be a static method', function (done) {
            expect(this.ServerMessageFactory.prepare).to.be.a('function');
            done();
        });

        it('should return an incomplete message', function (done) {
            var msg = this.ServerMessageFactory.prepare('predefinedPlan');
            expect(msg).to.exist
            .and.to.be.instanceof(this.ServerMessageFactory.Message);
            done();
        });
    });


    describe('#getProperty(propertyName)', function () {
        it('should be an instance method', function (done) {
            var msg = this.ServerMessageFactory.prepare('predefinedPlan');
            expect(msg.getProperty).to.be.a('function');
            done();
        });
    });

    describe('#requiredLength()', function () {
        it('should be an instance method', function (done) {
            var msg = this.ServerMessageFactory.prepare('predefinedPlan');
            expect(msg.requiredLength).to.be.a('function');
            done();
        });

        it('should return a total length of the message given a fixed-length plan', function () {
            var SMF = this.ServerMessageFactory;
            var planName = 'custom';
            var description = [{type: 'u8', nbytes: 1}, {type: 'u8', nbytes: 3}, {type: 'u8', nbytes: 5}, {type: 'u8', nbytes: 7}];
            var length = description.reduce(function (acc, v) { return acc+v.nbytes;}, 0);

            SMF.addPlan(planName, description);
            var msg = SMF.prepare(planName);

            expect(msg.requiredLength()).to.equal(length);
        });

        it('should return the first part fixed length for variable length plan', function (done) {
            var SMF = this.ServerMessageFactory;
            var planName = 'custom';
            var description = [{type: 'u8', nbytes: 1}, {type: 'u8', nbytes: 3, name: 'propertyName'}, {type: 'u8', nbytes: 'propertyName'}, {type: 'u8', nbytes: 7}];
            var length = 4;

            SMF.addPlan(planName, description);
            var msg = SMF.prepare(planName);

            expect(msg.requiredLength()).to.equal(length);
            done();
        });

        it('should return the next known chunk length of the half-filled message', function (done) {
            var SMF = this.ServerMessageFactory;
            var length = 12;
            var plan = {
                name: 'custom',
                descr: [
                    {nbytes: 1, type: 'U8', name: 'a'},
                    {nbytes: 4, type: 'U32', name: 'length'}, 
                    {nbytes: 'length', type: 'U8', name: 'numbers'}
                ]
            };


            var buf = new Buffer(5);

            this.RFBType.fromBuffer
            .onCall(0).returns(1)
            .onCall(1).returns(length);

            SMF.addPlan(plan.name, plan.descr);
            var msg = SMF.prepare(plan.name);
            msg.addChunk(buf);

            expect(msg.requiredLength()).to.equal(length);

            done();
        });

        it('should return 0 when the plan is fullfilled', function (done) {
            var SMF = this.ServerMessageFactory;
            var length = 12;
            var plan = {
                name: 'custom',
                descr: [
                    {nbytes: 1, type: 'U8', name: 'a'},
                    {nbytes: 4, type: 'U32', name: 'length'}, 
                    {nbytes: 'length', type: 'U8', name: 'numbers'}
                ]
            };

            var buf;

            // first part:
            buf = new Buffer(5);

            this.RFBType.fromBuffer
            .onCall(0).returns(1)
            .onCall(1).returns(length)
            .onCall(2).returns([]);

            SMF.addPlan(plan.name, plan.descr);
            var msg = SMF.prepare(plan.name);
            msg.addChunk(buf);

            // second part
            buf = new Buffer(length);
            msg.addChunk(buf);

            expect(msg.requiredLength()).to.equal(0);

            done();
        });
    });

    describe('#addChunk(chunk)', function () {
        it('should be an instance method', function (done) {
            var msg = this.ServerMessageFactory.prepare('predefinedPlan');
            expect(msg.addChunk).to.be.a('function');
            done();
        });


        it('should throw if the chunk contains too little or too much data', function (done) {
            var planName = 'customPlan';
            var descr = [{type: 'u8', nbytes:1}, {type: 'u8', nbytes:5}, {type: 'u8', nbytes:9}];
            this.ServerMessageFactory.addPlan(planName, descr);
            var msg = this.ServerMessageFactory.prepare(planName);
            var buf = new Buffer(msg.requiredLength() - 1);

            expect( function () {
                msg.addChunk(buf);
            }).to.throw('too little');

            buf = new Buffer(msg.requiredLength() + 1);

            expect( function () {
                msg.addChunk(buf);
            }).to.throw('too much');

            done();
        });

        it('should set properties', function (done) {
            var plan = {
                name: 'customPlan',
                descr: [
                    {nbytes:1, type: 'U8', name: 'a'}, 
                    {nbytes:2, type: 'U16', name: 'b'},
                    {nbytes:4, type: 'U32', name: 'c'}
                ]};
            
            var expected = {a: 32, b: 128, c: 65535};

            var buf = new Buffer(7);
            
            this.RFBType.fromBuffer
            .withArgs(buf, 0, plan.descr[0].type, plan.descr[0].nbytes).returns(expected.a)
            .withArgs(buf, 1, plan.descr[1].type, plan.descr[1].nbytes).returns(expected.b)
            .withArgs(buf, 3, plan.descr[2].type, plan.descr[2].nbytes).returns(expected.c);

            this.ServerMessageFactory.addPlan(plan.name, plan.descr);

            var msg = this.ServerMessageFactory.prepare(plan.name);
            msg.addChunk(buf);

            expect(msg.getProperty('a')).to.equal(expected.a);
            expect(msg.getProperty('b')).to.equal(expected.b);
            expect(msg.getProperty('c')).to.equal(expected.c);

            done();
        });
        
        it('should understand and skip padding', function (done) {
            var buf = new Buffer(8);
            var a = 8;
            var b = 32;
            
            this.RFBType.fromBuffer
            .withArgs(buf, 0, 'u8', 1).returns(a)
            .withArgs(buf, 1, 'padding', 3).throws('padding is unknown to RFBType')
            .withArgs(buf, 4, 'u32', 4).returns(b);
            
            this.ServerMessageFactory.addPlan('custom', [
                {type: 'u8', nbytes: 1, name: 'a'},
                {type: 'padding', nbytes: 3},
                {type: 'u32', nbytes: 4, name: 'b'}
            ]);
            
            var msg = this.ServerMessageFactory.prepare('custom');
            msg.addChunk(buf);
            
            expect(this.RFBType.fromBuffer).calldedTwice;
            expect(msg.getProperty('a')).to.equal(a);
            expect(msg.getProperty('b')).to.equal(b);

            done();
        });
        
        it('should understand variable-length messages', function (done) {
            var plan = [
                {type: 'u32', nbytes: 4, name: 'length'},
                {type: 'u8string', nbytes: 'length', name: 'msg'}
            ];
            
            var msg = 'a 8bit message';
            var length = msg.length;
            var buf1 = new Buffer(4);
            var buf2 = new Buffer(msg);
            
            this.RFBType.fromBuffer
            .withArgs(buf1, 0, 'u32', 4).returns(length)
            .withArgs(buf2, 0, 'u8string', length).returns(msg);
            
            this.ServerMessageFactory.addPlan('custom', plan);
            
            var message = this.ServerMessageFactory.prepare('custom');
            
            message.addChunk(buf1);
            message.addChunk(buf2);
            
            expect(message.getProperty('msg')).to.equal(msg);
            done();
        });
    });
});
