define(function (require) {

    var vec2 = require('zrender/tool/vector');
    var Circle = require('zrender/shape/Circle');
    var zrender = require('zrender');
    var zrColor = require('zrender/tool/color');

    var zr;
    var disposed = false;

    function init(dom) {
        if (zr) {
            return;
        }

        disposed = false;
        var img = new Image();
        img.onload = function () {
            if (disposed) {
                return;
            }
            function createParticle(x, y) {
                var circle = new Circle({
                    hoverable: false,
                    style: {
                        color: zrColor.random(),
                        x: x,
                        y: y,
                        r: 7,
                    }
                });

                zr.addShape(circle);

                zr.animate(circle, 'style', true)
                    .when(2000, {
                        r: 7
                    })
                    .during(function () {
                        var x = circle.style.x;
                        var y = circle.style.y;

                        if (x <= 0 || y <= 0 || x >= zr.getWidth() || y >= zr.getHeight()) {
                            zr.delShape(circle);
                            return;
                        }

                        var scaleX = data[0].length / zr.getWidth();
                        var scaleY = data.length / zr.getHeight();

                        var v = data[Math.floor(scaleY * y)][Math.floor(scaleX * x)];
                        circle.style.x += v[0] * 10;
                        circle.style.y += v[1] * 10;

                        zr.modShape(circle);
                    })
                    .start();
            }

            var data = require('./perlinData');

            // var data = [];
            // var noise = require('./noise');
            // noise.seed(Math.random());
            // for (var i = 0; i < 40; i++) {
            //     data[i] = [];
            //     for (var j = 0; j < 40; j++) {
            //         var x = noise.perlin3(i / 10, j / 10, 0.5);
            //         var y = noise.perlin3(i / 20, j / 20, 0.8);
            //         data[i][j] = [x, y];
            //         var len = Math.max(vec2.len(data[i][j]), 0.5);
            //         vec2.normalize(data[i][j], data[i][j]);
            //         vec2.scale(data[i][j], data[i][j], len);
            //     }
            // }

            // var data = require('./imageToArray')(img);
            // data.forEach(function (row, idx) {
            //     row.forEach(function (item) {
            //         item[0] -= 128;
            //         item[1] -= 128;
            //         // vec2.normalize(item, item);
            //         item[0] /= 64;
            //         item[1] /= 64;
            //     });
            // });

            var canvas = require('./drawVectors')(dom, data, 0.5, true);
            canvas.style.opacity = 0.5;

            var container = document.createElement('div');
            dom.appendChild(container);
            container.style.cssText = 'position:absolute;left:0;top:0;bottom:0;right:0';
            zr = zrender.init(container);
            zr.modLayer(0, {
                motionBlur: true,
                lastFrameAlpha: 0.95
            })

            container.addEventListener('click', function (e) {
                createParticle(e.pageX, e.pageY);
            });
        }
        img.src = 'data/perlin.png';
    }

    function dispose(dom) {
        if (zr) {
            zr.dispose();
            dom.innerHTML = '';
            zr = null;
            disposed = true;
        }
    }

    return {
        init: init,
        dispose: dispose
    };
});