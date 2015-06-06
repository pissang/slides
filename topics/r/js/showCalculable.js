define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/pie');

    var infographic = require('echarts/theme/infographic');

    var myChart;

    function init(dom) {
        if (myChart) {
            return;
        }
        myChart = echarts.init(dom, infographic);

        myChart.setOption({
            calculable : true,
            tooltip: {
                show: true,
                formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            series : [
                {
                    name:'浏览器占比',
                    type:'pie',
                    radius : ['30%', '70%'],
                    itemStyle: {
                        normal: {
                            label: {
                                textStyle: {
                                    fontFamily: 'Helvetica Neue',
                                    fontWeight: 100,
                                    fontSize: 24
                                }
                            }
                        }
                    },
                    data:[
                        {value:535, name:'Chrome'},
                        {value:310, name:'Firefox'},
                        {value:234, name:'Safari'},
                        {value:235, name:'IE9+'},
                        {value:1035, name:'IE8'},
                        {value:1305, name:'IE7'},
                        {value:948, name:'IE6-'}
                    ]
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