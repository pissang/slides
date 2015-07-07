define(function (require) {
    
    var vec2 = require('zrender/tool/vector');

    var circularVector = function () {

        var vectors = [];
        var w = 20;
        var h = 20;

        for (var i = 0; i < h; i++) {
            vectors[i] = [];
            for (var j = 0; j < w; j++) {
                vectors[i][j] = [i - h / 2, -j + w / 2];
                vec2.normalize(vectors[i][j], vectors[i][j]);
            }
        }

        return vectors;
    }

    function drawVectors(dom, vectors, scale) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var width = dom.clientWidth;
        var height = dom.clientHeight;
        canvas.width = width;
        canvas.height = height;
        dom.appendChild(canvas);

        var scaleX = width / vectors[0].length;
        var scaleY = height / vectors.length;

        ctx.strokeStyle = 'white';
        ctx.beginPath();
        for (var i = 0; i < vectors.length; i++) {
            var row = vectors[i];
            for (var j = 0; j < row.length; j++) {
                var v = row[j];
                var x = scaleX * j;
                var y = scaleY * i;
                ctx.moveTo(x, y);
                ctx.lineTo(x + v[0] * scaleX * scale, y + v[1] * scaleY * scale);
            }
        }
        ctx.stroke();
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
                            vec2.normalize(data.data[p], data.data[p]);
                            field[j][i] = data.data[p];
                        }
                    }
                    drawVectors(dom, field, 1);
                }
            })
        }
        else {
            drawVectors(dom, circularVector(), 0.5)
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