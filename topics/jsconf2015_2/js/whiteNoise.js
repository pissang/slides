define(function  () {
    return function (w, h) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;

        var pixels = ctx.createImageData(w, h);
        var off = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                var fill = Math.random() < 0.5 ? 255 : 0;
                pixels.data[off++] = fill;
                pixels.data[off++] = fill;
                pixels.data[off++] = fill;
                pixels.data[off++] = 255;
            }
        }
        ctx.putImageData(pixels, 0, 0);

        return canvas;
    }
})