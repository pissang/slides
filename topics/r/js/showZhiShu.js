define(function (require) {
var data = [
    ['2014-05-11', 0],
    ['2014-05-18', 213],
    ['2014-05-25', 389],
    ['2014-06-01', 416],
    ['2014-06-08', 470],
    ['2014-06-15', 448],
    ['2014-06-22', 462],
    ['2014-06-29', 683],
    ['2014-07-06', 640],
    ['2014-07-13', 657],
    ['2014-07-20', 702],
    ['2014-07-27', 727],
    ['2014-08-03', 689],
    ['2014-08-10', 732],
    ['2014-08-17', 743],
    ['2014-08-24', 753],
    ['2014-08-31', 729],
    ['2014-09-07', 646],
    ['2014-09-14', 766],
    ['2014-09-21', 776],
    ['2014-09-28', 446],
    ['2014-10-05', 617],
    ['2014-10-12', 782],
    ['2014-10-19', 786],
    ['2014-10-26', 776],
    ['2014-11-02', 800],
    ['2014-11-09', 806],
    ['2014-11-16', 833],
    ['2014-11-23', 853],
    ['2014-11-30', 841],
    ['2014-12-07', 857],
    ['2014-12-14', 870],
    ['2014-12-21', 863],
    ['2014-12-28', 650],

    ['2015-01-04', 977],
    ['2015-01-11', 915],
    ['2015-01-18', 911],
    ['2015-01-25', 929],
    ['2015-02-01', 954],
    ['2015-02-08', 857],
    ['2015-02-15', 312],
    ['2015-02-22', 589],
    ['2015-03-01', 992],
    ['2015-03-08', 1077],
    ['2015-03-15', 1140],
    ['2015-03-22', 1232],
    ['2015-03-29', 1142],
    ['2015-04-05', 1094],
    ['2015-04-12', 1267],
    ['2015-04-17', 1287],
    ['2015-04-24', 1040],
    ['2015-05-03', 1262],
    ['2015-05-10', 1352],
    ['2015-05-17', 1316],
    ['2015-05-24', 1399],
    ['2015-05-31', 1277]
];

    
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
                axisPointer:{type:'line'},
                showDelay: 0
            },
            grid:{x:100,x2:20,y:40,y2:80},
            xAxis : [{
                type : 'category',
                boundaryGap : false,
                axisLabel: {
                    formatter:function(v) {
                        return v.substr(5) + '\n' + v.substr(0, 4);
                    },
                    textStyle: {
                        fontFamily: 'Helvetica Neue',
                        fontWeight: 100,
                        fontSize: 18,
                        color: 'rgba(255,255,255,0.9)'
                    }
                },
                data : data.map(function (a) {return a[0]})
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
                data : data.map(function (a) {return a[1]})
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