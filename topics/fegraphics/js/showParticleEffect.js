define(function (require) {

    var zrender = require('zrender');
    var ParticleEffect = require('./ParticleEffect');
    var Circle = require('zrender/shape/Circle');
    var Emitter = ParticleEffect.Emitter;
    var ForceField = ParticleEffect.ForceField;
    var BoxCollision = ParticleEffect.BoxCollision;
    var RepulsiveField = ParticleEffect.RepulsiveField;
    var Value = require('qtek/math/Value');
    var Vector2 = require('qtek/math/Vector2');

    var zr;
    var particleEffect;

    function createForceField(x, y, k) {
        var center = new Vector2(x, y);
        particleEffect.addEffector(new RepulsiveField(
            center, k
        ));
        var circle = new Circle({
            style: {
                x: 0,
                y: 0,
                r: 10,
                color: k > 0 ? '#800' : '#080'
            },
            position: [center.x, center.y],
            ondrift: function () {
                center.x = this.position[0];
                center.y = this.position[1];
            },
            draggable: true
        });
        zr.addShape(circle);
    }

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

        emitter.life = opts.random ? Value.random1D(4, 6) : Value.constant(1)

        particleEffect.addEmitter(emitter);


        if (opts.collision) {
            particleEffect.addEffector(new BoxCollision([[0, 0], [zr.getWidth(), zr.getHeight()]]));
        }
        if (opts.forceField) {
            createForceField(300, 300, 150);
            createForceField(150, 150, -100);
            emitter.velocity = Value.random2D(
                new Vector2(120, 80),
                new Vector2(80, 120)
            );
        }
        else {
            emitter.velocity = opts.random ? Value.random2D(
                new Vector2(400, 50),
                new Vector2(100, 10)
            ) : Value.vector(new Vector2(500, 100));
            particleEffect.addEffector(new ForceField(new Vector2(0, 300)));
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