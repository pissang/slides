define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/map');

    require('echarts-x');
    require('echarts-x/chart/map3d');

    var myChart;

    function init(dom, flat) {
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

                        flat: flat,

                        light: {
                            show: true,
                            // Use the system time
                            // time: '2013-08-07 18:09:09',
                            sunIntensity: 1
                        },

                        baseLayer: {
                            backgroundColor: '',
                            backgroundImage: './asset/earth.jpg'
                        },

                        roam: {
                            zoom: flat ? 3 : 1,
                            maxZoom: flat ? 4 : 2,
                            minZoom: flat ? 2: 0.4
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
                            distance: flat ? 10 : 3,
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