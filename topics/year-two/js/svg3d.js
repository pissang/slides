define(function(require) {

    var svgData = require('text!../assets/tiger.svg');

    var qtek = require('qtek');
    var Animation = require('qtek/animation/Animation');
    var OrbitControl = require('qtek/plugin/OrbitControl');
    var PerspectiveCamera = require('qtek/camera/Perspective');

    var qtek2d = require('qtek-2d');
    var SVG = require('qtek-2d/loader/SVG');
    var Context2D = require('qtek-2d/context/Context2D');

    var animation;

    function init(dom) {
        if (animation) {
            return;
        }
        animation = new Animation();
        animation.start();

        var svgLoader = new SVG();
        var node = svgLoader.parse(svgData);

        dom.width = dom.clientWidth;
        dom.height = dom.clientHeight;

        var ctx = new Context2D({
            canvas: dom,
            depthChannelGap : 0.5
        });
        
        node.scale.set(1, -1);
        node.position.set(-300, 400);

        var painter = ctx.beginDraw();
        node.render(ctx);
        ctx.endDraw();

        ctx.camera = new PerspectiveCamera({
            aspect : dom.width / dom.height
        });
        ctx.camera.far = 2000;
        ctx.camera.position.z =800;

        var control = new OrbitControl({
            domElement : dom,
            target : ctx.camera
        });

        animation.on('frame', function(dTime) {
            control.update(dTime * 100);
            ctx.camera.update(true);
            ctx.clear();
            painter.draw(ctx);
        });
        inited = true;
    }

    function dispose() {
        if (animation) {
            animation.off('frame');
            animation = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    }
});