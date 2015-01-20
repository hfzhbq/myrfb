var PredefinedRectangles = require('./PredefinedRectangles');

function create (rectHead) {
    var t = rectHead.encodingType;
    var rect = PredefinedRectangles.create(rectHead);
    
    return rect;
}

module.exports = {
    create: create
};