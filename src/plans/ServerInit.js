module.exports = [{
    name:   'framebufferWidth',
    type:   'u16',
    nbytes: 2
}, {
    name:   'framebufferHeight',
    type:   'u16',
    nbytes: 2
}, {
    name:   'serverPixelFormat',
    type:   'pixel_format',
    nbytes: 16
}, {
    name:   'nameLength',
    type:   'u32',
    nbytes: 4
}, {
    name:   'nameString',
    type:   'u8string',
    nbytes: 'nameLength'
}];