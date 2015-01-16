module.exports = [{
    name:   'messageType',
    type:   'u8',
    nbytes: 1,
    default:0
}, {
    type:   'padding',
    nbytes: 3
}, {
    name:   'pixelFormat',
    type:   'pixel_format',
    nbytes: 16
}];