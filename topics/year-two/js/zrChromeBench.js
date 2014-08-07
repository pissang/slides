define(function(require) {

    var echarts = require('echarts');
    require('echarts/chart/bar');

    var ec;

    function init(dom) {
        if (ec) {
            return;
        }
        ec = echarts.init(dom);

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
                data: [1, 0.83, 0.92, 1.05, 1.24, 0.94]
            }, {
                name: '半静态',
                type: 'bar',
                data: [3.03, 4.77, 12.99, 3.67, 10.97, 6.19]
            }, {
                name: '动态',
                type: 'bar',
                data: [59.63, 31.71, 10.05, 15.22, 109.17, 64.07]
            }, {
                name: 'ZRender',
                type: 'bar',
                data: [31.21, 12.68, 21.23, 12.34, 19.19, 15.02]
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