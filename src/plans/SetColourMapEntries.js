module.exports = [{
    name:   'messageType',
    type:   'u8',
    nbytes: 1,
    default:1
}, {
    type:   'padding',
    nbytes: 1
}, {
    name:   'firstColour',
    type:   'u16',
    nbytes: 2
}, {
    name:   'numberOfColours',
    type:   'u16',
    nbytes: 2
}, {
    name:   'colours',
    type:   'rgb',
    nbytes: 'numberOfColours'
}];