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
            url: './data/wave.json',
            success: function (data) {
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
                    series: [{
                        type: 'map3d',

                        baseLayer: {
                            backgroundColor: '#136dae',

                            heightImage: 'asset/elev_bump.jpg'
                        },

                        light: {
                            show: true,
                            // Use the system time
                            time: '',
                            sunIntensity: 0.6,
                            ambientIntensity: 0.4
                        },

                        itemStyle: {
                            normal: {
                                borderWidth: 1,
                                borderColor: '#d99524',
                                areaStyle: {
                                    color: '#d99524'
                                }
                            }
                        },
                        data: [{}]
                    }, {
                        name: 'wave',
                        type: 'map3d',

                        surfaceLayers: [{
                            type: 'particle',
                            distance: 0.8,
                            size: [4096, 2048],
                            particle: {
                                vectorField: field,
                                color: 'white',
                                speedScaling: 0.2,
                                sizeScaling: 0.3,
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