define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/map');

    require('echarts-x');
    require('echarts-x/chart/map3d');

    var myChart;

    function init(dom, useWebGL) {
        if (myChart) {
            return;
        }

        myChart = echarts.init(dom);

        myChart.showLoading();

        $.ajax({
            url: 'data/weibo.json',
            success: function (data) {
                if (! myChart) {
                    return;
                }
                if (typeof (data) === 'string') {
                    data = JSON.parse(data);
                }
                var mpData = data.map(function (serieData, idx) {
                    var px = serieData[0] / 1000;
                    var py = serieData[1] / 1000;
                    var res = [{
                        geoCoord: [px, py]
                    }];

                    for (var i = 2; i < serieData.length; i += 2) {
                        var dx = serieData[i] / 1000;
                        var dy = serieData[i + 1] / 1000;
                        var x = px + dx;
                        var y = py + dy;
                        res.push({
                            geoCoord: [x, y]
                        });

                        px = x;
                        py = y;
                    }
                    return res;
                });

                myChart.setOption({
                    color: ['rgba(255, 255, 255, 0.8)', 'rgba(14, 241, 242, 0.8)', 'rgba(37, 140, 249, 0.8)'],
                    legend: {
                        orient: 'vertical',
                        x: 'left',
                        data: ['强', '中', '弱'],
                        textStyle: {
                            color: '#fff'
                        }
                    },
                    series: [{
                        name: '弱',
                        type: useWebGL ? 'map3d' : 'map',
                        mapType: 'china',
                        hoverable: false,
                        clickable: false,

                        baseLayer: {
                            backgroundColor: 'rgba(0, 0, 0, 0)'
                        },

                        roam: {
                            minZoom: 4.0,
                            zoom: 5.0,
                            maxZoom: 10.0
                        },

                        flat: true,

                        flatAngle: 0,

                        itemStyle: {
                            normal: {
                                label: {
                                    show: true,
                                    textStyle: {
                                        color: 'white',
                                        fontSize: 16
                                    }
                                },
                                borderColor: '#777',
                                areaStyle: {
                                    color: "#000011"
                                }
                            }
                        },

                        markPoint: {
                            symbolSize: 1,
                            large: true,
                            effect: {
                                show: false
                            },
                            data: mpData[0],
                            distance: 1
                        },
                        data:[]
                    }, {
                        name: '中',
                        type: useWebGL ? 'map3d' : 'map',
                        mapType: 'china',
                        markPoint: {
                            symbolSize: 1,
                            large: true,
                            effect: {
                                show: false
                            },
                            data: mpData[1],
                            distance: 1.2
                        },
                        data:[]
                    }, {
                        name: '强',
                        type: useWebGL ? 'map3d' : 'map',
                        mapType: 'china',
                        markPoint: {
                            symbolSize: 1,
                            large: true,
                            effect: {
                                show: false
                            },
                            data: mpData[2],
                            distance: 1.4
                        },
                        data:[]
                    }]
                });
                
                myChart.hideLoading();

            }
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