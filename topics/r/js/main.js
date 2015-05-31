define(function (require) {

    var actions = {
        showGithubStar: {
            enter: function (dom) {
                require('./showGithubStar').init(dom);
            },
            leave: function (dom) {
                require('./showGithubStar').dispose();
            }
        },

        showKeywordCloud: {
            enter: function (dom) {
                require('./showKeywordCloud').init(dom);
            },
            leave: function (dom) {
                require('./showKeywordCloud').dispose();
            }
        },

        showCalculable: {
            enter: function (dom) {
                require('./showCalculable').init(dom);
            },
            leave: function (dom) {
                require('./showCalculable').dispose();
            }
        },

        showMagicType: {
            enter: function (dom) {
                require('./showMagicType').init(dom);
            },
            leave: function (dom) {
                require('./showMagicType').dispose();
            }
        },

        showDataRange: {
            enter: function (dom) {
                require('./showDataRange').init(dom);
            },
            leave: function (dom) {
                require('./showDataRange').dispose();
            }
        },

        showMigration: {
            enter: function (dom) {
                require('./showMigration').init(dom);
            }
        },

        disposeMigration: {
            leave: function () {
                require('./showMigration').dispose();
            }
        },

        toggleEdgeBundling: {
            enter: function () {
                require('./showMigration').toggleEdgeBundling(true);
            },
            leave: function () {
                require('./showMigration').toggleEdgeBundling(false);
            }
        },

        showWeiboCheckin: {
            enter: function (dom) {
                require('./showWeiboCheckin').init(dom);
            },
            leave: function () {
                require('./showWeiboCheckin').dispose();
            }  
        },

        showTimeline: {
            enter: function (dom) {
                require('./showTimeline').init(dom);
            },
            leave: function () {
                require('./showTimeline').dispose();
            }
        },

        showSoccerTimeline: {
            enter: function (dom) {
                require('./showSoccerTimeline').init(dom);
            },
            leave: function () {
                require('./showSoccerTimeline').dispose();
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
        }

    };

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});