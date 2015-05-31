define(function(require) {
    
    var zrender = require('zrender');
    var Circle = require('zrender/shape/Circle');
    var Polyline = require('zrender/shape/Polyline');

    var zr;

    function init(dom) {
        if (zr) {
            return;
        }
        zr = zrender.init(dom);

        var points = [];
        for (var j = 0; j < 20; j++) {
            var point = [
                Math.random() * (zr.getWidth() - 20) + 20,
                Math.random() * (zr.getHeight() - 20) + 20
            ];
            var circle = new Circle({
                style: {
                    x: 0,
                    y: 0,
                    r: 5,
                    brushType: 'fill',
                    color: '#9b2e4a',
                    opacity: 0.7
                },
                zlevel: 2,
                hoverable: false,
                position: point.slice()
            });
            zr.addShape(circle);

            points.push(point);
        }


        for (var i = 0; i < 200; i++) {
            var circle = new Circle({
                style: {
                    x: 0,
                    y: 0,
                    r: 6,
                    brushType: 'both',
                    strokeColor: '#06B3DB',
                    color: '#fff',
                    lineWidth: 3
                },
                zlevel: 1,
                hoverable: false,
                position: [-100, -100]
            });
            zr.addShape(circle);

            var deferred = zr.animate(circle.id, "", circle, true);
            for (var j = 0; j < points.length; j++) {
                deferred.when(j * 2000, {
                    position : points[j]
                });
            }

            deferred.delay(i * 200 - 100000).start('spline');
        }

        var brokenLine = {
            zlevel : 0,
            style : {
                pointList : points,
                smooth : 'spline',
                brushType : 'stroke',
                strokeColor : 'white',
                lineWidth: 1
            },
            hoverable: false
        }
        var brokenLine2 = {
            zlevel : 2,
            style : {
                pointList : points.slice(),
                brushType : 'stroke',
                strokeColor : '#9b2e4a',
                lineWidth: 1,
                opacity: 0.7
            },
            hoverable: false
        }
        zr.addShape(new Polyline(brokenLine));
        zr.addShape(new Polyline(brokenLine2));
    }

    function dispose() {
        if (zr) {
            zr.dispose();
            zr = null   
        }
    }

    return {
        init: init,
        dispose: dispose
    }
});