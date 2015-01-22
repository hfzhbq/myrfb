var test = require('../support/test');
var expect = test.expect;

describe('RFBIncomingStream', function () {
    beforeEach(function (done) {
        this.socket = test.mock('socket');
        this.msg = test.mock('message');
        this.MessageFactory = test.mock('MessageFactory');
        
        this.RFBIncomingStream = test.proxyquire('../../src/RFBIncomingStream', {
            './MessageFactory': this.MessageFactory
        });
        
        this.incomingStream = this.RFBIncomingStream.create(this.socket);
        done();
    });
    
    it('should exist', function (done) {
        expect(this.RFBIncomingStream).to.exist;
        done();
    });
    
    it('should export RFBIncomingStream constructor', function (done) {
        var constr = this.RFBIncomingStream.RFBIncomingStream;
        expect(constr).to.exist;
        expect(this.incomingStream).to.be.instanceof(constr);
        done();
    });
    
    describe('.create(socket, isServer)', function () {
        beforeEach(function (done) {
            this.incomingStream.addChunk = test.sinon.spy();
            done();
        });
        
        it('should be a static method', function (done) {
            expect(this.RFBIncomingStream.create).to.be.a('function');
            done();
        });
        
        it('should throw if incorrect isServer argument is provided', function (done) {
            var badIsServers = ['polizei', [], {}, test.sinon.spy(), null];
            var _this = this;
            badIsServers.forEach( function (isServer) {
                expect( function () {
                    _this.RFBIncomingStream.create(_this.socket, isServer);
                }).to.throw('isServer');
            });
            
            done();
        });
        
        it('should bind a listener to socket\'s "data" event', function (done) {
            expect(this.socket.on).called
            .and.calledWithMatch(test.sinon.match.same('data'), test.sinon.match.func);
            done();
        });
        
        
        it('should set #_mode to "sync"', function (done) {
            expect(this.incomingStream._mode).to.equal('sync');
            done();
        });
        
        
        describe('listener', function () {
            beforeEach(function (done) {
                this.addChunkSpy = test.sinon.spy();
                this.socket = test.mock('socket');
                this.RFBIncomingStream.RFBIncomingStream.prototype.addChunk = this.addChunkSpy;
                this.incomingStream = this.RFBIncomingStream.create(this.socket);
                
                this.listener = test.findCallWith(this.socket.on, 'data').args[1];
                
                done();
            });
            
            it('should call #addChunk()', function (done) {
                var buf = new Buffer('any');
                var spy = this.incomingStream.addChunk;
                
                expect(spy).notCalled;
                
                this.listener(buf);
                
                expect(spy).calledOnce
                .and.calledOn(this.incomingStream)
                .and.calledWithExactly(buf);
                
                done();
            });            
        });
    });
    
    
    
    describe('#isServer()', function () {
        it('should be an instance method', function (done) {
            expect(this.incomingStream.isServer).to.be.a('function');
            done();
        });
        
        it('should return true for server\s incoming stream', function (done) {
            var is = this.RFBIncomingStream.create(this.socket, true);
            expect(is.isServer()).to.be.true;
            
            is = this.RFBIncomingStream.create(this.socket, false);
            expect(is.isServer()).to.be.false;
            done();
        });
        
        it('should return false if isServer is undefined', function (done) {
            var is = this.RFBIncomingStream.create(this.socket);
            expect(is.isServer()).to.be.false;
            done();
        });
        
        it('should return true or false if "server" or "client" were passed to the constructor', function (done) {
            var is = this.RFBIncomingStream.create(this.socket, 'client');
            expect(is.isServer()).to.be.false;
            
            is = this.RFBIncomingStream.create(this.socket, 'server');
            expect(is.isServer()).to.be.true;
            done();
        });
    });
    
    
    
    describe('#setPixelFormat()', function () {
        it('should be an instance method', function (done) {
            var is = this.RFBIncomingStream.create(this.socket, 'client');
            expect(is.setPixelFormat).to.be.a('function');
            done();
        });
    });
    
    
    
    describe('#setAsyncMode(listener)', function () {
        beforeEach(function (done) {
            this.incomingStream.processHeadRequest = test.sinon.spy();
            done();
        });
        
        it('should be an instance method', function (done) {
            expect(this.incomingStream.setAsyncMode).to.be.a('function');
            done();
        });
        
        it('should set #_mode to "async"', function (done) {
            expect(this.incomingStream._mode).to.not.equal('async');
            this.incomingStream.setAsyncMode();
            expect(this.incomingStream._mode).to.equal('async');
            done();
        });
        
        it('should throw if requests queue is not empty', function (done) {
            var is = this.incomingStream;
            is._requests = [{}];
            
            expect( function () {
                is.setAsyncMode();
            }).to.throw('should be empty');
            
            done();
        });
        
        it('should reassign listener in "async" mode', function (done) {
            var is = this.incomingStream;
            var listener = test.sinon.spy();
            is._mode = 'async';
            is._requests = [{}];

            expect( function () {
                is.setAsyncMode(listener);
                expect(is.processHeadRequest).to.not.called;
                expect(is._asyncListener).to.equal(listener);
            }).to.not.throw();

            done();
        });
        
        it('should call #processHeadRequest', function (done) {
            expect(this.incomingStream.processHeadRequest).to.not.called;
            this.incomingStream.setAsyncMode();
            expect(this.incomingStream.processHeadRequest).calledOnce;
            done();
        });
        
        it('should assign listener to #_asyncListener', function (done) {
            var listener = test.sinon.spy();
            this.incomingStream.setAsyncMode(listener);
            expect(this.incomingStream._asyncListener).to.equal(listener);
            done();
        });
    });
    
    
    
    
    describe('#buffer()', function () {
        it('should be an instance method', function (done) {
            expect(this.incomingStream.buffer).to.be.a('function');
            done();
        });
        
        it('should return an internal buffer by default', function (done) {
            var buf = new Buffer('any');

            this.incomingStream.addChunk(buf);
            
            expect(this.incomingStream.buffer().toString('hex'))
            .to.equal(buf.toString('hex'));
            
            done();
        });
    });
    
    describe('#bufferedOctetsCount()', function () {
        it('should be an instance method', function (done) {
            expect(this.incomingStream.bufferedOctetsCount).to.be.a('function');
            done();
        });
        
        it('should return the length of internal buffer', function (done) {
            var length = 12;
            
            this.incomingStream.addChunk( new Buffer(length) );
            
            expect(this.incomingStream.bufferedOctetsCount()).to.equal(length);
            
            done();
        });
    });
    
    
    describe('#receive(msg, cb)', function () {
        it('should be an instance method', function (done) {
            expect(this.incomingStream.receive).to.be.a('function');
            done();
        });
        
        it('should push and cb to tasks list', function (done) {
            var cb = test.sinon.spy();
            
            expect(this._requests).to.have.length[0];
            
            this.incomingStream.receive(this.msg, cb);
            
            expect(this.incomingStream._requests[0]).to.have.property('msg').that.equals(this.msg);
            expect(this.incomingStream._requests[0]).to.have.property('cb').that.equals(cb);
            
            done();
        });
        
        it('should call #processHeadRequest()', function (done) {
            var cb = test.sinon.spy();
            test.sinon.spy(this.incomingStream, 'processHeadRequest');
            
            this.incomingStream.receive(this.msg, cb);
            
            expect( this.incomingStream.processHeadRequest ).calledOnce;
            
            this.incomingStream.processHeadRequest.restore();
            
            done();
        });
    });
    
    
    
    describe('#addChunk(chunk)', function () {
        it('should be an instance method', function (done) {
            expect(this.incomingStream.addChunk).to.be.a('function');
            done();
        });
        
        it('should append chunk to an internal buffer', function (done) {
            var b1 = new Buffer(23);
            var b2 = new Buffer(24);
            var expected = b1.toString('hex') + b2.toString('hex');
            var actual;
            
            this.incomingStream.addChunk(b1);
            this.incomingStream.addChunk(b2);
            actual = this.incomingStream.buffer().toString('hex');
            
            expect(actual).to.equal(expected);
            
            done();
        });
        
        it('should call #processHeadRequest()', function (done) {
            var buf = new Buffer('any');
            
            test.sinon.spy(this.incomingStream, 'processHeadRequest');

            this.incomingStream.addChunk(buf);

            expect( this.incomingStream.processHeadRequest ).calledOnce;

            this.incomingStream.processHeadRequest.restore();
            done();
        });
    });
    
    
    
    describe('#detachChunk(length)', function () {
        it('should be an instance method', function (done) {
            expect(this.incomingStream.detachChunk).to.be.a('function');
            done();
        });
        
        it('should return null if buffer do not have the requested number of octets', function (done) {
            var buf = new Buffer('any');
            var res;
            
            this.incomingStream.addChunk(buf);
            
            res = this.incomingStream.detachChunk(1+buf.length);
            
            expect(res).to.be.null;
            
            done();
        });
        
        it('should return internal buffer when it\'s length is equal to requested length and replace it with another buffer', function (done) {
            var buf = new Buffer('any data');
            var res;
            
            this.incomingStream.addChunk(buf);
            
            var res = this.incomingStream.detachChunk(buf.length);
            
            expect(res.toString('hex')).to.equal(buf.toString('hex'));
                expect(this.incomingStream.buffer().length).to.equal(0);
            
            done();
        });
        
        it('should detach and return the requested part of the internal buffer leaving the rest', function (done) {
            var data = 'a long enough data';
            var buf = new Buffer(data);
            var length = Math.floor(data.length / 2);
            var head = new Buffer( data.substr(0, length) );
            var tail = new Buffer( data.substr(length) );
            var res;
            
            this.incomingStream.addChunk(buf);
            res = this.incomingStream.detachChunk(length);
            
            expect(res.toString('hex'))
            .to.equal(head.toString('hex'));
            expect(this.incomingStream.buffer().toString('hex'))
            .to.equal(tail.toString('hex'));
                
            done();
        });
    });
    
    
    
    describe('#checkAsyncMessage()', function () {
        beforeEach(function (done) {
            this.incomingStream._mode = 'async';
            this.incomingStream.buffer = test.sinon.stub();
            this.incomingStream.isServer = test.sinon.stub();
            done();
        });
        it('should be an instance method', function (done) {
            expect(this.incomingStream.checkAsyncMessage).to.be.a('function');
            done();
        });
        
        it('should do nothing in "sync" mode', function (done) {
            this.incomingStream._mode = 'sync';
            
            this.incomingStream.checkAsyncMessage();

            expect(this.MessageFactory.guessAndPrepareIncoming).not.called;
            
            done();
        });
        
        it('should do nothing if buffer is empty', function (done) {
            this.incomingStream.buffer.returns( new Buffer(0) );
            this.incomingStream.checkAsyncMessage();
            expect(this.MessageFactory.guessAndPrepareIncoming).not.called;
            done();
        });
        
        it('should use MessageFactory.guessAndPrepareIncoming(buffer.readUInt8(0), isServer) and add the message to the queue', function (done) {
            var messageType = 11;
            var isServer = 'boolean value';
            var message = {a: 'message'};
            
            var buf = new Buffer(10);
            buf.writeUInt8(messageType, 0);
            
            this.incomingStream.buffer.returns(buf);
            this.incomingStream.isServer.returns(isServer);
            this.MessageFactory.guessAndPrepareIncoming.withArgs(messageType, isServer).returns(message);
            
            expect(this.incomingStream._requests).to.have.length(0);
            
            var res = this.incomingStream.checkAsyncMessage();
            
            expect(this.MessageFactory.guessAndPrepareIncoming).calledOnce
            .and.calledWithExactly(messageType, isServer);
            
            expect(this.incomingStream._requests).to.have.length(1);
            expect(this.incomingStream._requests[0]).to.have.property('msg').that.equals(message);
            
            done();
        });
        
        it('should use if message has #setPixelFormat() method it should set pixelFormat', function (done) {
            var messageType = 0;
            var pixelFormat = {a: 'current pixel format'};
            var isServer = 'boolean value';
            var spy = test.sinon.spy();
            var message = {a: 'message', setPixelFormat: spy};

            var buf = new Buffer(10);
            buf.writeUInt8(messageType, 0);

            this.incomingStream.buffer.returns(buf);
            this.incomingStream.isServer.returns(isServer);
            this.MessageFactory.guessAndPrepareIncoming.withArgs(messageType, isServer).returns(message);
            
            this.incomingStream.setPixelFormat(pixelFormat);
            var res = this.incomingStream.checkAsyncMessage();
            
            expect(spy).calledOnce
            .and.calledWithExactly(pixelFormat);

            done();
        });
    });
    
    
    
    describe('#processHeadRequest()', function () {
        beforeEach(function (done) {
            this.cb = test.sinon.spy();
            done();
        });
        
        it('should be an instance method', function (done) {
            expect(this.incomingStream.processHeadRequest).to.be.a('function');
            done();
        });
        
        it('should do nothing if the requests list is empty in "sync" mode', function (done) {
            var ss = this.incomingStream;
            
            expect( function () {
                ss.processHeadRequest();
            }).to.not.throw(Error);
            
            done();
        });
        
        it('should checkAsyncMessage if the requests list is empty in "async" mode', function (done) {
            this.incomingStream.checkAsyncMessage = test.sinon.spy();
            this.incomingStream._mode = 'async';
            this.incomingStream._requests = [];
            
            this.incomingStream.processHeadRequest();
            
            expect(this.incomingStream.checkAsyncMessage).calledOnce;
            
            done();
        });
        
        it('should not touch the msg and the internal buffer if the buffer length is not sufficient', function (done) {
            var requiredLength = 65;
            var availableLength= requiredLength - 1;
            
            this.msg.requiredLength.returns(requiredLength);
            this.incomingStream.detachChunk = test.sinon.spy();
            
            var buf = new Buffer(availableLength);
            
            this.incomingStream.receive(this.msg, this.cb);
            this.incomingStream.addChunk(buf); // calls #processHeadRequest()
            
            expect(this.msg.requiredLength).calledTwice;
            expect(this.msg.addChunk).not.called;
            expect(this.incomingStream.detachChunk).not.called;
            
            done();
        });
        
        it('should detach the required amount of octets and feed them to msg', function (done) {
            var requiredLength = 65;
            var chunk = {a: 'chunk'};
            
            this.msg.requiredLength.onCall(0).returns(requiredLength);
            this.msg.requiredLength.onCall(1).returns(0);
            this.incomingStream.detachChunk = test.sinon.stub().returns(chunk);

            var buf = new Buffer(requiredLength);

            this.incomingStream.receive(this.msg, this.cb);
            this.msg.requiredLength.reset();
            this.incomingStream.addChunk(buf); // calls #processHeadRequest()

            expect(this.msg.requiredLength).calledTwice;
            expect(this.msg.addChunk).calledOnce
            .and.calledWithExactly(chunk);
            done();
        });
        
        it('should feed msg unless it is satisfied (given enough data)', function (done) {
            var msg = this.msg;
            var ss = this.incomingStream;
            var lengths = [3, 15, 22, 0];
            var chunks = [];
            var total = 0;
            
            ss.detachChunk = test.sinon.stub();
            
            lengths.forEach( function (l, i) {
                var buf;
                msg.requiredLength.onCall(i).returns(l);
                total += l;
                if ( l > 0 ) {
                    buf = new Buffer(l);
                    chunks.push(buf);
                    ss.detachChunk.onCall(i).returns(buf);
                }
            });
            
            this.incomingStream.receive(this.msg, this.cb);
            msg.requiredLength.reset();
            this.incomingStream.addChunk( new Buffer(1+total) );
            
            expect(msg.addChunk).to.have.callCount(lengths.length-1);
            
            done();
        });
        
        it('should pass msg to the cb when msg is satisfied and remove it from the queue', function (done) {
            this.msg.requiredLength.returns(0);
            
            expect(this.cb).not.called;
            
            this.incomingStream.receive(this.msg, this.cb);
            
            expect(this.cb).calledOnce
            .and.calledWithExactly(null, this.msg);
            
            this.cb.reset();
            this.incomingStream.processHeadRequest();
            
            expect(this.cb).not.called;
            
            done();
        });
        
        it('should pass msg to #_asyncListener in "async" mode', function (done) {
            this.msg.requiredLength.returns(0);
            this.incomingStream._mode = 'async';
            this.incomingStream._asyncListener = test.sinon.spy();

            this.incomingStream.receive(this.msg);

            expect(this.incomingStream._asyncListener).calledOnce
            .and.calledWithExactly(null, this.msg);

            done();
        });
        
        
        it('should feed msg until there is available data (if not enough data)', function (done) {
            var rl1 = 10, rl2 = 11, rl3 = 44;
            this.msg.requiredLength.onCall(0).returns(rl1);
            this.msg.requiredLength.onCall(1).returns(rl2);
            
            this.incomingStream.receive(this.msg, this.cb);
            this.msg.requiredLength.reset();
            
            this.incomingStream.addChunk( new Buffer(rl1 + rl2 + rl3 - 1) );
            
            expect(this.cb).not.called;
            expect(this.msg.addChunk).calledTwice;
            done();
        });
    });

});
