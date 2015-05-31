define(function (require) {

    var grapher = require('grapher');

    function init(dom) {
        var cos = Math.cos;
        var sin = Math.sin;
        var pow = Math.pow;
        var round = Math.round;
        var Sequence = grapher.generator.Sequence;
        var surface = new grapher.Surface(dom, {
            axisLineWidth: 5,
            axisWireframeLineColor: 'white',
            color: function (x, y, z) {
                return 'rgb(' + round(x * 255) + ',' + round(y * 255) + ',' + round(z * 255) + ')';
            },
            parametric: true,
            parameters: {
                u: new Sequence(0, Math.PI * 2, Math.PI / 30),
                v: new Sequence(-15, 6, 0.21)
            },
            xAxis: {
                data: function (u, v) {
                    return pow(1.16, v) * cos(v) * (1 + cos(u));
                }
            },
            yAxis: {
                data: function (u, v) {
                    return -pow(1.16, v) * sin(v) * (1 + cos(u));
                }
            },
            zAxis: {
                data: function (u, v) {
                    return -2 * pow(1.16, v) * (1 + sin(u));
                }
            },
            autoRotate: true
        });
    }

    function dispose() {

    }

    return {
        init: init,
        dispose: dispose
    };
});