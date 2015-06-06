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
            url: './data/winds.json',
            success: function (data) {
                if (! myChart) {
                    return;
                }

                var field = [];
                var p = 0;
                for (var j = 0; j < data.ny; j++) {
                    field[j] = [];
                    for (var i = 0; i < data.nx; i++, p++) {
                        data.data[p][0] /= data.max;
                        data.data[p][1] /= data.max;
                        field[j][i] = data.data[p];
                    }
                }
                myChart.setOption({
                    tooltip: {
                        formatter: '{b}'
                    },
                    series: [{
                        type: 'map3d',

                        baseLayer: {
                            backgroundColor: '',
                            backgroundImage: './asset/earth.jpg'
                        },

                        itemStyle: {
                            normal: {
                                label: {
                                    show: true
                                },
                                borderWidth: 1,
                                borderColor: 'yellow',
                                areaStyle: {
                                    color: 'rgba(0, 0, 0, 0)'
                                }
                            }
                        },
                        data: [{}]
                    }, {
                        name: 'winds',
                        type: 'map3d',

                        surfaceLayers: [{
                            type: 'particle',
                            distance: 3,
                            size: [4096, 2048],
                            particle: {
                                vectorField: field,
                                color: 'white',
                                speedScaling: 1,
                                sizeScaling: 1,
                                number: 512 * 512,
                                motionBlurFactor: 0.99
                            }
                        }]
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