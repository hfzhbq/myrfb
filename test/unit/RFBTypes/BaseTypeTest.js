var test = require('../../support/test');
var expect = test.expect;

var BaseType = require('../../../src/RFBTypes/BaseType');

var BASIC='u8,s8,u16,s16,u32,s32'.split(',');

describe.only('RFBTypes/BaseType(descr[, value])', function () {
    it('should be a function', function (done) {
        expect(BaseType).to.be.a('function');
        done();
    });

    it('should instantiate all basic types', function (done) {
        BASIC.forEach( function (typ, i) {
            var signed = 's' === typ.substr(0,1);
            var nbytes = parseInt(typ.substr(1), 10) / 8;
            var value = (signed ? -1 : 1) * ( 3 + Math.pow(2, i));
            var method = (signed ? '' : 'U') + 'Int' + nbytes*8 + (nbytes > 1 ? 'BE' : '');
            var name = 'nameFor_'+typ+'_'+value;
            
            var buf, instance;
            
            // read
            instance = new BaseType({
                name:   name,
                type:   typ,
                nbytes: nbytes
            });
            
            expect(instance.name()).to.equal(name);
            expect(instance.type()).to.equal(typ.toUpperCase());
            expect(instance.requiredLength()).to.equal(nbytes);
            
            buf = new Buffer(nbytes);
            buf['write'+method](value, 0);
            instance.fromBuffer(buf, 0);

            expect(instance.value()).to.equal(value);
            
            // write
            instance = new BaseType({
                name:   name,
                type:   typ,
                nbytes: nbytes
            }, value);
            
            buf = new Buffer(instance.requiredLength());
            instance.toBuffer(buf, 0);
            
            expect(buf['read'+method](0)).to.equal(value);
        });
        done();
    });
    
    it('should instantiate the arrays of basic types', function (done) {
        BASIC.forEach( function (typ, i) {
            var signed = 's' === typ.substr(0,1);
            var nbytes = parseInt(typ.substr(1), 10) / 8;
            var k = signed ? -1 : 1;
            var method = (signed ? '' : 'U') + 'Int' + nbytes*8 + (nbytes > 1 ? 'BE' : '');
            var value = [Math.pow(k, i+1), Math.pow(2*k, i+1), Math.pow(3*k, i+1), Math.pow(4*k, i+1)];
            var name = 'nameFor_'+typ+'_array_'+i;
            var reqlen = nbytes*value.length;
            
            var buf, instance;
            
            instance = new BaseType({
                name:   name,
                type:   typ,
                nbytes: reqlen
            });
            
            expect(instance.name()).to.equal(name);
            expect(instance.type()).to.equal(typ.toUpperCase());
            expect(instance.requiredLength()).to.equal(reqlen);
            
            buf = new Buffer(reqlen);
            value.forEach(function (n, i) { buf['write'+method](n, i*nbytes); });
            
            instance.fromBuffer(buf, 0);
            
            expect(instance.value()).to.deep.equal(value);
            
            instance = new BaseType({
                name:   name,
                type:   typ,
                nbytes: reqlen
            }, value);
            
            buf = new Buffer(reqlen);
            instance.toBuffer(buf, 0);
            
            value.forEach( function (n, pos) {
                var x = buf['read'+method](pos*nbytes);
                expect(x).to.equal(n);
            });
        });
        done();
    });
    
    it('should throw if no or incorrect type is given', function (done) {
        
        expect( function () {
            var inst = new BaseType({
                nbytes: 1,
                name:   'xx'
            });
        }).to.throw('must have type');
        
        expect( function () {
            var inst = new BaseType({
                type:   function () {},
                nbytes: 1,
                name:   'xx'
            });
        }).to.throw('must have type');
        
        expect( function () {
            var inst = new BaseType({
                type:   '',
                nbytes: 1,
                name:   'xx'
            });
        }).to.throw('must have type');
        
        done();
    });
    
    
    it('should throw if type is not basic', function (done) {
        expect( function () {
            var inst = new BaseType({
                type:   'u8string',
                nbytes: 1,
                name:   'xx'
            });
        }).to.throw('must have type');
        done();
    });
    
    it('should throw if nbytes is not multiple of a base type size', function (done) {
        expect( function () {
            var inst = new BaseType({
                type: 'u16',
                nbytes: 1,
                name:   'xx'
            });
        }).to.throw('must be a multiple');
        done();
    });

    describe('.isBasic(type)', function () {
        it('should be a static method', function (done) {
            expect(BaseType.isBasic).to.be.a('function');
            done();
        });

        it('should return true for all basic types', function (done) {
            BASIC.forEach( function (typ, i) {
                expect(BaseType.isBasic(typ)).to.equal(true);
            });
            done();
        });

        it('should return false if type is undefined', function (done) {
            expect(BaseType.isBasic()).to.equal(false);
            done();
        });
    });


});