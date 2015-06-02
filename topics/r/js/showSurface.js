define(function (require) {

    var grapher = require('grapher');

    function init(dom) {
        var surface = new grapher.Surface(dom, {
            axisLineWidth: 2,
            axisWireframeLineWidth: 1,
            axisWireframeLineColor: 'white',

            wireframeLineColor: 'black',
            wireframeLineWidth: 1,

            color: ['green', 'blue', 'red'],
            xAxis: {
                data: new grapher.generator.Sequence(-Math.PI, Math.PI, 0.1)
            },
            yAxis: {
                data: new grapher.generator.Sequence(-Math.PI, Math.PI, 0.1)
            },
            zAxis: {
                range: [-2, 2],
                data: function (x, y) {
                    return Math.sin(x * 2) * Math.sin(y * 2) * x / 2 * y / 2;
                }
            }
        });
    }

    function dispose() {

    }

    return {
        init: init,
        dispose: dispose
    };
});