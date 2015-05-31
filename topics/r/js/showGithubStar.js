define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/line');

    var infographic = require('echarts/theme/infographic');

    var myChart;

    function init(dom) {
        if (myChart) {
            return;
        }
        myChart = echarts.init(dom, infographic);

        myChart.setOption({
            tooltip : {
                trigger: 'axis',
                axisPointer:{type:'none'},
                showDelay: 0
            },
            grid:{x:100,x2:20,y:40,y2:80},
            xAxis : [{
                type : 'category',
                boundaryGap : false,
                axisLabel: {
                    interval:0,
                    formatter:function(v){
                        switch(v) {
                            case '2013年6月':
                                return '6\n\n2013';
                            case '2014年1月':
                                return '1\n\n2014';
                            case '2015年1月':
                                return '1\n\n2015';
                            default:
                                return v.substr(5).replace('月','');
                        }
                    },
                    textStyle: {
                        fontFamily: 'Helvetica Neue',
                        fontWeight: 100,
                        fontSize: 18,
                        color: 'rgba(255,255,255,0.9)'
                    }
                },
                data : [
                    '2013年6月','2013年7月','2013年8月','2013年9月','2013年10月',
                    '2013年11月','2013年12月','2014年1月','2014年2月','2014年3月',
                    '2014年4月','2014年5月','2014年6月','2014年7月','2014年8月',
                    '2014年9月','2014年10月','2014年11月','2014年12月','2015年1月',
                    '2015年3月', '2015年4月', '2015年5月'
                ]
            }],
            yAxis : [{
                type: 'value',
                splitNumber: 7,
                min: 0,
                axisLabel: {
                    textStyle: {
                        fontFamily: 'Helvetica Neue',
                        fontWeight: 100,
                        fontSize: 20,
                        color: 'rgba(255,255,255,0.9)'
                    }
                }
            }],
            series : [{
                name:'echarts',
                type:'line',
                smooth: true,
                itemStyle: {
                    normal: {
                        label: {
                            textStyle: {
                                fontFamily: 'Helvetica Neue',
                                fontWeight: 100,
                                fontSize: 18
                            }
                        }
                    }
                },
                data:[
                    {value:0,itemStyle:{normal:{label:{show:true,formatter:'1.0.0'}}}},
                    {value:90,itemStyle:{normal:{label:{show:true,formatter:'1.1.0'}}}},
                    {value:316,itemStyle:{normal:{label:{show:true,formatter:'1.1.1'}}}},
                    {value:480,itemStyle:{normal:{label:{show:true,formatter:'1.2.0'}}}},
                    {value:620,itemStyle:{normal:{label:{show:true,formatter:'1.2.1'}}}},
                    {value:743,itemStyle:{normal:{label:{show:true,formatter:'1.3.0'}}}},
                    {value:904,itemStyle:{normal:{label:{show:true,formatter:'1.3.5'}}}},
                    {value:1090,itemStyle:{normal:{label:{show:true,formatter:'1.3.6'}}}},
                    {value:1262,itemStyle:{normal:{label:{show:true,formatter:'1.3.7'}}}},
                    {value:1368,itemStyle:{normal:{label:{show:true,formatter:'1.3.8'}}}},
                    {value:1610,itemStyle:{normal:{label:{show:true,formatter:'1.4.0'}}}},
                    {value:1767,itemStyle:{normal:{label:{show:true,formatter:'1.4.1'}}}},
                    {value:1928,itemStyle:{normal:{label:{show:true,formatter:'2.0.0'}}}},
                    {value:2390,itemStyle:{normal:{label:{show:true,formatter:'2.0.1'}}}},
                    {value:2610,itemStyle:{normal:{label:{show:true,formatter:'2.0.2'}}}},
                    {value:2740,itemStyle:{normal:{label:{show:true,formatter:'2.0.3'}}}},
                    {value:2930,itemStyle:{normal:{label:{show:true,formatter:'2.0.4'}}}},
                    {value:3210,itemStyle:{normal:{label:{show:true,formatter:'2.1.8'}}}},
                    {value:3610,itemStyle:{normal:{label:{show:true,formatter:'2.1.9'}}}},
                    {value:5600,itemStyle:{normal:{label:{show:true,formatter:'2.2.0'}}}},
                    {value:6200,itemStyle:{normal:{label:{show:true,formatter:'2.2.1'}}}},
                    {value:6600,itemStyle:{normal:{label:{show:true,formatter:'2.2.2'}}}},
                    {value:6949,itemStyle:{normal:{label:{show:true,formatter:'2.2.3'}}}}
                ]
            }]
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