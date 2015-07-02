define(function (require) {

    require('qtek/shader/buildin');

    var codes = {};

    $('pre.prettyprint').each(function () {
        if (this.id) {
            codes[this.id] = this.innerHTML;
        }
    });
    prettyPrint();

    var actions = {
        showHistogram3d: {
            enter: function (dom) {
                require('./showHistogram3d').init(dom, {
                    light: dom.getAttribute('data-light')
                });
            },
            leave: function (dom) {
                require('./showHistogram3d').dispose(dom);  
            }
        }
    }

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});