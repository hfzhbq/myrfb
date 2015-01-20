var test = require('../support/test');
var expect = test.expect;

describe('MyRFB role=client', function () {
    beforeEach( function (done) {
        this.socket = test.mock('socket');

        this.async = test.mock('async');

        this.MessageFactory = test.mock('MessageFactory');

        this.serverStream = test.mock('incomingStream');
        this.RFBIncomingStream = test.mock('RFBIncomingStream');
        this.RFBIncomingStream.create.withArgs(this.socket).returns(this.serverStream);

        this.MyRFB = test.proxyquire('../../src/MyRFB', {
            async:  this.async,
            './MessageFactory': this.MessageFactory,
            './RFBIncomingStream': this.RFBIncomingStream
        });

        this.myRFB = this.MyRFB.create(this.socket);

        done();
    });

    
    
    describe('#handshake(cb)', function () {
        beforeEach( function (done) {
            this.myRFB.send = test.sinon.stub();
            this.myRFB.receive = test.sinon.stub();
            this.myRFB.authenticate = test.sinon.stub();

            done();
        });
        
        describe('waterfall tasks', function () {
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
    });




    describe('#initialise(cb)', function () {
        beforeEach( function (done) {
            this.myRFB.send = test.sinon.stub();
            this.myRFB.receive = test.sinon.stub();
            done();
        });

        describe('the waterfall tasks', function () {
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
    });

});
