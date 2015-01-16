var test = require('../support/test');
var expect = test.expect;

describe('MyRFB', function () {
    beforeEach( function (done) {
        this.socket = test.mock('socket');
        
        this.async = test.mock('async');
        
        this.MessageFactory = test.mock('MessageFactory');
        
        this.serverStream = test.mock('incomingStream');
        this.RFBServerStream = test.mock('RFBIncomingStream');
        this.RFBServerStream.create.withArgs(this.socket).returns(this.serverStream);
        
        this.MyRFB = test.proxyquire('../../src/MyRFB', {
            async:  this.async,
            './MessageFactory': this.MessageFactory,
            './RFBServerStream': this.RFBServerStream
        });

        this.myRFB = this.MyRFB.create(this.socket);

        done();
    });

    it('should exist', function (done) {
        expect(this.MyRFB).to.exist;
        done();
    });

    it('should export .create()', function (done) {
        expect(this.MyRFB.create).to.be.a('function');
        done();
    });

    it('should construct myRFB instance', function (done) {
        expect(this.myRFB).to.exist;
        done();
    });
    
    describe('.create(socket)', function () {
        it('should store socket in _socket property', function (done) {
            expect(this.myRFB._socket).to.equal(this.socket);
            done();
        });
        
        it('should wrap socket to RFBServerStream and store the result to _serverStream property', function (done) {
            expect(this.myRFB._serverStream).to.equal(this.serverStream);
            done();
        });
    });

    describe('myRFB', function () {
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

            describe('tasks', function () {
                beforeEach( function (done) {
                    this.cb = test.sinon.spy();
                    this.myRFB.handshake(this.cb);
                    this.tasks = this.async.waterfall.firstCall.args[0];
                    done();
                });

                it('should 1) receive Version message', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[0](cb);

                    expect(this.myRFB.receive).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly('Version', cb);

                    done();
                });

                it('should 2) send Version message', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[1](cb);

                    expect(this.myRFB.send).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly('Version', cb);

                    done();
                });

                it('should 3) receive the list of security methods supported by server', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[2](cb);

                    expect(this.myRFB.receive).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly('SecurityTypes', cb);
                    done();
                });

                it('should 4) send security type message', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[3](cb);

                    expect(this.myRFB.send).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly('SecurityType', cb);


                    done();
                });

                it('should 5) run authentication process', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[4](cb);

                    expect(this.myRFB.authenticate).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly(cb);

                    done();
                });

                it('should 6) receive security result message', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[5](cb);

                    expect(this.myRFB.receive).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly('SecurityResult', cb);
                    done();
                });

                it('should do only 6 above mentioned things', function (done) {
                    expect(this.tasks).to.have.length(6);
                    done();
                });
            });

            describe('handler(err)', function () {
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
            
            
            describe('tasks', function () {
                beforeEach( function (done) {
                    this.cb = test.sinon.spy();
                    this.myRFB.initialise(this.cb);
                    this.tasks = this.async.waterfall.firstCall.args[0];
                    done();
                });
                
                it('should 1) send ClientInit message', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[0](cb);
                    expect(this.myRFB.send).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly('ClientInit', cb);
                    done();
                });
                
                it('should 2) receive ServerInit message', function (done) {
                    var cb = test.sinon.spy();
                    this.tasks[1](cb);
                    expect(this.myRFB.receive).calledOnce
                    .and.calledOn(this.myRFB)
                    .and.calledWithExactly('ServerInit', cb);
                    done();
                });
                
                it('should contain only above mentioned tasks', function (done) {
                    expect(this.tasks).to.have.length(2);
                    done();
                });
            });
            
            describe('handler(err)', function () {
                beforeEach( function (done) {
                    this.cb = test.sinon.spy();
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
                
                it.skip('should set an asynchtonous mode on a read stream', function (done) {
                    done();
                });
            });
        });


        describe('#send(msgName, cb)', function () {
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
                var cb = test.sinon.spy();
                
                // TODO: data!!!
                this.MessageFactory.prepareOutgoing.withArgs(msgName).returns(this.msg);
                
                this.myRFB.send(msgName, cb);
                
                expect(this.MessageFactory.prepareOutgoing).calledOnce
                .and.calledWithExactly(msgName);
                
                done();
            });
            
            it('should pass message.toBuffer() and and cb to the socket.write', function (done) {
                var msgName = 'a message name';
                                
                var cb = test.sinon.spy();
                
                this.msg.toBuffer.returns(this.msg.$buffer);
                this.MessageFactory.prepareOutgoing.withArgs(msgName).returns(this.msg);
                
                this.myRFB.send(msgName, cb);
                
                expect(this.socket.send).calledOnce
                .and.calledWithExactly(this.msg.$buffer, cb);
                
                done();
            });
        });


        describe('#receive(msgName, cb)', function () {
            it('should be an instance method', function (done) {
                expect(this.myRFB.receive).to.be.a('function');
                done();
            });
            
            it('should prepare incoming message wrapper and pass it and cb to _serverStream.receive', function (done) {
                var msgName = 'an incoming message name';
                var message = {an: 'incoming message'};
                var cb = test.sinon.spy();
                
                this.MessageFactory.prepareIncoming.withArgs(msgName).returns(message);
                
                this.myRFB.receive(msgName, cb);
                
                expect(this.serverStream.receive).calledOnce
                .and.calledWithExactly(message, cb);
                
                done();
            });
        });


        describe.skip('#authenticate(cb)', function () {
            it('should be an instance method', function (done) {
                expect(this.myRFB.authenticate).to.be.a('function');
                done();
            });
            
            
        });


    });
});
