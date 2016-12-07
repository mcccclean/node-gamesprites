var fs = require('fs-extra');
var path = require('path');

var image = require('./image');
var formatters = require('./formatters');
var Sprite = require('./sprite');

// see if two rectangles overlap. if so, return the distance that A needs to shift
// to the right to avoid overlapping.
function rectshift(a, b) {
	if(a.x > b.x + b.width ||
		a.x + a.width < b.x ||
		a.y > b.y + b.height ||
		a.y + a.height < b.y) {
		return 0;
	} else {
		var overlap = b.x + b.width - a.x;
		return overlap;
	}
};

function Sheet(dir, outname, options) {
    this.dir = dir;
    this.outname = outname;
    this.options = options;

    this.sheet = null;
    this.imagedata = null;
}

Sheet.prototype.compile = function() {

	// load all images
	var images = {};
	var animations = {};

	var listing;
	try {
		listing = fs.readdirSync(this.dir);
	} catch(error) {
	    return Promise.reject(new Error("Source sprite directory does not exist."));
	}

	if(listing.length == 0) {
        return Promise.reject(new Error("Source sprite directory was empty."));
	}

	// setup calls to load all the images asynchronously; store their dimensions
	var loadercalls = listing.map(filename => {
        var sprite = new Sprite(filename);

		return sprite.load(this.dir).then(bitmap => {
            images[sprite.name] = bitmap;
            return sprite;
		});
	});

	// actually perform the above calls and then process everything
	return Promise.all(loadercalls).then(sprites => {

        var output = {
            spriteCount: 0,
            width: 0,
            height: 0,
            unreadableFiles: []
        };

		// remove images that haven't loaded properly
		var imagedata = sprites.filter(function(imd) { 
			if(imd.error) {
				output.unreadableFiles.push(imd.name);
				return false;
			} else {
				return true;
			}
		});

		if(listing.length == 0) {
	        throw new Error("No readable images in source directory.");
		}

		// figure out the total size of the sheet
		var totalsize = 0;
		for(var i = 0; i < imagedata.length; ++i) {
			var im = imagedata[i];
			totalsize += im.width * im.height;
		}

		var width = Math.ceil(Math.sqrt(totalsize) * 1.1); // this will (hopefully) just result in a roughly square image
		var actualwidth = 0;
		var height = 0;

		// order the images by total pixels
		imagedata.sort(function(a, b) {
			return b.width * b.height - a.width * a.height;
		});

		// begin packing the images, biggest first, by scanline, starting in top left
		for(var i = 0; i < imagedata.length; ++i) {
			var im = imagedata[i];
			im.x = 0;
			im.y = 0;
			for(var j = 0; j < i; ++j) {
				var testim = imagedata[j];
				var shunt = rectshift(im, testim);
				if(shunt) {
					im.x += shunt;
					if(im.x + im.width > width) {
						im.x = 0;
						im.y++;		// scanlines
					}
					j = -1;	
				}
			}
			actualwidth = Math.max(actualwidth, im.x + im.width);
			height = Math.max(height, im.y + im.height);
		}

		output.spriteCount = imagedata.length;
		output.width = width;
		output.height = height;
		output.imagedata = imagedata;

		var outdir = this.outname;
		fs.ensureDir(path.dirname(this.outname));

		// save sprite layout data
		var format = 'createjs';
		var data = formatters[format](this.outname, imagedata);
		fs.writeFileSync(this.outname + ".js", data);

		// create actual sheet image data
        return image.create(actualwidth, height).then(sheet => {
            // write all images to sheet
            for(var i = 0; i < imagedata.length; ++i) {
                var im = imagedata[i];
                try {
                    sheet.blit(images[im.name], im.x, im.y);
                } catch(e) {
                    console.log(images[im.name]);
                }
            }
            return sheet;
        }).then(sheet => {
            // save sheet
            return image.write(sheet, this.outname + ".png");
        }).then(() => { 
            return output;
		});

	});
};

module.exports = Sheet;

