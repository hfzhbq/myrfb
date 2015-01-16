module.exports = [{
    name:   'messageType',
    type:   'u8',
    nbytes: 1,
    default:4
}, {
    name:   'downFlag',
    type:   'u8',
    nbytes: 1
}, {
    type:   'padding',
    nbytes: 2
}, {
    name:   'key',
    type:   'u32',
    nbytes: 4
}];