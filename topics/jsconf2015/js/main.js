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
        },

        showVectorArrows: {
            enter: function (dom) {
                require('./showVectorArrows').init(dom, dom.getAttribute('data-wind-field'));
            },
            leave: function (dom) {
                require('./showVectorArrows').dispose(dom);
            }
        },

        showWhiteNoise: {
            enter: function (dom) {
                require('./showWhiteNoise').init(dom);
            },
            leave: function (dom) {
                require('./showWhiteNoise').dispose(dom);
            }
        },

        lic: {
            enter: function (dom) {
                require('./lic').init(dom, dom.getAttribute('data-wind-field'), dom.getAttribute('data-scalar-field'));
            },
            leave: function (dom) {
                require('./lic').dispose(dom);
            }
        },

        showHeatmap: {
            enter: function (dom) {
                require('./showHeatmap').init(dom);
            },
            leave: function (dom) {
                require('./showHeatmap').dispose(dom);
            }
        },

        showGlobePopulation: {
            enter: function (dom) {
                require('./showGlobePopulation').init(dom);
            },
            leave: function (dom) {
                require('./showGlobePopulation').dispose(dom);
            }
        },

        showWeiboCheckin: {
            enter: function (dom) {
                require('./showWeiboCheckin').init(dom, dom.getAttribute('data-webgl'));
            },
            leave: function (dom) {
                require('./showWeiboCheckin').dispose(dom);
            }
        },

        showSingleParticle: {
            enter: function (dom) {
                require('./showSingleParticle').init(dom);
            },
            leave: function (dom) {
                require('./showSingleParticle').dispose(dom);
            }
        },

        showGlobeWind: {
            enter: function (dom) {
                require('./showGlobeWind').init(dom, dom.getAttribute('data-flat'));
            },
            leave: function (dom) {
                require('./showGlobeWind').dispose(dom);
            }
        },

        showMigration: {
            enter: function (dom) {
                require('./showMigration').init(dom);
            },
            leave: function (dom) {
                require('./showMigration').dispose(dom);
            }
        },

        showGlobeFlights: {
            enter: function (dom) {
                require('./showGlobeFlights').init(dom);
            },
            leave: function (dom) {
                require('./showGlobeFlights').dispose(dom);
            }
        }
    };

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});