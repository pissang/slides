define(function (require) {

    var zrender = require('zrender');
    var ParticleEffect = require('./ParticleEffect');
    var Circle = require('zrender/shape/Circle');
    var Emitter = ParticleEffect.Emitter;
    var ForceField = ParticleEffect.ForceField;
    var Value = require('qtek/math/Value');
    var Vector2 = require('qtek/math/Vector2');

    var zr;
    var particleEffect;

    function init(dom, random) {
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
                    r: 5,
                    color: 'white'
                },
                position: [100, 50],
                hoverable: false
            });
        });
        emitter.position = random ? Value.random2D(
            new Vector2(10, 10),
            new Vector2(20, 20)
        ) : Value.vector(new Vector2(10, 10));

        emitter.velocity = random ? Value.random2D(
            new Vector2(800, 100),
            new Vector2(200, 50)
        ) : Value.vector(new Vector2(500, 100));

        particleEffect.addEmitter(emitter);

        var field = new ForceField();
        field.force = new Vector2(0, 900);
        particleEffect.addField(field);

        zr.animation.bind('frame', function (deltaTime) {
            particleEffect.update(deltaTime);
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
    };
});