var test = require('../support/test');
var expect = test.expect;

describe('RFBIncomingStream', function () {
    beforeEach(function (done) {
        this.socket = test.mock('socket');
        this.msg = test.mock('message');
        this.RFBIncomingStream = test.proxyquire('../../src/RFBIncomingStream', {
        });
        
        this.serverStream = this.RFBIncomingStream.create(this.socket);
        done();
    });
    
    it('should exist', function (done) {
        expect(this.RFBIncomingStream).to.exist;
        done();
    });
    
    it('should export RFBIncomingStream constructor', function (done) {
        var constr = this.RFBIncomingStream.RFBIncomingStream;
        expect(constr).to.exist;
        expect(this.serverStream).to.be.instanceof(constr);
        done();
    });
    
    describe('.create(socket)', function () {
        beforeEach(function (done) {
            this.serverStream.addChunk = test.sinon.spy();
            done();
        });
        
        it('should be a static method', function (done) {
            expect(this.RFBIncomingStream.create).to.be.a('function');
            done();
        });
        
        it('should bind a listener to socket\'s "data" event', function (done) {
            expect(this.socket.on).called
            .and.calledWithMatch(test.sinon.match.same('data'), test.sinon.match.func);
            done();
        });
        
        describe('listener', function () {
            beforeEach(function (done) {
                this.addChunkSpy = test.sinon.spy();
                this.socket = test.mock('socket');
                this.RFBIncomingStream.RFBIncomingStream.prototype.addChunk = this.addChunkSpy;
                this.serverStream = this.RFBIncomingStream.create(this.socket);
                
                this.listener = test.findCallWith(this.socket.on, 'data').args[1];
                
                done();
            });
            
            it('should call #addChunk()', function (done) {
                var buf = new Buffer('any');
                var spy = this.serverStream.addChunk;
                
                expect(spy).notCalled;
                
                this.listener(buf);
                
                expect(spy).calledOnce
                .and.calledOn(this.serverStream)
                .and.calledWithExactly(buf);
                
                done();
            });            
        });
    });
    
    
    describe('#buffer()', function () {
        it('should be an instance method', function (done) {
            expect(this.serverStream.buffer).to.be.a('function');
            done();
        });
        
        it('should return an internal buffer by default', function (done) {
            var buf = new Buffer('any');

            this.serverStream.addChunk(buf);
            
            expect(this.serverStream.buffer().toString('hex'))
            .to.equal(buf.toString('hex'));
            
            done();
        });
    });
    
    describe('#bufferedOctetsCount()', function () {
        it('should be an instance method', function (done) {
            expect(this.serverStream.bufferedOctetsCount).to.be.a('function');
            done();
        });
        
        it('should return the length of internal buffer', function (done) {
            var length = 12;
            
            this.serverStream.addChunk( new Buffer(length) );
            
            expect(this.serverStream.bufferedOctetsCount()).to.equal(length);
            
            done();
        });
    });
    
    
    describe('#receive(msg, cb)', function () {
        it('should be an instance method', function (done) {
            expect(this.serverStream.receive).to.be.a('function');
            done();
        });
        
        it('should push and cb to tasks list', function (done) {
            var cb = test.sinon.spy();
            
            expect(this._requests).to.have.length[0];
            
            this.serverStream.receive(this.msg, cb);
            
            expect(this.serverStream._requests[0]).to.have.property('msg').that.equals(this.msg);
            expect(this.serverStream._requests[0]).to.have.property('cb').that.equals(cb);
            
            done();
        });
        
        it('should call #processHeadRequest()', function (done) {
            var cb = test.sinon.spy();
            test.sinon.spy(this.serverStream, 'processHeadRequest');
            
            this.serverStream.receive(this.msg, cb);
            
            expect( this.serverStream.processHeadRequest ).calledOnce;
            
            this.serverStream.processHeadRequest.restore();
            
            done();
        });
    });
    
    
    
    describe('#addChunk(chunk)', function () {
        it('should be an instance method', function (done) {
            expect(this.serverStream.addChunk).to.be.a('function');
            done();
        });
        
        it('should append chunk to an internal buffer', function (done) {
            var b1 = new Buffer(23);
            var b2 = new Buffer(24);
            var expected = b1.toString('hex') + b2.toString('hex');
            var actual;
            
            this.serverStream.addChunk(b1);
            this.serverStream.addChunk(b2);
            actual = this.serverStream.buffer().toString('hex');
            
            expect(actual).to.equal(expected);
            
            done();
        });
        
        it('should call #processHeadRequest()', function (done) {
            var buf = new Buffer('any');
            
            test.sinon.spy(this.serverStream, 'processHeadRequest');

            this.serverStream.addChunk(buf);

            expect( this.serverStream.processHeadRequest ).calledOnce;

            this.serverStream.processHeadRequest.restore();
            done();
        });
    });
    
    
    
    describe('#detachChunk(length)', function () {
        it('should be an instance method', function (done) {
            expect(this.serverStream.detachChunk).to.be.a('function');
            done();
        });
        
        it('should return null if buffer do not have the requested number of octets', function (done) {
            var buf = new Buffer('any');
            var res;
            
            this.serverStream.addChunk(buf);
            
            res = this.serverStream.detachChunk(1+buf.length);
            
            expect(res).to.be.null;
            
            done();
        });
        
        it('should return internal buffer when it\'s length is equal to requested length and replace it with another buffer', function (done) {
            var buf = new Buffer('any data');
            var res;
            
            this.serverStream.addChunk(buf);
            
            var res = this.serverStream.detachChunk(buf.length);
            
            expect(res.toString('hex')).to.equal(buf.toString('hex'));
                expect(this.serverStream.buffer().length).to.equal(0);
            
            done();
        });
        
        it('should detach and return the requested part of the internal buffer leaving the rest', function (done) {
            var data = 'a long enough data';
            var buf = new Buffer(data);
            var length = Math.floor(data.length / 2);
            var head = new Buffer( data.substr(0, length) );
            var tail = new Buffer( data.substr(length) );
            var res;
            
            this.serverStream.addChunk(buf);
            res = this.serverStream.detachChunk(length);
            
            expect(res.toString('hex'))
            .to.equal(head.toString('hex'));
            expect(this.serverStream.buffer().toString('hex'))
            .to.equal(tail.toString('hex'));
                
            done();
        });
    });
    
    
    
    describe('#processHeadRequest()', function () {
        beforeEach(function (done) {
            this.cb = test.sinon.spy();
            done();
        });
        
        it('should be an instance method', function (done) {
            expect(this.serverStream.processHeadRequest).to.be.a('function');
            done();
        });
        
        it('should do nothing if the tasks list is empty', function (done) {
            var ss = this.serverStream;
            
            expect( function () {
                ss.processHeadRequest();
            }).to.not.throw(Error);
            
            done();
        });
        
        it('should not touch the msg and the internal buffer if the buffer length is not sufficient', function (done) {
            var requiredLength = 65;
            var availableLength= requiredLength - 1;
            
            this.msg.requiredLength.returns(requiredLength);
            this.serverStream.detachChunk = test.sinon.spy();
            
            var buf = new Buffer(availableLength);
            
            this.serverStream.receive(this.msg, this.cb);
            this.serverStream.addChunk(buf); // calls #processHeadRequest()
            
            expect(this.msg.requiredLength).calledTwice;
            expect(this.msg.addChunk).not.called;
            expect(this.serverStream.detachChunk).not.called;
            
            done();
        });
        
        it('should detach the required amount of octets and feed them to msg', function (done) {
            var requiredLength = 65;
            var chunk = {a: 'chunk'};
            
            this.msg.requiredLength.onCall(0).returns(requiredLength);
            this.msg.requiredLength.onCall(1).returns(0);
            this.serverStream.detachChunk = test.sinon.stub().returns(chunk);

            var buf = new Buffer(requiredLength);

            this.serverStream.receive(this.msg, this.cb);
            this.msg.requiredLength.reset();
            this.serverStream.addChunk(buf); // calls #processHeadRequest()

            expect(this.msg.requiredLength).calledTwice;
            expect(this.msg.addChunk).calledOnce
            .and.calledWithExactly(chunk);
            done();
        });
        
        it('should feed msg unless it is satisfied (given enough data)', function (done) {
            var msg = this.msg;
            var ss = this.serverStream;
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
            
            this.serverStream.receive(this.msg, this.cb);
            msg.requiredLength.reset();
            this.serverStream.addChunk( new Buffer(1+total) );
            
            expect(msg.addChunk).to.have.callCount(lengths.length-1);
            
            done();
        });
        
        it('should pass msg to the cb when msg is satisfied and remove it from the queue', function (done) {
            this.msg.requiredLength.returns(0);
            
            expect(this.cb).not.called;
            
            this.serverStream.receive(this.msg, this.cb);
            
            expect(this.cb).calledOnce
            .and.calledWithExactly(null, this.msg);
            
            this.cb.reset();
            this.serverStream.processHeadRequest();
            
            expect(this.cb).not.called;
            
            done();
        });
        
        
        it('should feed msg until there is available data (if not enough data)', function (done) {
            var rl1 = 10, rl2 = 11, rl3 = 44;
            this.msg.requiredLength.onCall(0).returns(rl1);
            this.msg.requiredLength.onCall(1).returns(rl2);
            
            this.serverStream.receive(this.msg, this.cb);
            this.msg.requiredLength.reset();
            
            this.serverStream.addChunk( new Buffer(rl1 + rl2 + rl3 - 1) );
            
            expect(this.cb).not.called;
            expect(this.msg.addChunk).calledTwice;
            done();
        });
    });

});
