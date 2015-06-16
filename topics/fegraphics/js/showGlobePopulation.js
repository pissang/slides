define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/map');

    require('echarts-x');
    require('echarts-x/chart/map3d');

    var myChart;

    function init(dom) {
        if (myChart) {
            return;
        }
        myChart = echarts.init(dom);

        myChart.showLoading();

        $.ajax({
            url: './data/population.json',
            success: function (data) {
                if (! myChart) {
                    return;
                }

                var max = -Infinity;
                data = data.map(function (item) {
                    max = Math.max(item[2], max);
                    return {
                        geoCoord: item.slice(0, 2),
                        value: item[2]
                    }
                });
                data.forEach(function (item) {
                    item.barHeight = item.value / max * 50 + 0.1
                });

                myChart.setOption({
                    tooltip: {
                        formatter: '{b}'
                    },
                    dataRange: {
                        min: 0,
                        max: max,
                        realtime: false,
                        calculable : true,
                        x: 100,
                        y: 100,
                        textStyle: {
                            fontFamily: 'Helvetica Neue',
                            fontWeight: 100,
                            fontSize: 18,
                            color: 'rgba(255,255,255,0.9)'
                        },
                        color: ['red','yellow','lightskyblue']
                    },
                    series: [{
                        type: 'map3d',
                        mapType: 'world',
                        baseLayer: {
                            backgroundColor: 'rgba(0, 150, 200, 0.5)'
                        },
                        data: [{}],
                        itemStyle: {
                            normal: {
                                areaStyle: {
                                    color: 'rgba(0, 150, 200, 0.8)'
                                },
                                borderColor: '#777'
                            }
                        },
                        markBar: {
                            barSize: 0.6,
                            data: data
                        },
                        roam: {
                            autoRotate: false,
                            focus: 'China'
                        }
                    }]
                });

                myChart.hideLoading();

            }
        });
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
    }
});