define(function (require) {

    var curve = require('zrender/tool/curve');

    function lineIntersect(x0, y0, x1, y1, x, y) {
        if ((y > y0 && y > y1) || (y < y0 && y < y1)) {
            return 0;
        }
        if (y1 == y0) {
            return 0;
        }
        var t = (y - y0) / (y1 - y0);
        var x_ = t * (x1 - x0) + x0;

        return x_;
    }

    function init(dom) {
        var canvas = document.createElement('canvas');
        canvas.width = dom.clientWidth;
        canvas.height = dom.clientHeight;

        dom.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        var p = [10, 300, 200, -300, 400, 800, 400, 10];
        canvas.onmousemove = function(e) {
            var roots = [];
            var projection = [];
            var extrema = [];
            curve.cubicExtrema(p[1], p[3], p[5], p[7], extrema);
            curve.cubicRootAt(p[1], p[3], p[5], p[7], e.offsetY, roots);
            curve.cubicProjectPoint(
                p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7],
                e.offsetX, e.offsetY, projection
            );
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBezier();
            ctx.lineWidth = 1;
            ctx.moveTo(e.offsetX, e.offsetY);
            ctx.lineTo(1000, e.offsetY);
            ctx.stroke();
            for (var i = 0; i < roots.length; i++) {
                var x = curve.cubicAt(p[0], p[2], p[4], p[6], roots[i]);
                if (x > e.offsetX) {
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(x, e.offsetY, 5, 0, Math.PI * 2, true);
                    ctx.fill();

                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 4;
                    ctx.moveTo(x, e.offsetY);
                    var y2 = e.offsetY;
                    if (roots[i] < extrema[0]) {
                        y2 -= 40;
                    }
                    else if (roots[i] < extrema[1]) {
                        y2 += 40;
                    }
                    else {
                        y2 -= 40;
                    }
                    ctx.lineTo(x, y2);
                    ctx.stroke();
                }
            }

            ctx.moveTo(projection[0], projection[1]);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();

            var x = lineIntersect(p[6], p[7], p[0], p[1], e.offsetX, e.offsetY);
            if (x > e.offsetX) {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(x, e.offsetY, 5, 0, Math.PI * 2, true);
                ctx.fill();

                ctx.strokeStyle = 'red';
                ctx.lineWidth = 4;
                ctx.moveTo(x, e.offsetY);
                ctx.lineTo(x, e.offsetY + 40);
                ctx.stroke();
            }
        }

        function drawBezier() {
            ctx.beginPath();
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'white';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.moveTo(p[0], p[1]);
            ctx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
            ctx.stroke();
            ctx.fill();
        }

        drawBezier();
    }

    return {
        init: init,
        dispose: function (dom) {
            dom.innerHTML = '';
        }
    }
});