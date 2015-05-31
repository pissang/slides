define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/wordCloud');

    var myChart;

    function createRandomItemStyle() {
        return {
            normal: {
                color: 'rgb(' + [
                    Math.round(Math.random() * 100 + 150),
                    Math.round(Math.random() * 100 + 150),
                    Math.round(Math.random() * 100 + 150)
                ].join(',') + ')'
            }
        };
    }

    function init(dom) {
        if (myChart) {
            return;
        }
        myChart = echarts.init(dom);

        myChart.setOption({
            series: [{
                name: '搜索关键词',
                type: 'wordCloud',
                size: [750, 400],
                textRotation : [0, 45, 90, -45],
                textPadding: 0,
                autoSize: {
                    enable: true,
                    minSize: 30
                },
                data: [
                    {
                        name: "视频教程",
                        value: 10000,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "基础教程",
                        value: 6181,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "formatter",
                        value: 4386,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "颜色",
                        value: 4055,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "动态数据",
                        value: 2467,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "java",
                        value: 2244,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "ajax",
                        value: 1898,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "添加",
                        value: 1484,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "下载",
                        value: 1112,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "实例",
                        value: 965,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "柱状图",
                        value: 847,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "宽度",
                        value: 582,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "echarts.init",
                        value: 555,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "demo",
                        value: 550,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "自适应",
                        value: 462,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "主题",
                        value: 366,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "事件",
                        value: 360,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "时间轴",
                        value: 282,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "官网",
                        value: 273,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "adddata",
                        value: 265,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "点击",
                        value: 265,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "免费",
                        value: 250,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: ".net",
                        value: 200,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "网格",
                        value: 200,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "grid",
                        value: 200,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "地图",
                        value: 200,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "echarts-x",
                        value: 200,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "收费",
                        value: 200,
                        itemStyle: createRandomItemStyle()
                    },
                    {
                        name: "resize",
                        value: 150,
                        itemStyle: createRandomItemStyle()
                    }
                ]
            }]
        })
    }

    function dispose() {
        if (myChart) {
            myChart.dispose();
            myChart = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    };
});