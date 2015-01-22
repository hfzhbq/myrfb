var test = require('../support/test');
var expect = test.expect;

describe('MessageFactory', function () {
    beforeEach(function (done) {
        this.plans = {
            predefinedPlan: [{nbytes:1, type: 'U8', name: 'some name'}]
        };
        
        this.FramebufferUpdate = test.mock('FramebufferUpdate');

        this.anyPlan = [{type: 'u8', nbytes: 1}];

        this.RFBType = test.mock('RFBType');
        this.MessageFactory = test.proxyquire('../../src/MessageFactory', {
            './plans': this.plans,
            './RFBType': this.RFBType,
            './FramebufferUpdate': this.FramebufferUpdate
        });
        done();
    });
    
    describe('.prepareIncoming(planName)', function () {
        it('should be a static method', function (done) {
            expect(this.MessageFactory.prepareIncoming).to.be.a('function');
            done();
        });

        it('should return an incoming message', function (done) {
            var msg = this.MessageFactory.prepareIncoming('predefinedPlan');
            
            expect(msg).to.exist
            .and.to.be.instanceof(this.MessageFactory.Message);
            
            // TODO: isIncoming(), isOutgoing() ?
            
            done();
        });
        
        it('should create FramebufferUpdate "dynamic" message', function (done) {
            var fbu = {a: 'FramebufferUpdate message'};
            this.FramebufferUpdate.prepareIncoming.returns(fbu);
            
            var msg = this.MessageFactory.prepareIncoming('FramebufferUpdate');
            
            expect(this.FramebufferUpdate.prepareIncoming).calledOnce;
            expect(msg).to.equal(fbu);
            
            done();
        });
    });
    
    
    
    describe('.guessAndPrepareIncoming(messageType, isServer)', function () {
        beforeEach(function (done) {
            this.MessageFactory.prepareIncoming = test.sinon.stub().returns(this.message);
            this.checkMessage = function (isServer, s) {
                var a = s.split(':');
                var messageType = a[1];
                var messageName = a[0];
                this.MessageFactory.prepareIncoming.reset();

                var msg = this.MessageFactory.guessAndPrepareIncoming(messageType, isServer);

                expect(this.MessageFactory.prepareIncoming).calledOnce
                .and.calledWithExactly(messageName);
            };
            
            done();
        });
        
        it('should be a static method', function (done) {
            expect(this.MessageFactory.guessAndPrepareIncoming).to.be.a('function');
            done();
        });
        
        describe('role=client', function () {
            beforeEach(function (done) {
                this.messages = 'FramebufferUpdate:0, SetColourMapEntries:1, Bell:2, ServerCutText:3'.split(/\s*,\s*/g);
                done();
            });
            
            it('should return Server to Client message', function (done) {
                this.messages.forEach( this.checkMessage.bind(this, false) );
                done();
            });
        });
        
        describe('role=server', function () {
            beforeEach(function (done) {
                this.messages = 'SetPixelFormat:0, SetEncodings:2, FramebufferUpdateRequest:3, KeyEvent:4, PointerEvent:5, ClientCutText:6'.split(/\s*,\s*/g);
                done();
            });
            
            it('should return Client to Server message', function (done) {
                this.messages.forEach( this.checkMessage.bind(this, true) );
                done();
            });
            
            it('should throw if mesageType is unknown', function (done) {
                var messageType = -777;
                var MF = this.MessageFactory;
                
                expect( function () {
                    MF.guessAndPrepareIncoming(messageType);
                }).to.throw('message type')
                
                done();
            });
        });
        
    });
    
    
    describe('#name()', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareIncoming('predefinedPlan');
            expect(msg.name).to.be.a('function');
            done();
        });
        
        it('should return the name of the plan', function (done) {
            var msg = this.MessageFactory.prepareIncoming('predefinedPlan');
            expect(msg.name()).to.equal('predefinedPlan');
            done();
        });
    });


    describe('#getProperty(propertyName)', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareIncoming('predefinedPlan');
            expect(msg.getProperty).to.be.a('function');
            done();
        });
    });
    
    
    describe('#toObject()', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareIncoming('predefinedPlan');
            expect(msg.toObject).to.be.a('function');
            done();
        });
    });
    

    describe('#requiredLength()', function () {
        it('should be an instance method', function (done) {
            var msg = this.MessageFactory.prepareIncoming('predefinedPlan');
            expect(msg.requiredLength).to.be.a('function');
            done();
        });

        it('should return a total length of the message given a fixed-length plan', function () {
            var MF = this.MessageFactory;
            var planName = 'custom';
            var description = [{type: 'u8', nbytes: 1}, {type: 'u8', nbytes: 3}, {type: 'u8', nbytes: 5}, {type: 'u8', nbytes: 7}];
            var length = description.reduce(function (acc, v) { return acc+v.nbytes;}, 0);

            MF.addPlan(planName, description);
            var msg = MF.prepareIncoming(planName);

            expect(msg.requiredLength()).to.equal(length);
        });

        it('should return the first part fixed length for variable length plan', function (done) {
            var MF = this.MessageFactory;
            var planName = 'custom';
            var description = [{type: 'u8', nbytes: 1}, {type: 'u8', nbytes: 3, name: 'propertyName'}, {type: 'u8', nbytes: 'propertyName'}, {type: 'u8', nbytes: 7}];
            var length = 4;

            MF.addPlan(planName, description);
            var msg = MF.prepareIncoming(planName);

            expect(msg.requiredLength()).to.equal(length);
            done();
        });

        it('should return the next known chunk length of the half-filled message', function (done) {
            var MF = this.MessageFactory;
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

            MF.addPlan(plan.name, plan.descr);
            var msg = MF.prepareIncoming(plan.name);
            msg.addChunk(buf);

            expect(msg.requiredLength()).to.equal(length);

            done();
        });

        it('should return 0 when the plan is fullfilled', function (done) {
            var MF = this.MessageFactory;
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

            MF.addPlan(plan.name, plan.descr);
            var msg = MF.prepareIncoming(plan.name);
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
            var msg = this.MessageFactory.prepareIncoming('predefinedPlan');
            expect(msg.addChunk).to.be.a('function');
            done();
        });


        it('should throw if the chunk contains too little or too much data', function (done) {
            var planName = 'customPlan';
            var descr = [{type: 'u8', nbytes:1}, {type: 'u8', nbytes:5}, {type: 'u8', nbytes:9}];
            this.MessageFactory.addPlan(planName, descr);
            var msg = this.MessageFactory.prepareIncoming(planName);
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

            this.MessageFactory.addPlan(plan.name, plan.descr);

            var msg = this.MessageFactory.prepareIncoming(plan.name);
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

            this.MessageFactory.addPlan('custom', [
                {type: 'u8', nbytes: 1, name: 'a'},
                {type: 'padding', nbytes: 3},
                {type: 'u32', nbytes: 4, name: 'b'}
            ]);

            var msg = this.MessageFactory.prepareIncoming('custom');
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

            this.MessageFactory.addPlan('custom', plan);

            var message = this.MessageFactory.prepareIncoming('custom');

            message.addChunk(buf1);
            message.addChunk(buf2);

            expect(message.getProperty('msg')).to.equal(msg);
            
            done();
        });
        
        it('should understand the arrays of basic types with length === 1', function (done) {
            var plan = [
                {type: 'u32', nbytes: 4, name: 'length'},
                {type: 'u8', nbytes: 'length', name: 'num'}
            ];

            var num = 13;
            var buf1 = new Buffer(4);
            var buf2 = new Buffer(1);

            this.RFBType.fromBuffer
            .withArgs(buf1, 0, 'u32', 4).returns(1)
            .withArgs(buf2, 0, 'u8', 1).returns(num);

            this.MessageFactory.addPlan('custom', plan);

            var message = this.MessageFactory.prepareIncoming('custom');

            message.addChunk(buf1);
            message.addChunk(buf2);

            expect(message.getProperty('num')).to.deep.equal([num]);
            
            done();
        });
    });
});