var reqDir = require('require-directory');
module.exports = reqDir(module);

module.exports.create = function (reqHead) {
    var rect;
    
    switch (reqHead.encodingType) {
        case 0:
            rect = new this.Raw(reqHead);
            break;
        case 1:
            rect = new this.CopyRect(reqHead);
            break;
        case 2:
            rect = new this.RRE(reqHead);
            break;
        case 5:
            rect = new this.Hextile(reqHead);
            break;
        case 16:
            rect = new this.ZRLE(reqHead);
            break;
        case -239:
            rect = new this.Cursor(reqHead);
            break;
        case -223:
            rect = new this.DesktopSize(reqHead);
            break;
        default:
            rect = null;
            break;
    }
    
    return rect;
};