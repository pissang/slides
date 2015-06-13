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
        }
    };

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});