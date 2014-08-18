define(function(require) {

    var StarShape = require('zrender-x/shape/Star');
    var CircleShape = require('zrender-x/shape/Circle');
    var zrender = require('zrender-x');
    var color = require('zrender/tool/color');

    var NUMBER = 10000;

    var zr;

    function init(dom) {
        if (zr) {
            return;
        }
        zr = zrender.init(dom);

        for (var i = 0; i < NUMBER; i++) {
            if (i % 2) {
                var shape = new StarShape({
                    style: {
                        x : 0,
                        y : 0,
                        r : 5,
                        n: 5,
                        color: color.random()
                    },
                    hoverable: false
                });
            } else {
                var shape = new CircleShape({
                    style : {
                        x: 0,
                        y: 0,
                        r: 5,
                        color: color.random()
                    },
                    hoverable: false
                });
            }

            zr.addShape(shape);

            var deferred = zr.animate(shape.id, "", shape, true);

            var points = [];
            var point = [
                Math.random() * zr.getWidth(),
                Math.random() * zr.getHeight()
            ];
            //shape.position = point;
            points.push(point);
            for (var j = 1; j < 10; j++) {
                var point = [
                    Math.random() * zr.getWidth(),
                    Math.random() * zr.getHeight()
                ];
                deferred.when(j * 2000, {
                    position : point
                });
                points.push(point);
            }
            deferred.start('spline');
        }

        var fpsDom = document.createElement('div');
        fpsDom.style.position = 'absolute';
        fpsDom.style.fontSize = '22px';
        fpsDom.style.color = 'red';
        fpsDom.style.right = '20px';
        fpsDom.style.top = '20px';
        dom.appendChild(fpsDom);
        var fps;
        zr.animation.bind('frame', function(deltaTime) {
            fps = Math.ceil(1000 / deltaTime);
        });

        setInterval(function() {
            fpsDom.innerHTML = fps + ' fps';
        }, 200);
    }

    function dispose() {
        if (zr) {
            zr.dispose();
            zr = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    }
});