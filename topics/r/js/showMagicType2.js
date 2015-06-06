define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/chord');
    require('echarts/chart/force');

    var infographic = require('echarts/theme/infographic');

    var myChart;

    function init(dom) {
        if (myChart) {
            return;
        }
        myChart = echarts.init(dom, infographic);

        myChart.setOption( {
            title: {
                text: '德国队效力联盟',
                x:'right',
                y:'bottom'
            },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    if (params.indicator2) {    // is edge
                        return params.indicator2 + ' ' + params.name + ' ' + params.indicator;
                    } else {    // is node
                        return params.name
                    }
                }
            },
            toolbox: {
                show: true,
                feature: {
                    restore: {show: true},
                    magicType: {show: true, type: ['force', 'chord']},
                    saveAsImage: {show: true}
                }
            },
            series: [
                {
                    name: '德国队效力联盟',
                    type:'chord',
                    sort: 'ascending',
                    sortSub: 'descending',
                    ribbonType: false,
                    radius: '60%',
                    itemStyle: {
                        normal: {
                            label: {
                                rotate: true,
                                color: 'white',
                                textStyle: {
                                    fontFamily: 'Helvetica Neue',
                                    fontWeight: 100,
                                    fontSize: 18
                                }
                            },
                            chordStyle: {
                                color: 'white'
                            }
                        }
                    },
                    minRadius: 7,
                    maxRadius: 20,
                    // 使用 nodes links 表达和弦图
                    nodes: [
                        {name:'默特萨克'},
                        {name:'厄齐尔'},
                        {name:'波多尔斯基'},
                        {name:'诺伊尔'},
                        {name:'博阿滕'},
                        {name:'施魏因施泰格'},
                        {name:'拉姆'},
                        {name:'克罗斯'},
                        {name:'穆勒', symbol: 'star'},
                        {name:'格策'},
                        {name:'胡梅尔斯'},
                        {name:'魏登费勒'},
                        {name:'杜尔姆'},
                        {name:'格罗斯克罗伊茨'},
                        {name:'阿森纳'},
                        {name:'拜仁慕尼黑'},
                        {name:'多特蒙德'}
                    ],
                    links: [
                        {source: '阿森纳', target: '默特萨克', weight: 1, name: '效力'},
                        {source: '阿森纳', target: '厄齐尔', weight: 1, name: '效力'},
                        {source: '阿森纳', target: '波多尔斯基', weight: 1, name: '效力'},
                        {source: '拜仁慕尼黑', target: '诺伊尔', weight: 1, name: '效力'},
                        {source: '拜仁慕尼黑', target: '博阿滕', weight: 1, name: '效力'},
                        {source: '拜仁慕尼黑', target: '施魏因施泰格', weight: 1, name: '效力'},
                        {source: '拜仁慕尼黑', target: '拉姆', weight: 1, name: '效力'},
                        {source: '拜仁慕尼黑', target: '克罗斯', weight: 1, name: '效力'},
                        {source: '拜仁慕尼黑', target: '穆勒', weight: 1, name: '效力'},
                        {source: '拜仁慕尼黑', target: '格策', weight: 1, name: '效力'},
                        {source: '多特蒙德', target: '胡梅尔斯', weight: 1, name: '效力'},
                        {source: '多特蒙德', target: '魏登费勒', weight: 1, name: '效力'},
                        {source: '多特蒙德', target: '杜尔姆', weight: 1, name: '效力'},
                        {source: '多特蒙德', target: '格罗斯克罗伊茨', weight: 1, name: '效力'}
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