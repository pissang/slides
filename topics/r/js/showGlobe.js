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

        myChart.setOption({
            series : [{
                type: 'map3d',
                mapType: 'world',

                background: 'asset/starfield.jpg',
                // Have a try to change an environment
                // background: 'asset/background.jpg',

                baseLayer: {
                    backgroundColor: '',
                    backgroundImage: 'asset/earth.jpg',
                    quality: 'medium',

                    heightImage: 'asset/elev_bump.jpg'
                },

                light: {
                    show: true,
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