define(function (require) {

    var zrender = require('zrender');
    var Circle = require('zrender/shape/Circle');

    var zr;

    function init(dom) {
        if (zr) {
            return;
        }
        zr = zrender.init(dom);

        var circle = new Circle({
            style: {
                x: 0,
                y: 0,
                r: 10,
                color: 'white'
            },
            position: [100, 50],
            hoverable: false
        });
        zr.addShape(circle);
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