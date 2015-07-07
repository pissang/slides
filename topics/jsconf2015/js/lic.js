// Imaging Vector Fields Using Line Integral Convolution
define(function (require) {

    var vec2 = require('zrender/tool/vector');

    var whiteNoise = require('./whiteNoise');

    var gradientData = require('./gradientData');

    var circularVector = function () {

        var vectors = [];
        var w = 100;
        var h = 100;

        for (var i = 0; i < h; i++) {
            vectors[i] = [];
            for (var j = 0; j < w; j++) {
                vectors[i][j] = [i - h / 2, -j + w / 2];
                vec2.normalize(vectors[i][j], vectors[i][j]);
            }
        }

        return vectors;
    }

    var circularScalar = function () {
        var scalars = [];
        var w = 100;
        var h = 100;

        for (var i = 0; i < h; i++) {
            scalars[i] = [];
            for (var j = 0; j < w; j++) {
                var x = j - w / 2;
                var y = i - h / 2;
                scalars[i][j] = Math.max(1 - Math.sqrt(x * x + y * y) / 100, 0);
            }
        }

        return scalars;
    }

    function filter(pixels, w, h, vectorField, out) {
        var vw = vectorField[0].length;
        var vh = vectorField.length;
        var sx = w / vw;
        var sy = h / vh;

        for (var i = 0; i < w; i++) {
            for (var j = 0; j < h; j++) {
                var r = 0;
                var g = 0;
                var b = 0;

                var v = vectorField[Math.min(Math.round(j / sy), vh - 1)][Math.min(Math.round(i / sx), vw - 1)];

                var l = Math.max(Math.abs(v[0] * sx), Math.abs(v[1] * sy));
                l = Math.ceil(l);

                var stepX = v[0] * sx / l;
                var stepY = v[1] * sy / l;

                if (l > 1) {
                    for (var k = -l; k < l; k++) {
                        var x = Math.round(stepX * k + i);
                        var y = Math.round(stepY * k + j);
                        x = Math.max(Math.min(w - 1, x), 0);
                        y = Math.max(Math.min(h - 1, y), 0);

                        var off = (y * w + x) * 4;
                        r += pixels[off];
                        g += pixels[off + 1];
                        b += pixels[off + 2];
                    }

                    var off2 = (j * w + i) * 4;
                    out[off2] = r / (l * 2);
                    out[off2 + 1] = g / (l * 2);
                    out[off2 + 2] = b / (l * 2);
                    out[off2 + 3] = 255;
                }
            }
        }
    }

    function colorLut(pixels, w, h, scalarField) {
        var vw = scalarField[0].length;
        var vh = scalarField.length;
        var sx = w / vw;
        var sy = h / vh;
        var gradientLen = gradientData.length;
        var off = 0;

        for (var j = 0; j < h; j++) {
            for (var i = 0; i < w; i++) {
                var scalar = scalarField[Math.min(Math.round(j / sy), vh - 1)][Math.min(Math.round(i / sx), vw - 1)];

                var idx = Math.round((gradientLen - 1) * scalar);

                var color = gradientData[idx];
                pixels[off++] *= color[0] / 255;
                pixels[off++] *= color[1] / 255;
                pixels[off++] *= color[2] / 255;
                pixels[off++] *= color[3] / 255;
            }
        }
    }

    function lic(dom, vectorField, scalarField) {

        var canvas = whiteNoise(dom.clientWidth, dom.clientHeight);
        var ctx = canvas.getContext('2d');

        dom.appendChild(canvas);

        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        var pixels0 = imageData.data;
        var pixels1 = new Uint8ClampedArray(pixels0.length);
        for (var i = 0; i < 5; i++) {
            filter(pixels0, canvas.width, canvas.height, vectorField, pixels1);
            var tmp = pixels0;
            pixels0 = pixels1;
            pixels1 = tmp;
        }

        if (scalarField) {
            colorLut(pixels0, canvas.width, canvas.height, scalarField);
        }

        var newData = ctx.createImageData(canvas.width, canvas.height);

        for (var i = 0; i < pixels0.length; i++) {
            newData.data[i] = pixels0[i];
        }
        ctx.putImageData(newData, 0, 0);
    }

    function init(dom, useWindField, useScalarField) {
        if (useWindField) {
            var scalarField = [];
            $.ajax({
                url: './data/winds.json',
                success: function (data) {
                    var field = [];
                    var p = 0;
                    for (var j = 0; j < data.ny; j++) {
                        field[data.ny - j - 1] = [];
                        scalarField[data.ny - j - 1] = [];
                        for (var i = 0; i < data.nx; i++, p++) {
                            var len = vec2.len(data.data[p]);
                            vec2.normalize(data.data[p], data.data[p]);
                            field[data.ny - j - 1][i] = data.data[p];
                            scalarField[data.ny - j - 1][i] = Math.min(len / 15, 1);
                        }
                    }

                    lic(dom, field, useScalarField && scalarField);
                }
            });
        }
        else {
            lic(dom, circularVector(), useScalarField && circularScalar());
        }
    }

    function dispose(dom) {
        dom.innerHTML = '';
    }

    return {
        init: init,
        dispose: dispose
    }
});