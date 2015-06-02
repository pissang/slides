define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/gauge');

    var actions = {
        showGithubStar: {
            enter: function (dom) {
                require('./showGithubStar').init(dom);
            },
            leave: function (dom) {
                require('./showGithubStar').dispose();
            }
        },

        showZhiShu: {
            enter: function (dom) {
                require('./showZhiShu').init(dom);
            },
            leave: function (dom) {
                require('./showZhiShu').dispose();
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

        showEvolution: {
            enter: function (dom) {
                require('./showEvolution').init(dom);
            },
            leave: function (dom) {
                require('./showEvolution').dispose();
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
            }
        },

        disposeWeiboCheckin: {
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

    var myChart = echarts.init(document.getElementById('timer'));

    myChart.setOption({
        series: [{
            name:'Timer',
            type:'gauge',
            startAngle: 180,
            endAngle: 0,
            radius: [0, '160%'],
            center: ['50%', '80%'],
            splitNumber: 5,
            axisLine: {
                lineStyle: {
                    color: [[0.5, '#dd0000'],[0.8, '#dddd00'],[1, '#00dd00']], 
                    width: 2
                }
            },
            axisTick: {
                splitNumber: 5,
                length :5,
                lineStyle: {
                    color: 'auto',
                    width: 1
                }
            },
            axisLabel: {
                show: false
            },
            splitLine: {
                show: true,
                length: 5,
                lineStyle: {
                    color: 'auto'
                }
            },
            pointer : {
                width : 3
            },
            title : {
                show : false
            },
            detail : {
                formatter:'',
                textStyle: {
                    color: 'auto',
                    fontWeight: 'bolder'
                }
            },
            data:[{value: 0, name: 'current'}]
        }]
    });
    
    var timeAll = 30 * 60 * 1000;
    var elapsedTime = 0;
    var timeInterval = 1000 * 30;
    setInterval(function () {
        elapsedTime += timeInterval;
        myChart.setOption({
            series: [{
                name: 'Timer',
                data: [{
                    name: 'current',
                    value: elapsedTime / timeAll * 100
                }]
            }]
        })
    }, timeInterval);
});