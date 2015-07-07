define(function (require) {

    function imageToArray(img) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var width = img.width;
        var height = img.height;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        var pixels = ctx.getImageData(0, 0, width, height);
        var data = [];
        var color = [];

        var off = 0;
        for (var j = 0; j < height; j++) {
            data[j] = [];
            for (var i = 0; i < width; i++) {
                data[j][i] = [
                    pixels.data[off++],
                    pixels.data[off++],
                    pixels.data[off++],
                    pixels.data[off++]
                ];
            }
        }

        return data;
    }

    return imageToArray;
});