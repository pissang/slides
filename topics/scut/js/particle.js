define(function(require) {

    var qtek = require('qtek');
    var canvas = document.getElementById('bg-particles');

    var ParticleRenderable = qtek.particleSystem.ParticleRenderable;
    var Emitter = qtek.particleSystem.Emitter;
    var Renderer = qtek.Renderer;
    var PerspectiveCamera = qtek.camera.Perspective;
    var Scene = qtek.Scene;
    var Vector3 = qtek.math.Vector3;
    var Texture2D = qtek.Texture2D;
    var easing = qtek.animation.easing;

    var vec4 = qtek.dep.glmatrix.vec4;

    var renderer;
    var camera;
    var scene;

    var particleRenderable;

    var animation = new qtek.animation.Animation();
    animation.start();

    function generateSprite(size) {
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 60, 0, Math.PI * 2, false);
        ctx.closePath();

        var gradient = ctx.createRadialGradient(
                size/2, size/2, 0, size/2, size/2, size/2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
        gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(1.0, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        return canvas;
    }

    function generateGradient() {
        var canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 10;
        var ctx = canvas.getContext('2d');

        var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);

        var c1 = [46, 95, 208, 1.0];
        var c2 = [128, 71, 158, 0.3];
        var c = [];

        gradient.addColorStop(0, 'rgba(' + c1.join(',') + ')');
        var steps = 3;
        for (var i = 0; i < steps; i++) {
            var p = (i+1) / (steps+1);
            vec4.lerp(c, c1, c2, easing.CubicInOut(p));
            c[3] = Math.random();
            for (var j = 0; j < 3; j++) {
                c[j] = Math.round(c[j]);
            }
            gradient.addColorStop(p, 'rgba(' + c.join(',') + ')');
        }
        gradient.addColorStop(1, 'rgba(' + c2.join(',') + ')');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas;
    }

    function start() {
         renderer = new Renderer({
            canvas: canvas,
            devicePixelRatio: 1.0
        });
        renderer.resize(window.innerWidth, window.innerHeight);
        scene = new Scene();
        camera = new PerspectiveCamera({
            aspect: renderer.width / renderer.height
        });
        camera.position.z = 100;

        particleRenderable = new ParticleRenderable();

        var emitter1 = new Emitter({
            max: 1000,
            amount: 3,
            life: Emitter.random1D(2, 4),
            spriteSize: Emitter.constant(400),
            position: Emitter.random3D(
                new Vector3(-100, -80, 100),
                new Vector3(100, 0, -60)
            ),
            velocity: Emitter.random3D(
                new Vector3(-2, 1, -2),
                new Vector3(2, 2, 2)
            )
        });
        var emitter2 = new Emitter({
            max: 1000,
            amount: 3,
            life: Emitter.random1D(2, 4),
            spriteSize: Emitter.constant(400),
            position: Emitter.random3D(
                new Vector3(-100, 0, 100),
                new Vector3(100, 40, -60)
            ),
            velocity: Emitter.random3D(
                new Vector3(-2, 1, -2),
                new Vector3(2, 1, 2)
            )
        });
        particleRenderable.addEmitter(emitter1);
        particleRenderable.addEmitter(emitter2);
        particleRenderable.material.set('color', [2, 2, 2]);
        particleRenderable.material.shader.enableTexture('sprite');
        particleRenderable.material.shader.enableTexture('gradient');

        particleRenderable.material.blend = function(_gl){
            _gl.blendEquation(_gl.FUNC_ADD);
            _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE);
        }

        var sprite = generateSprite(64);
        var gradient = generateGradient();

        particleRenderable.material.set('sprite', new Texture2D({
            image: sprite
        }));
        particleRenderable.material.set('gradient', new Texture2D({
            image: gradient
        }));

        scene.add(particleRenderable);

        animation.on('frame', frame);
    }

    function frame(deltaTime) {
        particleRenderable.updateParticles(deltaTime);
        renderer.render(scene, camera);
    }

    function resize() {
        renderer.resize(window.innerWidth, window.innerHeight);
        camera.aspect = renderer.width / renderer.height;
    }

    return {
        start: start,
        resize: resize
    }
})