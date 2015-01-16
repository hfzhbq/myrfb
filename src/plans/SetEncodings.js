module.exports = [{
    name:   'messageType',
    type:   'u8',
    nbytes: 1,
    default:2
}, {
    type:   'padding',
    nbytes: 3
}, {
    name:   'numberOfEncodings',
    type:   'u16',
    nbytes: 2
}, {
    name:   'encodingTypes',
    type:   's32',
    nbytes: 'numberOfEncodings'
}];