define(function (require) {

    function drawVectors(dom, vectors, scale, drawGrid) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var width = dom.clientWidth;
        var height = dom.clientHeight;
        canvas.width = width;
        canvas.height = height;
        dom.appendChild(canvas);

        var scaleX = width / vectors[0].length;
        var scaleY = height / vectors.length;

        // Draw grid
        if (drawGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            for (var i = 0; i < vectors.length; i++) {
                var y = Math.round(i * scaleY) + 0.5;
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            for (var i = 0; i < vectors[0].length; i++) {
                var x = Math.round(i * scaleX) + 0.5;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            ctx.stroke();
        }

        ctx.strokeStyle = 'white';
        ctx.beginPath();

        scale /= 2;
        for (var i = 0; i < vectors.length; i++) {
            var row = vectors[i];
            for (var j = 0; j < row.length; j++) {
                var v = row[j];
                var x = scaleX * (j + 0.5);
                var y = scaleY * (i + 0.5);
                var x0 = x - v[0] * scaleX * scale;
                var y0 = y - v[1] * scaleX * scale;
                var x1 = x + v[0] * scaleX * scale;
                var y1 = y + v[1] * scaleY * scale;
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);

                if (drawGrid) {
                    ctx.lineTo(x1 - v[0] * 5 + v[1] * 2.5, y1 - v[1] * 5 - v[0] * 2.5);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1 - v[0] * 5 - v[1] * 2.5, y1 - v[1] * 5 + v[0] * 2.5);
                }
            }
        }

        ctx.stroke();

        return canvas;
    }

    return drawVectors;
});