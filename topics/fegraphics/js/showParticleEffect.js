define(function (require) {

    var zrender = require('zrender');
    var ParticleEffect = require('./ParticleEffect');
    var Circle = require('zrender/shape/Circle');
    var Emitter = ParticleEffect.Emitter;
    var ForceField = ParticleEffect.ForceField;
    var BoxCollision = ParticleEffect.BoxCollision;
    var Value = require('qtek/math/Value');
    var Vector2 = require('qtek/math/Vector2');

    var zr;
    var particleEffect;

    function init(dom, opts) {
        opts = opts || {};
        if (zr) {
            return;
        }
        zr = zrender.init(dom);
        particleEffect = new ParticleEffect(zr);

        var emitter = new Emitter(function () {
            return new Circle({
                style: {
                    x: 0,
                    y: 0,
                    r: 2
                },
                position: [100, 50],
                hoverable: false
            });
        });
        emitter.position = opts.random ? Value.random2D(
            new Vector2(10, 10),
            new Vector2(20, 20)
        ) : Value.vector(new Vector2(10, 10));

        emitter.velocity = opts.random ? Value.random2D(
            new Vector2(400, 50),
            new Vector2(100, 10)
        ) : Value.vector(new Vector2(500, 100));

        emitter.life = opts.random ? Value.random1D(4, 6) : Value.constant(1)

        particleEffect.addEmitter(emitter);

        var field = new ForceField();
        field.force = new Vector2(0, 300);
        particleEffect.addEffector(field);

        if (opts.collision) {
            particleEffect.addEffector(new BoxCollision([[0, 0], [zr.getWidth(), zr.getHeight()]]));
        }

        zr.animation.bind('frame', function (deltaTime) {
            particleEffect.update(deltaTime);
        });

        if (opts.motionBlur) {
            zr.modLayer(0, {
                motionBlur: true,
                lastFrameAlpha: 0.9
            });
        }
    }

    function dispose() {
        if (zr) {
            zr.dispose();
            zr = null;
            particleEffect = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    };
});