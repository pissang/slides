define(function (require) {

    function heatmap(image, gradientImage) {
        var gradientCanvas = document.createElement('canvas');
        var gradientCtx = gradientCanvas.getContext('2d');
        gradientCanvas.width = 256;
        gradientCanvas.height = 1;
        gradientCtx.drawImage(gradientImage, 0, 0, 256, 1);
        var gradient = gradientCtx.getImageData(0, 0, 256, 1).data;

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var gradientLen = gradient.length / 4;
        for (var i = 0; i < pixels.data.length;) {
            var r = pixels.data[i] / 255;

            var idx = Math.round((gradientLen - 1) * r);

            if (r > 0) {
                pixels.data[i++] = gradient[idx * 4];
                pixels.data[i++] = gradient[idx * 4 + 1];
                pixels.data[i++] = gradient[idx * 4 + 2];
                pixels.data[i++] = gradient[idx * 4 + 3];
            }
            else {
                i += 4;
            }
        }
        ctx.putImageData(pixels, 0, 0);

        return canvas;
    }

    return heatmap;
}); 