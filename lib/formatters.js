module.exports = {

    // format for CreateJS framework
    createjs: function(outname, imagedata) {
        var frames = [];
        var animations = {};

        // first pass: set up frame for each image, ensure an animation array is present
        imagedata.forEach(function(im) {
            var ox = Math.floor(im.width / 2);
            var oy = Math.floor(im.height / 2);
            im.frame = frames.length;
            frames.push([im.x, im.y, im.width, im.height, 0, im.ox, im.oy]);
            if(!animations[im.animname]) {
                animations[im.animname] = { frames: [] };
            }
        });

        // re-sort the images to frame order and then push their frame indices
        // into the respective arrays.
        imagedata.sort(function(a, b) { return a.animidx - b.animidx; });
        imagedata.forEach(function(im) {
            animations[im.animname].frames.push(im.frame);
        });

        // put all the data in its appropriate groups and JSONify
        var data = {
            frames: frames,
            animations: animations,
            images: [ outname + ".png" ]
        };
        return JSON.stringify(data, null, 2);
    }
};


