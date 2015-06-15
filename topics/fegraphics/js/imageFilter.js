define(function (require) {

    function grayFilter(pixels) {
        for (var i = 0; i < pixels.length; i += 4) {
            var r = pixels[i];
            var g = pixels[i + 1];
            var b = pixels[i + 2];
            var lum = r * 0.21 + g * 0.72 + b * 0.07;
            pixels[i] = lum;
            pixels[i + 1] = lum;
            pixels[i + 2] = lum;
        }
    }

    var kenel = [
        0.04, 0.25, 1.11, 3.56, 8.20, 13.5, 16.0, 13.5, 8.20, 3.56, 1.11, 0.25, 0.04
    ];
    var sum = 0;
    for (var k = 0; k < kenel.length; k++) {
        sum += kenel[k];
    }
    for (var k = 0; k < kenel.length; k++) {
        kenel[k] /= sum;
    }

    function gaussianFilterSeperate(pixels, w, h, isHorizontal) {
        var halfLen = Math.floor(kenel.length / 2);
        for (var i = 0; i < w; i++) {
            for (var j = 0; j < h; j++) {
                var r = 0;
                var g = 0;
                var b = 0;
                var a = 0;
                for (var k = 0; k < kenel.length; k++) {
                    var off2;
                    if (isHorizontal) {
                        off2 = Math.max(Math.min(k - halfLen + i, w - 1), 0) + j * w;
                    }
                    else {
                        off2 = Math.max(Math.min(k - halfLen + j, h - 1), 0) * w + i;
                    }
                    off2 *= 4;
                    r += kenel[k] * pixels[off2];
                    g += kenel[k] * pixels[off2 + 1];
                    b += kenel[k] * pixels[off2 + 2];
                    a += kenel[k] * pixels[off2 + 3];
                }
                var offset = (j * w + i) * 4;
                pixels[offset] = r;
                pixels[offset + 1] = g;
                pixels[offset + 2] = b;
                pixels[offset + 3] = a;
            }
        }
    }

    function gaussianFilter(pixels, w, h) {
        gaussianFilterSeperate(pixels, w, h, true);
        gaussianFilterSeperate(pixels, w, h, false);
    }

    function init(dom, filter) {
        var canvas = document.createElement('canvas');
        canvas.width = dom.clientWidth;
        canvas.height = dom.clientHeight;
        var ctx = canvas.getContext('2d');

        dom.appendChild(canvas);

        var image = new Image();
        image.onload = function () {
            var height = 450;
            var width = height / image.height * image.width;
            ctx.drawImage(image, 0, 0, width, height);

            var imageData = ctx.getImageData(0, 0, width, height);

            var time = Date.now();
            switch(filter) {
                case 'gray':
                    grayFilter(imageData.data);
                    break;
                case 'gaussian':
                    gaussianFilter(imageData.data, width, height);
                    break;
            }
            time = Date.now() - time;

            ctx.putImageData(imageData, 0, 0);

            var timeDom = document.createElement('div');
            dom.style.position = 'relative';
            timeDom.style.cssText = 'color: red; font-size:30px; position:absolute;left:20px;top:20px;';
            timeDom.innerHTML = time + 'ms';

            dom.appendChild(timeDom);
        }
        image.src = 'img/bird.jpg';
    }

    function dispose(dom) {
        dom.innerHTML = '';
    }

    return {
        init: init,
        dispose: dispose
    };
});