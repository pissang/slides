define(function(require) {

    var echarts = require('echarts');
    require('echarts/chart/bar');

    var infographic = require('../../../js/lib/theme/infographic');

    var ec;

    function init(dom) {
        if (ec) {
            return;
        }
        ec = echarts.init(dom, infographic);

        ec.setOption({
            legend: {
                data: ['静态', '半静态', '动态', 'ZRender'],
                textStyle: {
                    color: 'white'
                }
            },
            calculable : true,
            xAxis : [{
                type : 'category',
                data : ['Text', 'Rectangle', 'Image', 'Line', 'Star', 'Circle'],
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
                    formatter: '{value} ms'
                }
            }],
            series: [{
                name: '静态',
                type: 'bar',
                data: [1.09, 1.03, 1.38, 8.12, 2.21, 4.23]
            }, {
                name: '半静态',
                type: 'bar',
                data: [4.87, 4.80, 14.39, 4.87, 10.76, 5.89]
            }, {
                name: '动态',
                type: 'bar',
                data: [126.95, 30.92, 14.33, 14.62, 110.66, 52.77]
            }, {
                name: 'ZRender',
                type: 'bar',
                data: [70.47, 20.48, 33.88, 40.56, 43.76, 36.99]
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