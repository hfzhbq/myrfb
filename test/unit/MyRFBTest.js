var test = require('../support/test');
var expect = test.expect;

describe('MyRFB', function () {
    
    beforeEach( function (done) {
        this.events = {
            EventEmitter: test.mock('EventEmitter')
        };
        this.socket = test.mock('socket');
        this.async = test.mock('async');

        this.MessageFactory = test.mock('MessageFactory');

        this.incomingStream = test.mock('incomingStream');
        this.RFBIncomingStream = test.mock('RFBIncomingStream');
        this.RFBIncomingStream.create.returns(this.incomingStream);

        this.MyRFB = test.proxyquire('../../src/MyRFB', {
            events: this.events,
            async:  this.async,
            './MessageFactory': this.MessageFactory,
            './RFBIncomingStream': this.RFBIncomingStream
        });

        this.myRFB = this.MyRFB.create(this.socket);

        done();
    });

    it('should exist', function (done) {
        expect(this.MyRFB).to.exist;
        done();
    });
    
    

    describe('.create(socket, role)', function () {
        it('should be a static method', function (done) {
            expect(this.MyRFB.create).to.be.a('function');
            done();
        });
        
        it('should construct myRFB instancewith #_state==="handshake" that is an EventEmitter', function (done) {
            expect(this.myRFB).to.exist;
            expect(this.myRFB).to.be.instanceof(this.events.EventEmitter);
            expect(this.myRFB._state).to.equal('handshake');
            done();
        });

        it('should store socket in _socket property', function (done) {
            expect(this.myRFB._socket).to.equal(this.socket);
            done();
        });

        it('should wrap socket to RFBIncomingStream and store the result to _incomingStream property', function (done) {
            expect(this.myRFB._incomingStream).to.equal(this.incomingStream);
            done();
        });
        
        it('should pass isServer() to incoming stream constructor', function (done) {
            this.RFBIncomingStream.create = test.sinon.stub();
            this.MyRFB.create(this.socket, 'server');
            
            expect(this.RFBIncomingStream.create).calledOnce
            .and.calledWithExactly(this.socket, true);
            
            this.RFBIncomingStream.create.reset();
            this.MyRFB.create(this.socket);

            expect(this.RFBIncomingStream.create).calledOnce
            .and.calledWithExactly(this.socket, false);
            done();
        });

        it('should throw if role is neither undefined, client nor server', function (done) {
            var badRoles = ['polizei', {}, null, [], test.sinon.spy()];
            var MyRFB = this.MyRFB;
            var socket = test.mock('socket');

            badRoles.forEach( function (role) {
                expect( function () {
                    var rfb = MyRFB.create(socket, role);
                }).to.throw('be either "server"');
            });

            done();
        });
    });
    
    

    describe('#isServer()', function () {
        it('should be an instance method', function (done) {
            expect(this.myRFB.isServer).to.be.a('function');
            done();
        });

        it('should return false by default', function (done) {
            expect(this.myRFB.isServer()).to.be.false;
            done();
        });

        it('should return true for protocol configured for server', function (done) {
            var rfb = this.MyRFB.create(this.socket, 'server');
            done();
        });
    });
    
    
    
    describe('#setHSIData(msgName, data)', function () {
        it('should be an instance method', function (done) {
            expect(this.myRFB.setHSIData).to.be.a('function');
            done();
        });
    });
    
    
    
    describe('#getHSIData(msgName)', function () {
        it('should be an instance method', function (done) {
            expect(this.myRFB.getHSIData).to.be.a('function');
            done();
        });
        
        it('should return data set with #setHSIData', function (done) {
            var data = {a: 'HSI message data'};
            var msgName = 'a name of a message';
            
            this.myRFB.setHSIData(msgName, data);
            
            expect(this.myRFB.getHSIData(msgName)).to.equal(data);
            
            done();
        });
    });
    
    
    describe('#getCurrentPixelFormat()', function () {
        it('should be an instance method', function (done) {
            expect(this.myRFB.getCurrentPixelFormat).to.be.a('function');
            done();
        });
        
        it('should return undefined by default', function (done) {
            expect(this.myRFB.getCurrentPixelFormat()).to.be.undefined;
            done();
        });
    });
    
    describe('#send(msgName[, data], cb)', function () {
        beforeEach( function (done) {
            this.msg = {
                a:  'client message',
                $buffer: 'a buffer',
                toBuffer: test.sinon.stub()
            };
            done();
        });
        
        it('should be an instance method', function (done) {
            expect(this.myRFB.send).to.be.a('function');
            done();
        });

        it('should use MessageFactory to create a message', function (done) {
            var msgName = 'a message name';
            var msgData = {a: 'message data'};
            var cb = test.sinon.spy();

            this.MessageFactory.prepareOutgoing.withArgs(msgName).returns(this.msg);
            this.myRFB.getHSIData = test.sinon.stub().withArgs(msgName).returns(msgData);

            this.myRFB.send(msgName, cb);

            expect(this.MessageFactory.prepareOutgoing).calledOnce
            .and.calledWithExactly(msgName, msgData);

            done();
        });

        it('should pass message.toBuffer() and and cb to the socket.write', function (done) {
            var msgName = 'a message name';
            var cb = test.sinon.spy();

            this.msg.toBuffer.returns(this.msg.$buffer);
            this.MessageFactory.prepareOutgoing.withArgs(msgName).returns(this.msg);

            this.myRFB.send(msgName, cb);

            expect(this.socket.write).calledOnce
            .and.calledWithExactly(this.msg.$buffer, cb);

            done();
        });
        
        it('should use data to prepare a message if provided', function (done) {
            var msgName = 'a message name';
            var cb = test.sinon.spy();
            var msgData = {a: 'message data'};
            
            this.msg.toBuffer.returns(this.msg.$buffer);
            this.MessageFactory.prepareOutgoing.withArgs(msgName).returns(this.msg);
            
            this.myRFB.send(msgName, msgData, cb);
            
            expect(this.MessageFactory.prepareOutgoing).calledOnce
            .and.calledWithExactly(msgName, msgData);
            
            expect(this.socket.write).calledOnce
            .and.calledWithExactly(this.msg.$buffer, cb);
            
            done();
        });
        
        it('should modify current pixel format on ServerInit or SetPixelFormat (incoming stream too!)', function (done) {
            var pixelFormat = {a: 'server pixel format'};
            var msgName = 'ServerInit';
            var msgData = {a: 'message data', serverPixelFormat: pixelFormat};
            var cb = test.sinon.spy();

            this.MessageFactory.prepareOutgoing.withArgs(msgName).returns(this.msg);
            this.myRFB.getHSIData = test.sinon.stub().withArgs(msgName).returns(msgData);
            
            this.myRFB.send(msgName, cb);

            expect(this.myRFB.getCurrentPixelFormat()).to.equal(pixelFormat);
            expect(this.incomingStream.setPixelFormat).calledOnce
            .and.calledWithExactly(pixelFormat);

            msgName = 'SetPixelFormat';
            pixelFormat = {a: 'client pixel format'};
            msgData = {a: 'message data', pixelFormat: pixelFormat};
            this.myRFB.getHSIData = test.sinon.stub().withArgs(msgName).returns(msgData);
            this.MessageFactory.prepareOutgoing.withArgs(msgName).returns(this.msg);
            this.incomingStream.setPixelFormat.reset();
            
            this.myRFB.send(msgName, cb);

            expect(this.myRFB.getCurrentPixelFormat()).to.equal(pixelFormat);
            expect(this.incomingStream.setPixelFormat).calledOnce
            .and.calledWithExactly(pixelFormat);
            done();
        });
    });

    

    
    describe('#receive(msgName, cb)', function () {
        it('should be an instance method', function (done) {
            expect(this.myRFB.receive).to.be.a('function');
            done();
        });

        it('should prepare incoming message wrapper and pass it and a callback to _incomingStream.receive', function (done) {
            var msgName = 'an incoming message name';
            var message = {an: 'incoming message'};
            var cb = test.sinon.spy();

            this.MessageFactory.prepareIncoming.withArgs(msgName).returns(message);

            this.myRFB.receive(msgName, cb);

            expect(this.incomingStream.receive).calledOnce
            .and.calledWithMatch(test.sinon.match(message), test.sinon.match.func);

            done();
        });
        
        it('should throw in "ready" sate', function (done) {
            var myRFB = this.myRFB;
            var msgName = 'an incoming message name';
            var cb = test.sinon.spy();
            myRFB._state = 'ready';
            
            expect( function () {
                myRFB.receive(msgName, cb);
            }).to.throw('asynchronous');

            done();
        });
        
        describe('the callback', function () {
            beforeEach(function (done) {
                var msgName = 'messageName';
                this.message = test.mock('message');
                this.cb = test.sinon.spy();
                this.MessageFactory.prepareIncoming.withArgs(msgName).returns(this.message);
                this.myRFB.emit = test.sinon.stub();
                this.myRFB.receive(msgName, this.cb);
                this.callback = this.incomingStream.receive.firstCall.args[1];
                done();
            });
            
            it('should emit "handshake" event in "handshake" state', function (done) {
                this.myRFB._state = 'handshake';
                this.callback(null, this.message);
                
                expect(this.myRFB.emit).calledOnce
                .and.calledWithExactly('handshake', this.message, this.cb);
                done();
            });
            
            it('should emit "initialise" event in "initialise" state', function (done) {
                this.myRFB._state = 'initialise';
                this.callback(null, this.message);

                expect(this.myRFB.emit).calledOnce
                .and.calledWithExactly('initialise', this.message, this.cb);
                done();
            });
            
            it('should modify current pixel format on ServerInit (incoming stream too!)', function (done) {
                var pixelFormat = {a: 'server pixel format'};
                var cb = test.sinon.spy();

                this.MessageFactory.prepareIncoming.withArgs('ServerInit').returns(this.message);
                this.message.name.returns('ServerInit');
                this.message.getProperty.withArgs('serverPixelFormat').returns(pixelFormat);
                this.incomingStream.receive.yields(null, this.message);

                this.myRFB.receive('ServerInit', cb);

                expect(this.myRFB.getCurrentPixelFormat()).to.equal(pixelFormat);
                expect(this.incomingStream.setPixelFormat).calledOnce
                .and.calledWithExactly(pixelFormat);
                
                done();
            });
        });
    });


    
    
    describe('#authenticate(cb)', function () {
        it('should be an instance method', function (done) {
            expect(this.myRFB.authenticate).to.be.a('function');
            done();
        });
        
        it('should simply call the callback', function (done) {
            var cb = test.sinon.spy();
            this.myRFB.authenticate(cb);
            expect(cb).calledOnce.and.calledWithExactly(null);
            done();
        });
        
        it.skip('should handle authentication', function (done) {
            
            done();
        });

    });
    
    
    
    describe('#handshake(cb)', function () {
        beforeEach( function (done) {
            this.myRFB.send = test.sinon.stub();
            this.myRFB.receive = test.sinon.stub();
            this.myRFB.authenticate = test.sinon.stub();

            done();
        });
        
        it('should be an instance method', function (done) {
            expect(this.myRFB.handshake).to.be.a('function');
            done();
        });
        
        it('should start waterfall(tasks, handler)', function (done) {
            var cb = test.sinon.spy();
            this.myRFB.handshake(cb);

            expect(this.async.waterfall).calledOnce
            .and.calledWithMatch(test.sinon.match.array, test.sinon.match.func);
            done();
        });
        
        describe('the waterfall handler(err)', function () {
            beforeEach( function (done) {
                this.cb = test.sinon.spy();
                this.myRFB.handshake(this.cb);
                this.handler = this.async.waterfall.firstCall.args[1];
                done();
            });

            it('should pass err to the callback', function (done) {
                var error = {an: 'error'};
                this.handler(error);
                expect(this.cb).calledOnce
                .and.calledWithExactly(error);
                done();
            });

            it('should set #_state to "initialise" on success', function (done) {
                expect(this.myRFB._state).to.equal('handshake');
                this.handler(null);
                expect(this.myRFB._state).to.equal('initialise');
                done();
            });
        });

    });
    
    
    
    describe('#initialise(cb)', function () {
        beforeEach( function (done) {
            this.myRFB.send = test.sinon.stub();
            this.myRFB.receive = test.sinon.stub();
            done();
        });

        it('should be an instance method', function (done) {
            expect(this.myRFB.initialise).to.be.a('function');
            done();
        });

        it('should start waterfall(tasks, handler)', function (done) {
            var cb = test.sinon.spy();
            this.myRFB.initialise(cb);
            expect(this.async.waterfall).calledOnce
            .and.calledWithMatch(test.sinon.match.array, test.sinon.match);
            done();
        });
        
        describe('the waterfall handler(err)', function () {
            beforeEach( function (done) {
                this.cb = test.sinon.spy();
                this.myRFB._state = 'initialise';
                this.myRFB.initialise(this.cb);
                this.handler = this.async.waterfall.firstCall.args[1];
                done();
            });

            it('should pass an error to the callback', function (done) {
                var error = {an: 'error'};
                this.handler(error);
                expect(this.cb).calledOnce
                .and.calledWithExactly(error);
                done();
            });

            it('should set #_state to "ready"', function (done) {
                expect(this.myRFB._state).to.equal('initialise');
                this.handler(null);
                expect(this.myRFB._state).to.equal('ready');
                done();
            });
            
            it('should set the incoming stream to asynchronous mode, passing wrapped #onAsyncMessage()', function (done) {
                var err = {an: 'error'};
                var msg = {a: 'msg'};
                
                this.myRFB.onAsyncMessage = test.sinon.spy();
                
                expect(this.incomingStream.setAsyncMode).not.called;
                this.handler(null);
                
                expect(this.incomingStream.setAsyncMode).calledOnce
                .and.calledWithMatch(test.sinon.match.func);
                
                this.incomingStream.setAsyncMode.firstCall.args[0](err, msg);
                
                expect(this.myRFB.onAsyncMessage).calledOnce
                .and.calledOn(this.myRFB)
                .and.calledWithExactly(err, msg);
                
                done();
            });

        });

    });
    
    
    describe('#onAsyncMessage()', function () {
        beforeEach(function (done) {
            this.myRFB.emit = test.sinon.spy();
            this.message = test.mock('message');
            this.message.name.returns('message name');
            done();
        });
        it('should be an instance method', function (done) {
            expect(this.myRFB.onAsyncMessage).to.be.a('function');
            done();
        });
        
        it('should emit "message" event', function (done) {
            var error = null;
            
            this.myRFB.onAsyncMessage(error, this.message);
            
            expect(this.myRFB.emit).calledOnce
            .and.calledWithExactly('message', this.message);
            done();
        });
        
        it('should update pixelFormat on SetPixelFormat message', function (done) {
            var pixelFormat = {a: 'pixelFormat'};
            
            this.message.name.returns('SetPixelFormat');
            this.message.getProperty.withArgs('pixelFormat').returns(pixelFormat);
            
            this.myRFB.onAsyncMessage(null, this.message);
            
            expect(this.incomingStream.setPixelFormat).calledOnce
            .and.calledWithExactly(pixelFormat);
            
            done();
        });
    });
});
