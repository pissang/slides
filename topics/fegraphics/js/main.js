define(function (require) {

    var AnimationPathContext = require('./AnimationPathContext');

    var codes = {};

    $('pre.prettyprint').each(function () {
        if (this.id) {
            codes[this.id] = this.innerHTML;
        }
    });
    prettyPrint();

    function pathDrawAnimation(dom) {
        var code = codes[dom.getAttribute('data-code')];

        var func = new Function('ctx', code);
        var ctx = new AnimationPathContext(dom);

        func(ctx);

        ctx.run();

        return ctx;
    }

    var actions = {
        pathDrawAnimation: {

            ctx: null,

            enter: function (dom) {
                setTimeout(function () {
                    actions.pathDrawAnimation.ctx = pathDrawAnimation(dom);
                });
            },

            leave: function () {
                actions.pathDrawAnimation.ctx.dispose();
            }
        },

        pathStyleAnimation: {

            enter: function (dom) {
                setTimeout(function () {
                    require('./pathStyleAnimation').step(dom);
                })
            }
        },

        initPathStyleAnimation: {
            enter: function (dom) {
                require('./pathStyleAnimation').init(dom);
            },

            leave: function () {
                require('./pathStyleAnimation').dispose();
            }
        },

        showCanvasImage: {
            enter: function (dom) {
                require('./showCanvasImage').init(dom);
            },

            leave: function () {
                require('./showCanvasImage').dispose();
            }
        },

        showCanvasText: {
            enter: function (dom) {
                require('./showCanvasText').init(dom);
            },

            leave: function () {
                require('./showCanvasText').dispose();
            }
        },

        showParticle: {
            enter: function (dom) {
                require('./showParticle').init(dom);
            },

            leave: function () {
                require('./showParticle').dispose();
            }
        },

        initParticleKinematic: {
            enter: function (dom) {
                require('./particleKinematic').init(dom);
            },

            leave: function (dom) {
                require('./particleKinematic').dispose(dom);
            }
        },

        addParticleKinematic: {
            enter: function (dom) {
                require('./particleKinematic').step(dom);
            }
        },

        showParticleEffect: {
            enter: function (dom) {
                setTimeout(function () {
                    require('./showParticleEffect').init(dom, {
                        random: dom.getAttribute('data-random'),
                        collision: dom.getAttribute('data-collision'),
                        motionBlur: dom.getAttribute('data-motion-blur'),
                        forceField: dom.getAttribute('data-force-field')
                    });
                })
            },
            leave: function (dom) {
                require('./showParticleEffect').dispose(dom);  
            }
        }
    };

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});