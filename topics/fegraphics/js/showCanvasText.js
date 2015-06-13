define(function (require) {

    var zrender = require('zrender');
    var TextShape = require('zrender/shape/Text');

    var zr;

    function init(dom) {
        if (zr) {
            return;
        }
        zr = zrender.init(dom);
        text = new TextShape({
            style: {
                x: 100,
                y: 100,
                text: '蛤蛤蛤蛤',
                brushType: 'stroke',
                strokeColor: '#fff',
                textFont: '100px Helvetica'
            }
        });
        zr.addShape(text);
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