define(function (require) {

    var zrender = require('zrender');
    var CircleShape = require('zrender/shape/Circle');

    var zr;

    var circle;

    var initVelocity = [0, 0];
    var acceleration = [0, 0];

    var velocity = [0, 0];

    function init(dom) {
        if (zr) {
            return;
        }
        zr = zrender.init($('#particle-kinematic')[0]);

        circle = new CircleShape({
            style: {
                x: 0,
                y: 0,
                r: 10,
                color: 'white'
            },
            position: [100, 50],
            hoverable: false
        });
        zr.addShape(circle);

        var obj = {p: 0};
        var animator = zr.animation.animate(obj, {loop: true})
            .when(1500, {
                p: 1
            })
            .during(function () {
                velocity[0] += acceleration[0];
                velocity[1] += acceleration[1];

                circle.position[0] += velocity[0];
                circle.position[1] += velocity[1];

                zr.modShape(circle);
            })
            .start();

        // TODO
        var clip = animator._clipList[0];
        clip.onrestart = function () {
            velocity[0] = initVelocity[0];
            velocity[1] = initVelocity[1];
            circle.position[0] = 100;
            circle.position[1] = 50;
        }
    }

    function step(dom) {
        if (! circle) {
            init(dom);
        }

        var step = dom.getAttribute('data-step');
        if (step) {
            switch (step) {
                case 'velocity':
                    initVelocity[0] = velocity[0] = 5;
                    initVelocity[1] = velocity[1] = 1;
                    break;
                case 'acceleration':
                    acceleration[1] = 0.2;
                    break;
                case 'color':
                    zr.animate(circle, 'style', true)
                        .when(1500, {
                            color: '#330000'
                        })
                        .start();
                    break;
                case 'size':
                    zr.animate(circle, 'style', true)
                        .when(1500, {
                            r: 2
                        })
                        .start();
                    break;
            }
        }
    }

    function dispose() {
        if (zr) {
            zr.dispose();
            zr = null;
            circle = null;
        }
    }

    return {
        init: init,
        step: step,
        dispose: dispose
    };
});