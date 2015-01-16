var test = require('../support/test');
var expect = test.expect;

describe('MessageFactory', function () {
    beforeEach(function (done) {
        this.plans = {
            predefinedPlan: [{nbytes:1, type: 'U8', name: 'some name'}]
        };
        
        this.anyPlan = [{type: 'u8', nbytes: 1}];

        this.RFBType = test.mock('RFBType');
        this.MessageFactory = test.proxyquire('../../src/MessageFactory', {
            './plans': this.plans,
            './RFBType': this.RFBType
        });
        done();
    });

    it('should exist', function (done) {
        expect(this.MessageFactory).to.exist;
        done();
    });

    describe('.getPlan(planName)', function () {
        it('should be a static method', function (done) {
            expect(this.MessageFactory.getPlan).to.be.a('function');
            done();
        });

        it('should return a copy of a predefined plan', function (done) {
            var planName, plan;
            for ( planName in this.plans ) {
                plan = this.MessageFactory.getPlan(planName);
                expect(plan).to.deep.equal(this.plans[planName]);
                expect(plan).to.not.equal(this.plans[planName]);
            }
            done();
        });

        it('should throw if the plan is not [pre]defined', function (done) {
            var MF = this.MessageFactory;
            expect( function () {
                MF.getPlan('undefined plan');
            }).to.throw('plan is not defined');
            done();
        });
    });

    describe('.addPlan(planName, description)', function () {
        it('should be a static method', function (done) {
            expect(this.MessageFactory.addPlan).to.be.a('function');
            done();
        });

        it('should throw if planName appears among predefined plans', function (done) {
            var planName, plan;
            var MF = this.MessageFactory;
            for ( planName in this.plans ) {
                expect(function () {
                    MF.addPlan(planName, []);
                }).to.throw('replace predefined plan');
            }
            done();
        });

        it('should allow to replace a custom plan', function (done) {
            var MF = this.MessageFactory;
            var anyPlan = this.anyPlan;
            expect( function () {
                MF.addPlan('customPlan', anyPlan);
                MF.addPlan('customPlan', anyPlan);
            }).to.not.throw(Error);
            done();
        });

        it('should actually add a custom plan', function (done) {
            var MF = this.MessageFactory;
            var planName = 'customPlan';
            var description = [{nbytes: 2, type: 'U16', name: 'propertyName'}];

            MF.addPlan(planName, description);
            expect(MF.getPlan(planName)).to.deep.equal(description);

            done();
        });
        
        it('should check plan description for errors and throw f any', function (done) {
            var MF = this.MessageFactory;
            var planName = 'customPlan';
            var description = [];
            var error = Error('wrong description');
            
            test.sinon.stub(MF, 'checkPlan');
            
            MF.addPlan(planName, description);
            
            expect(MF.checkPlan).calledOnce
            .and.calledWithExactly(description);
            
            
            MF.checkPlan.reset();
            MF.checkPlan.throws(error);
            
            expect( function () {
                MF.addPlan(planName, description);
            });
            
            MF.checkPlan.restore();
            
            done();
        });
    });
    
    
    describe('.checkPlan(description)', function () {
        it('should be a static method', function (done) {
            expect(this.MessageFactory.checkPlan).to.be.a('function');
            done();
        });
        
        it('should throw for empty plan or if non-array is given', function (done) {
            var MF = this.MessageFactory;
            var wrongDescriptions = [
                null, undefined, 1234, 'abcde', 
                {an: 'object'},
                [], // is empty
                test.sinon.spy()
            ];
            
            wrongDescriptions.forEach( function (d) {
                expect( function () {
                    MF.checkPlan(d);
                }).to.throw();
            });
            done();
        });
        
        it('should throw if any type or nbytes is missing', function (done) {
            var MF = this.MessageFactory;
            
            expect( function () {
                MF.checkPlan([{nbytes: 5}]);
            }).to.throw();
            
            expect( function () {
                MF.checkPlan([{type: 'aaa'}]);
            }).to.throw();
            
            expect( function () {
                MF.checkPlan([{type: 'aaa', nbytes: ''}]);
            }).to.throw();
            
            expect( function () {
                MF.checkPlan([{type: 'aaa', nbytes: 'qqq'}]);
            }).to.throw();
            
            expect( function () {
                MF.checkPlan([{type: 'bbb', nbytes: 1, name: 'qqq'}, {type: 'aaa', nbytes: 'qqq'}]);
            }).to.not.throw();
            
            done();
        });
    });

});
