define(function (require) {

    var echarts = require('echarts');
    var ecConfig = require('echarts/config');
    require('echarts/chart/map');
    require('echarts/chart/bar');

    require('echarts-x');
    require('echarts-x/chart/map3d');

    var myChart;
    var transformed = false;

    function init(dom) {
        if (myChart) {
            return;
        }
        myChart = echarts.init($('#layered-ecx')[0]);

        myChart.showLoading();

        $.ajax({
            url: 'data/gdp.json',
            success: function (data) {
                myChart.setOption({
                    // tooltip: {
                    //     trigger: 'axis'
                    // },
                    grid: {
                        borderWidth: 0,
                        x: '30%'
                    },
                    xAxis: {
                        type: 'category',
                        data: data.years.map(function (year) { return year + '年'; }),
                        axisLabel: {
                            textStyle: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        axisLine: {
                            lineStyle: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        splitArea: {
                            show: false
                        },
                        splitLine: {
                            show: false
                        }
                    },
                    yAxis: {
                        type: 'value',
                        axisLine: {
                            lineStyle: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        axisLabel: {
                            textStyle: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        splitArea: {
                            show: false
                        },
                        splitLine: {
                            show: false
                        },
                        position: 'right'
                    },
                    series: [{
                        name: 'Globe',
                        type: 'map3d',
                        mapType: 'world',

                        baseLayer: {
                            backgroundColor: '',
                            backgroundImage: 'asset/earth.jpg',
                            quality: 'high'
                        },

                        itemStyle: {
                            normal: {
                                label: {
                                    show: true
                                },
                                areaStyle: {
                                    color: 'rgba(0, 0, 0, 0)' 
                                }
                            }
                        },
                        data: [{}],
                        // mapLocation: {
                        //     width: '80%'
                        // },
                        roam: {
                            autoRotate: true,
                            autoRotateAfterStill: 0
                        }
                    }, {
                        name: 'gdp',
                        type: 'bar',
                        data: [1400532, 2898133, 11027922, 22000729, 32346738, 63508421, 70441599, 71918394],
                        itemStyle: {
                            normal: {
                                color: 'rgba(150, 0, 0, 0.7)'
                            }
                        }
                    }]
                });

                var currentName = null;
                myChart.on(ecConfig.EVENT.CLICK, function (param) {
                    if (data.data[param.name] && param.name !== currentName) {
                        currentName = param.name;
                        myChart.setOption({
                            title: {
                                text: currentName + ' GDP',
                                x: 'right',
                                textStyle: {
                                    color: 'rgba(255, 255, 255, 0.7)'
                                }
                            },
                            series: [{
                                name: 'Globe',
                                type: 'map3d',
                                roam: {
                                    autoRotate: false
                                }
                            }, {
                                name: 'gdp',
                                type: 'bar',
                                data: data.data[param.name]
                            }]
                        });
                    } 
                });

                myChart.hideLoading();

                if (transformed) {
                    transform();
                }
            }
        });
    };

    function dispose() {
        if (myChart) {
            myChart.dispose();
            myChart = null;
            transformed = false;
        }
    }

    function transform() {
        transformed = true;
        $('#layered-ecx canvas').addClass('ecx-layer-stack')
            .each(function (idx) {
                $(this).css('transform', 'translateY(' + -(idx * 100 - 100) + 'px) rotateY(7deg) rotateX(-70deg) scale(0.8)');
            });
    }

    return {
        init: init,
        dispose: dispose,
        transform: transform
    }
});