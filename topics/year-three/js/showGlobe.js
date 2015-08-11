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
        myChart = echarts.init($('#globe-container')[0]);

        var option = {
            series : [{
                type: 'map3d',
                mapType: 'world',

                background: 'asset/starfield.jpg',
                // Have a try to change an environment
                // background: 'asset/background.jpg',

                baseLayer: {
                    backgroundColor: '',
                    backgroundImage: 'asset/earth.jpg',
                    quality: 'high',

                    heightImage: 'asset/elev_bump.jpg'
                },

                flat: flat,

                light: {
                    show: ! flat,
                    // Use the system time
                    // time: '2013-08-07 18:09:09',
                    sunIntensity: 1
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
            }]
        };

        if (flat) {
            option.series[0].baseLayer.backgroundColor = 'rgba(0, 0, 0, 0)';
            option.series[0].background = '';
            option.series[0].baseLayer.backgroundImage = '';
            option.series[0].itemStyle.normal.areaStyle.color = 'rgba(0, 0, 122, 0.5)';

            option.series[0].surfaceLayers = [{
                type: 'texture',
                distance: -30,
                image: 'asset/earth.jpg'
            }]
            option.series[0].roam = {
                zoom: 4,
                maxZoom: 10,
                minZoom: 1
            }
        }

        myChart.setOption(option);
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