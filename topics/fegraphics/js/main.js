define(function (require) {

    var AnimationPathContext = require('./AnimationPathContext');

    require('qtek/shader/buildin');

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
        },

        imageFilter: {
            enter: function (dom) {
                require('./imageFilter').init(dom, dom.getAttribute('data-filter'));
            },
            leave: function (dom) {
                require('./imageFilter').dispose(dom);
            }
        },

        showIframe: {
            enter: function (dom) {
                $(dom).find('iframe').attr('src', dom.getAttribute('data-src'));
            },
            leave: function (dom) {
                $(dom).find('iframe').attr('src', '');
            }
        },

        showGlobe: {
            enter: function (dom) {
                require('./showGlobe').init(dom);
            },
            leave: function () {
                require('./showGlobe').dispose();
            }  
        },

        showGlobePopulation: {
            enter: function (dom) {
                require('./showGlobePopulation').init(dom);
            },
            leave: function () {
                require('./showGlobePopulation').dispose();
            }  
        },

        showGlobeFlights: {
            enter: function (dom) {
                require('./showGlobeFlights').init(dom);
            },
            leave: function () {
                require('./showGlobeFlights').dispose();
            }  
        },

        showGlobeWave: {
            enter: function (dom) {
                require('./showGlobeWave').init(dom);
            },
            leave: function () {
                require('./showGlobeWave').dispose();
            }
        },
    };

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});