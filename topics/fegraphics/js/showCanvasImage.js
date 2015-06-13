define(function (require) {

    var zrender = require('zrender');
    var ImageShape = require('zrender/shape/Image');

    var zr;

    function init(dom) {
        if (zr) {
            return;
        }
        zr = zrender.init(dom);
        image = new ImageShape({
            style: {
                x: 100,
                y: 0,
                width: 500,
                height: 300,
                image: 'img/bird.jpg'
            }
        });
        zr.addShape(image);
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
    };
});