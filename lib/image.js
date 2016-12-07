var Jimp = require('jimp');

function create(w, h) {
    return new Promise((resolve, reject) => {
		new Jimp(w, h, (err, image) => {
            if(err) {
                reject(err);
            } else {
                resolve(image);
            }
        });
    });
}

function write(jimp, filename) {
    return new Promise((resolve, reject) => {
        jimp.write(filename, (err) => {
            if(err) {
                reject(err);
            } else {
                resolve(jimp);
            }
        });
    });
}

module.exports = {
    create, write
};
