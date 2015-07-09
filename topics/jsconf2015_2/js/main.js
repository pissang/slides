define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/gauge');

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
        },

        showGlobe: {
            enter: function (dom) {
                require('./showGlobe').init(dom, dom.getAttribute('data-flat'));
            },
            leave: function (dom) {
                require('./showGlobe').dispose(dom);
            }
        },

        showContainBench: {
            enter: function (dom) {
                require('./showContainBench').init(dom);
            },
            leave: function (dom) {
                require('./showContainBench').dispose(dom);
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