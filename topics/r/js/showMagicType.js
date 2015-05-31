define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/bar');
    require('echarts/chart/line');

    var infographic = require('echarts/theme/infographic');

    var myChart;

    function init(dom) {
        if (myChart) {
            return;
        }
        myChart = echarts.init(dom, infographic);

        myChart.setOption({
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data:['意向','预购','成交'],
                textStyle: {
                    fontFamily: 'Helvetica Neue',
                    fontWeight: 100,
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.9)'
                }
            },
            toolbox: {
                show : true,
                feature : {
                    magicType: {show: true, type : ['line', 'bar', 'stack', 'tiled']}
                }
            },
            calculable : true,
            xAxis : [
                {
                    type : 'category',
                    boundaryGap : true,
                    data : ['周一','周二','周三','周四','周五','周六','周日'],
                    axisLabel: {
                        textStyle: {
                            fontFamily: 'Helvetica Neue',
                            fontWeight: 100,
                            fontSize: 18,
                            color: 'rgba(255,255,255,0.9)'
                        }
                    }
                }
            ],
            yAxis : [
                {
                    type : 'value',
                    axisLabel: {
                        textStyle: {
                            fontFamily: 'Helvetica Neue',
                            fontWeight: 100,
                            fontSize: 20,
                            color: 'rgba(255,255,255,0.9)'
                        }
                    }
                }
            ],
            series : [
                {
                    name:'意向',
                    type:'bar',
                    smooth:true,
                    itemStyle: {normal: {areaStyle: {type: 'default'}}},
                    data:[1320, 1132, 601, 234, 120, 90, 20]
                },
                {
                    name:'预购',
                    type:'bar',
                    smooth:true,
                    itemStyle: {normal: {areaStyle: {type: 'default'}}},
                    data:[30, 182, 434, 791, 390, 30, 10]
                },
                {
                    name:'成交',
                    type:'bar',
                    smooth:true,
                    itemStyle: {normal: {areaStyle: {type: 'default'}}},
                    data:[10, 12, 21, 54, 260, 830, 710]
                }
            ]
        });
    };

    function dispose() {
        if (myChart) {
            myChart.dispose();
            myChart = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    }
});