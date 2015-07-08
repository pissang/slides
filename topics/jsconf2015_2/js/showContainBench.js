define(function(require) {

    var echarts = require('echarts');
    require('echarts/chart/bar');

    var infographic = require('echarts/theme/infographic');

    var ec;

    function init(dom) {
        if (ec) {
            return;
        }
        ec = echarts.init(dom, infographic);

        ec.setOption({
            legend: {
                data: ['Native', 'JavaScript'],
                textStyle: {
                    color: 'white',
                    fontSize: 18
                }
            },
            xAxis : [{
                type : 'category',
                data : ['Circle', 'Line', 'Rectangle', 'Star', 'Sector', 'Cubic', 'Quadratic'],
                axisLabel: {
                    textStyle: {
                        color: 'white',
                        fontSize: 18
                    }
                }
            }],
            yAxis : [{
                type : 'value',
                axisLabel: {
                    textStyle: {
                        color: 'white',
                        fontSize: 18
                    },
                    formatter: function (value) {
                        return value / 1000000 + ' m/s';
                    }
                }
            }],
            series: [{
                name: 'Native',
                type: 'bar',
                data: [590953, 315486, 590600, 316108, 255713, 189047, 232705]
            }, {
                name: 'JavaScript',
                type: 'bar',
                data: [5089951, 9944631, 7204956, 4316449, 1885145, 3176849, 3969821]
            }]
        });
    }

    function dispose() {
        if (ec) {
            ec.clear();
            ec = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    }
});