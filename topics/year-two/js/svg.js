define(function(require) {

    var svgData = require('text!../assets/tiger.svg');

    var qtek = require('qtek');
    var qtek2d = require('qtek-2d');
    var SVG = require('qtek-2d/loader/SVG');
    var Context2D = require('qtek-2d/context/Context2D');

    var inited = false;

    function init(dom) {
        if (inited) {
            return;
        }
        var svgLoader = new SVG();
        var node = svgLoader.parse(svgData);

        var canvas1 = document.getElementById('render-webgl');
        canvas1.width = 600;
        canvas1.height = 840;

        var canvas2 = document.getElementById('render-canvas');
        canvas2.width = 600;
        canvas2.height = 840;

        var ctx = new Context2D({
            canvas: canvas1,
            depthChannelGap : 0.2
        });
        canvas1.style.height = canvas2.style.height;
        canvas1.style.width = 'auto';
        var ctx2 = canvas2.getContext('2d');
        
        var painter = ctx.beginDraw();
        node.render(ctx);
        ctx.endDraw();
        
        node.render(ctx2);

        inited = true;
    }

    function dispose() {

    }

    return {
        init: init,
        dispose: dispose
    }
});