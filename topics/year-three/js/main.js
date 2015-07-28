define(function (require) {

    var echarts = require('echarts');
    require('echarts/chart/gauge');
    require('qtek/shader/buildin');

    var actions = {};

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});