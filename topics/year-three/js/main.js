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
        },

        showGlobe: {
            enter: function (dom) {
                require('./showGlobe').init(dom);
            },
            leave: function () {
                require('./showGlobe').dispose();
            }
        },

        showGlobeWind: {
            enter: function (dom) {
                require('./showGlobeWind').init(dom, true);
            },
            leave: function () {
                require('./showGlobeWind').dispose();
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

        showContainBench: {
            enter: function (dom) {
                require('./showContainBench').init(dom);
            },
            leave: function () {
                require('./showContainBench').dispose();
            }
        },

        showGlobePopulation: {
            enter: function (dom) {
                require('./showGlobePopulation').init(dom);
            },
            leave: function () {
                require('./showGlobePopulation').dispose();
            }
        }
    };

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});