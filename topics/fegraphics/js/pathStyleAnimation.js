define(function (require) {

    var zrender = require('zrender');
    var StarShape = require('zrender/shape/Star');

    var zr;

    var star;

    function init(dom) {
        if (zr) {
            return;
        }
        zr = zrender.init($('#zr-path-style-animation')[0]);
        star = new StarShape({
            style: {
                x: zr.getWidth() / 2,
                y: zr.getHeight() / 2,
                r: zr.getHeight() / 2.5,
                n: 5,
                brushType: 'both',
                lineWidth: 2,
                color: 'white',
                strokeColor: '#000033',
                shadowOffsetX: 0,
                shadowOffsetY: 0,
                shadowBlur: 0
            }
        });
        zr.addShape(star);
    }

    function step(dom) {
        if (! star) {
            init(dom);
        }

        var step = dom.getAttribute('data-step');
        if (step) {
            var newStyle = {};
            switch (step) {
                case 'strokeStyle':
                    newStyle.strokeColor = 'white';
                    break;
                case 'fillStyle':
                    newStyle.color = '#000033';
                    break;
                case 'lineWidth':
                    newStyle.lineWidth = 15;
                    break;
                case 'shadow':
                    newStyle.shadowOffsetX = 30;
                    newStyle.shadowOffsetY = 30;
                    newStyle.shadowBlur = 10;
                    star.style.shadowColor = 'black';
                    break;
                case 'lineJoin':
                    star.style.lineJoin = 'round';
                    zr.modShape(star);
                    return;
            }   

            zr.animate(star, 'style')
                .when(1000, newStyle)
                .start();
        }
    }

    function dispose() {
        if (zr) {
            zr.dispose();
            zr = null;
        }
    }

    return {
        init: init,
        step: step,
        dispose: dispose
    };
});