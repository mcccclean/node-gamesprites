
var Jimp = require('jimp');

var PARTS = /_(\d+)(__(.*))?$/;

function Sprite(filename) {
    var basename = filename.substr(0, filename.lastIndexOf('.')) || filename;

    this.filename = filename;
    this.name = basename;
    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;

    var options = this.name.split(PARTS);
    this.animname = options[0];
    this.animidx = parseInt(options[1] || '0');
    this.options = {
        voffset: 'm',
        hoffset: 'c',
        speed: 1,
        pingpong: false,
        delay: 0
    };

    if(options[3]) {
        this.parseOptions(options[3]);
    }
}

Sprite.prototype.parseOptions = function(optstring) {
    var opts = optstring.split(/(\w[\d\.]*)/g);
    opts.forEach((o) => {
        if(o) {
            var option = o[0];
            var value = o.substr(1, o.length-1);
            switch(option) {
                case 't':
                case 'm':
                case 'b':
                    this.options.voffset = option;
                    break;
                case 'l':
                case 'c':
                case 'r':
                    this.options.hoffset = option;
                    break;
                case 's':
                    this.options.speed = parseFloat(value);
                    break;
                case 'p':
                    this.options.pingpong = true;
                    break;
                case 'd':
                    this.options.delay = parseInt(value);
                    break;
            }
        }
    });
};

Sprite.prototype.load = function(dir) {
    return new Promise((resolve, reject) => {
        // load the image
        var path = dir + '/' + this.filename;
        var im = new Jimp(path, (err, image) => {
            if(image) {
                resolve(image);
            } else {
                reject(err);
            }
        });
    }).then(image => {
        // keep dimensions
        this.width = image.bitmap.width;
        this.height = image.bitmap.height;

        // determine offset
        switch(this.options.hoffset) {
            case 'l': this.ox = 0; break;
            case 'c': this.ox = this.width / 2; break;
            case 'r': this.ox = this.width; break;
        }

        switch(this.options.voffset) {
            case 't': this.oy = 0; break;
            case 'm': this.oy = this.height / 2; break;
            case 'b': this.oy = this.height; break;
        }

        return image;
    });
};

module.exports = Sprite;
