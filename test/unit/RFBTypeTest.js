var test = require('../support/test');
var expect = test.expect;

describe('RFBType', function () {
    beforeEach(function (done) {
        this.RFBType = test.proxyquire('../../src/RFBType', {
        });
        done();
    });
    
    it('should exist', function (done) {
        expect(this.RFBType).to.exist;
        done();
    });
    
    
    describe('.fromBuffer(buf, pos, type, nbytes)', function () {
        it('should be a static method', function (done) {
            expect(this.RFBType.fromBuffer).to.be.a('function');
            done();
        });
        
        it('should understand all basic types', function (done) {
            var descrs = [];
            var buf = new Buffer( 2* (8+16+32) );
            var bufPos = 0;
            var RFBType = this.RFBType;
            
            'u8,s8,u16,s16,u32,s32'.split(',').forEach( function (typ, i) {
                var unsigned = typ.substr(0,1).toUpperCase() === 'U';
                var l = parseInt(typ.substr(1), 10) / 8;
                
                var n = unsigned ? Math.pow(2, i) : -Math.pow(2, i);
                
                
                var method = 'write' + 
                    (unsigned ? 'UInt' : 'Int') +
                    ( l > 1 ? l*8 + 'BE' : l*8);
                
                descrs.push({type: typ, nbytes: l});
                buf[method](n, bufPos);
                bufPos += l;
            });
            
            
            bufPos = 0;
            descrs.forEach( function (descr, i) {
                var sign = descr.type.substr(0,1).toUpperCase() === 'U' ? 1 : -1;
                var len = parseInt(descr.type.substr(1), 10) / 8;
                
                var expected = sign * Math.pow(2, i)
                var value = RFBType.fromBuffer(buf, bufPos, descr.type, descr.nbytes);
                expect(value).to.equal(expected);
                bufPos += len;
            });
            
            done();
        });
        
        it('should throw if no type given', function (done) {
            var RFBType = this.RFBType;
            var buf = new Buffer('any');
            
            expect( function () {
                RFBType.fromBuffer(buf, 0, undefined, 1);
            }).to.throw('type is required');
            done();
        });
        
        it('should throw if type is unknown', function (done) {
            var RFBType = this.RFBType;
            var buf = new Buffer('any');

            expect( function () {
                RFBType.fromBuffer(buf, 0, 'aTypeThatIsUnknownToTheRFBType', 16);
            }).to.throw('Unknown type');
            
            done();
        });
        
        it('should throw if nbytes is incorrect', function (done) {
            var RFBType = this.RFBType;
            var buf = new Buffer('any');
            
            expect( function () {
                RFBType.fromBuffer(buf, 0, 'u8');
            }).to.throw('nbytes is required');
            
            done();
        });
        
        it('should check that nbytes is correct for basic types', function (done) {
            var RFBType = this.RFBType;
            var incorrectDescrs = [];
            var length = 0;
            
            'u16,s16,u32,s32'.split(',').forEach( function (typ, i) {
                var l = parseInt(typ.substr(1), 10) / 8;
                var d = l / 2;
                incorrectDescrs.push({type: typ, nbytes: l+d});
                length += l+d;
            });
            
            var buf = new Buffer(length);
            
            incorrectDescrs.forEach( function (descr) {
                expect(function () {
                    RFBType.fromBuffer(buf, 0, descr.type, descr.nbytes);
                }).to.throw('must be multiple of');
            });
            
            
            done();
        });
        
        
        it('should understand arrays of basic types', function (done) {
            var RFBType = this.RFBType;
            'u8,s8,u16,s16,u32,s32'.split(',').forEach( function (typ, i) {
                var array = [2, 4, 8, 16, 32];
                var unsigned = typ.substr(0,1).toUpperCase() === 'U';
                var l = parseInt(typ.substr(1), 10) / 8;
                var method = 'write' + (unsigned?'U':'') + 'Int' + l*8 + (l>1?'BE':'');
                var nbytes = l * array.length;
                var buf = new Buffer( nbytes );
                var pos = 0;
                array.forEach( function (n) {
                    buf[method](n, pos);
                    pos += l;
                });
                
                var res = RFBType.fromBuffer(buf, 0, typ, nbytes);
                expect(res).to.deep.equal(array);
            });
            
            done();
        });
        
        
        it('should understand u8String', function (done) {
            var string = 'some string';
            var buf = new Buffer(string);
            
            var res = this.RFBType.fromBuffer(buf, 0, 'u8string', buf.length);
            
            expect(res).to.equal(string);
            done();
        });
        
        
        it('should understand pixel_format', function (done) {
            var buf = new Buffer(16);
            var format = {
                bitsPerPixel:   7,
                depth:          4,
                bigEndianFlag:  1,
                trueColourFlag: 1,
                redMax:         10,
                greenMax:       11,
                blueMax:        12,
                redShift:       2,
                greenShift:     4,
                blueShift:      6
            };
            buf.writeUInt8(format.bitsPerPixel, 0);
            buf.writeUInt8(format.depth, 1);
            buf.writeUInt8(format.bigEndianFlag, 2);
            buf.writeUInt8(format.trueColourFlag, 3);
            buf.writeUInt16BE(format.redMax, 4);
            buf.writeUInt16BE(format.greenMax, 6);
            buf.writeUInt16BE(format.blueMax, 8);
            buf.writeUInt8(format.redShift, 10);
            buf.writeUInt8(format.greenShift, 11);
            buf.writeUInt8(format.blueShift, 12);
            
            var res = this.RFBType.fromBuffer(buf, 0, 'pixel_format', 16);
            
            expect(res).to.deep.equal(format);
            
            done();
        });
        
        
        it('should throw if nbytes != 16 for pixel_format', function (done) {
            var buf = new Buffer(128);
            var RFBType = this.RFBType;
            
            expect( function () {
                RFBType.fromBuffer(buf, 0, 'pixel_format', 17);
            }).to.throw('exactly 16');
            
            expect( function () {
                RFBType.fromBuffer(buf, 0, 'pixel_format', 10);
            }).to.throw('exactly 16');

            done();
        });
        
        it('should understand version type', function (done) {
            var buf = new Buffer('RFB 003.008\n');
            expect(buf.length).to.equal(12);
            
            var ver = this.RFBType.fromBuffer(buf, 0, 'version', 12);
            
            expect(ver).to.equal('3.8');
            
            done();
        });
        
        it('should understand rgb type', function (done) {
            var buf = new Buffer(6);
            var colour = {
                red:    200,
                green:  120,
                blue:   74
            };
            
            buf.writeUInt16BE(colour.red, 0);
            buf.writeUInt16BE(colour.green, 2);
            buf.writeUInt16BE(colour.blue, 4);
            
            expect(this.RFBType.fromBuffer(buf, 0, 'rgb', 6)).to.deep.equal(colour);
            done();
        });
    });
    
    
    
    describe('.toBuffer(buf, pos, type, value)', function () {
        it('should be a static method', function (done) {
            expect(this.RFBType.toBuffer).to.be.a('function');
            done();
        });
        
        it('should understand all the basic types', function (done) {
            var T = this.RFBType;
            
            'u8,s8,u16,s16,u32,s32'.split(',').forEach( function (typ, i) {
                var signed = 's' === typ.substr(0,1);
                var nbytes = parseInt( typ.substr(1), 10 ) / 8;
                var value = (signed ? -1: 1) * Math.pow(2, i);
                
                var buf = new Buffer(nbytes);
                
                T.toBuffer(buf, 0, typ, value);
                
                expect( T.fromBuffer(buf, 0, typ, nbytes) ).to.equal(value);
            });
            done();
        });
        
        it('should throw if no type is given', function (done) {
            var T = this.RFBType;
            var buf = new Buffer('aaa');
            
            expect( function () {
                T.toBuffer(buf, 0, undefined, 0);
            }).to.throw('type is required');
            done();
        });
        
        it('should throw if type is unknown', function (done) {
            var T = this.RFBType;
            var buf = new Buffer('aaa');

            expect( function () {
                T.toBuffer(buf, 0, 'ThisTypeIsNotDefined', 0);
            }).to.throw('is not defined');
            
            done();
        });
        
        it('should understand arrays of basic types', function (done) {
            var array = [2, 4, 6, 8, 10, 12];
            var T = this.RFBType;
            
            'u8,s8,u16,s16,u32,s32'.split(',').forEach( function (typ) {
                var nbytes = array.length * parseInt(typ.substr(1), 10) / 8;
                var buf = new Buffer(nbytes);
                
                T.toBuffer(buf, 0, typ, array);
                
                expect( T.fromBuffer(buf, 0, typ, nbytes) ).to.deep.equal(array);
            });
            
            
            done();
        });
        
        
        it('should understand u8string', function (done) {
            var string = 'a 8bit string';
            var buf = new Buffer(string.length);
            this.RFBType.toBuffer(buf, 0, 'u8string', string);
            
            var res = this.RFBType.fromBuffer(buf, 0, 'u8string', string.length);
            
            expect(res).to.equal(string);
            done();
        });
        
        it('should understand pixel_format', function (done) {
            var buf = new Buffer(16);
            var format = {
                bitsPerPixel:   7,
                depth:          4,
                bigEndianFlag:  1,
                trueColourFlag: 1,
                redMax:         10,
                greenMax:       11,
                blueMax:        12,
                redShift:       2,
                greenShift:     4,
                blueShift:      6
            };
            
            this.RFBType.toBuffer(buf, 0, 'pixel_format', format);
            
            var res = this.RFBType.fromBuffer(buf, 0, 'pixel_format', 16);
            
            expect(res).to.deep.equal(format);
            done();
        });
        
        it('should understand version', function (done) {
            var buf = new Buffer(12);
            
            this.RFBType.toBuffer(buf, 0, 'version', '3.30'); //just to test zeroes
            
            expect(buf.toString()).to.equal('RFB 003.030\n');
            done();
        });
        
        it('should understand rgb type', function (done) {
            var buf = new Buffer(6);
            var rgb = {red: 3, green: 44, blue: 34};
            
            this.RFBType.toBuffer(buf, 0, 'rgb', rgb);
            
            expect(this.RFBType.fromBuffer(buf, 0, 'rgb', 6)).to.deep.equal(rgb);
            done();
        });
    });
});