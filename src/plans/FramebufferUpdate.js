module.exports = [{
    name:   'messageType',
    type:   'u8',
    nbytes: 1,
    default:0
}, {
    type:   'padding',
    nbytes: 3
}, {
    name:   'numberOfRectangles',
    type:   'u16',
    nbytes: 2
}, {
    name:   'rectangles',
    type:   'rectangle',
    nbytes: 'numberOfRectangles'
}
    // FIXME: here come pixel data that are encoding-dependent!!!
                 ];