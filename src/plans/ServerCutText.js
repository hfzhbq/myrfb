module.exports = [{
    name:   'messageType',
    type:   'u8',
    nbytes: 1,
    default:3
}, {
    type:   'padding',
    nbytes: 3
}, {
    name:   'length',
    type:   'u32',
    nbytes: 4
}, {
    name:   'text',
    type:   'u8string',
    nbytes: 'length'
}];