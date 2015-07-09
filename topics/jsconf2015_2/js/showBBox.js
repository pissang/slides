define(function (require) {

    var AnimationPathContext = require('./AnimationPathContext');
    var Rect = require('zrender/shape/Rectangle');

    var ctx0;
    var ctx1;

    function build(ctx, minimum) {
        ctx.moveTo(50, 50);
        ctx.bezierCurveTo(0, 100, 0, 150, 50, 200);
        ctx.lineTo(200, 200);
        ctx.bezierCurveTo(250, 150, 250, 100, 200, 50);
        ctx.lineTo(50, 50);
        ctx.run(function () {
            var rect = new Rect({
                style: {
                    brushType: 'stroke',
                    lineWidth: 2,
                    strokeColor: 'red',
                    x: minimum ? 12 : 0,
                    y: 50,
                    width: minimum ? 188 + 38 : 250,
                    height: 150
                }
            });
            ctx.zr.addShape(rect);
        });
    }
    function init(dom) {
        if (ctx0) {
            return;
        }
        ctx0 = new AnimationPathContext($(dom).find('.bbox-example0')[0]);
        ctx1 = new AnimationPathContext($(dom).find('.bbox-example1')[0]);
        build(ctx0, false);
        build(ctx1, true);
    }

    function dispose(dom) {
        if (ctx0) {
            ctx0.dispose();
            ctx1.dispose();
            ctx0 = null;
            ctx1 = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    };
});