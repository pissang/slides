define(function (require) {
    
    var vec2 = require('zrender/tool/vector');

    var circularVector = function () {

        var vectors = [];
        var w = 20;
        var h = 20;

        for (var i = 0; i < h; i++) {
            vectors[i] = [];
            for (var j = 0; j < w; j++) {
                var x = j - w / 2;
                var y = i - h / 2;
                var scale = Math.max(1 - Math.sqrt(x * x + y * y) / w * 2, 0);

                vectors[i][j] = [i - h / 2, -j + w / 2];
                vec2.normalize(vectors[i][j], vectors[i][j]);
                // vec2.scale(vectors[i][j], vectors[i][j], scale);
            }
        }

        return vectors;
    }

    function init(dom, useWindField) {

        if (useWindField) {
            $.ajax({
                url: './data/winds.json',
                success: function (data) {
                    var field = [];
                    var p = 0;
                    for (var j = 0; j < data.ny; j++) {
                        field[j] = [];
                        for (var i = 0; i < data.nx; i++, p++) {
                            field[j][i] = data.data[p];
                        }
                    }
                    require('./drawVectors')(dom, field, 1);
                }
            })
        }
        else {
            require('./drawVectors')(dom, circularVector(), 0.5, true)
        }
    }

    function dispose(dom) {
        dom.innerHTML = '';
    }

    return {
        init: init,
        dispose: dispose
    };
});