define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/gauge');
    require('qtek/shader/buildin');

    var actions = {
        showSurface: {
            enter: function (dom) {
                require('./showSurface').init(dom);
            },
            leave: function () {
                require('./showSurface').dispose();
            }
        },

        showParametricSurface: {
            enter: function (dom) {
                require('./showParametricSurface').init(dom);
            },
            leave: function () {
                require('./showParametricSurface').dispose();
            }
        },

        showLayeredEcx: {
            enter: function (dom) {
                require('./showLayeredEcx').init(dom);
            },
            leave: function () {
                require('./showLayeredEcx').dispose();
            }
        },

        transformLayeredEcx: {
            enter: function (dom) {
                require('./showLayeredEcx').transform(dom);
            }
        }
    };

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});