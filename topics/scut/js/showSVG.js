define(function (require) {

    var svg = require('svg');
    var zrender = require('zrender');
    var zrColor = require('zrender/tool/color');

    var zr;

    function init(dom) {

        if (zr) {
            return;
        }

        zr = zrender.init(dom);

        svg.load('asset/test1.svg', function (g) {
            if (zr) {
                zr.addGroup(g);
                zr.render();
                g.onclick = function (e) {
                    e.target.style.color = zrColor.random();
                    zr.modShape(e.target.id);
                    zr.refresh();
                    e.cancelBubble = true;
                }
            }
        }, {
            clickable: true,
            hoverable: true,
            draggable: true 
        });
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