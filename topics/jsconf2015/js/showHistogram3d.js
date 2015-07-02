define(function (require) {

    var Histogram3D = require('./Histogram3D');
    var Renderer = require('qtek/Renderer');
    var Animation = require('qtek/animation/Animation');
    var Scene = require('qtek/Scene');
    var PerspectiveCamera = require('qtek/camera/Perspective');
    var OrbitControl = require('qtek/plugin/OrbitControl');

    var glMatrix = require('qtek/dep/glmatrix');
    var vec4 = glMatrix.vec4;

    var histogram3d;
    var renderer;
    var animation;
    var scene;

    var colorList = [
        {
            percent: 0,
            color: [0, 0, 1, 1]
        },
        {
            percent: 0.25,
            color: [0, 0, 1, 1]
        },
        {
            percent: 0.55,
            color: [0, 1, 0, 1]
        },
        {
            percent: 0.85,
            color: [1, 1, 0, 1]
        },
        {
            percent: 1,
            color: [1, 0, 0, 1]
        }
    ];

    function init(dom, opt) {
        if (renderer) {
            return;
        }
        animation = new Animation();
        animation.start();
        renderer = new Renderer();
        scene = new Scene();
        renderer.resize(dom.clientWidth, dom.clientHeight);
        dom.appendChild(renderer.canvas);

        var camera = new PerspectiveCamera({
            aspect: renderer.getViewportAspect()
        });
        camera.position.set(-200, 400, 800);
        camera.lookAt(scene.position);

        getData(function (data, color) {
            var control = new OrbitControl({
                domElement: renderer.canvas,
                target: camera
            });

            histogram3d = new Histogram3D(data, color, opt);
            scene.add(histogram3d.root);
            animation.on('frame', function (deltaTime) {
                control.update(deltaTime);
                renderer.render(scene, camera);
            });
        })
    }

    function getColor(p) {
        p = Math.min(Math.max(p, 0), 1);
        for (var i = 0; i < colorList.length - 1; i++) {
            var p1 = colorList[i + 1].percent;
            var p0 = colorList[i].percent;
            if (p1 >= p && p0 <= p) {
                return vec4.lerp(
                    [],
                    colorList[i].color,
                    colorList[i + 1].color,
                    (p - p0) / (p1 - p0)
                );
            }
        }
    }

    function getData(cb) {
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var width = 400;
            var height = img.height / img.width * 400;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);
            var pixels = ctx.getImageData(0, 0, width, height);
            var data = [];
            var color = [];

            var off = 0;
            for (var j = 0; j < height; j++) {
                data[j] = [];
                color[j] = [];
                for (var i = 0; i < width; i++) {
                    var value = pixels.data[off];
                    data[j][i] = value;

                    var c = getColor(value / 255);
                    color[j][i] = c;

                    off += 4;
                }
            }

            cb && cb(data, color);
        }
        img.src = 'data/cngdp2010-exp3.png';
    }

    function dispose(dom) {
        if (renderer) {
            animation.stop();
            animation = null;
            renderer.disposeScene(scene);
            renderer = null;
            scene = null;
            histogram3d = null;

            dom.innerHTML = '';
        }
    }

    return {
        init: init,
        dispose: dispose
    };
});