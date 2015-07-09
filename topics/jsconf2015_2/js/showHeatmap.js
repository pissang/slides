define(function (require) {

    var heatmap = require('./heatmap');

    var loading = false;

    function init(dom) {
        if (loading) {
            return;
        }
        loading = true;

        var gradientCanvas = document.createElement('canvas');
        gradientCanvas.width = 256;
        gradientCanvas.height = 1;
        var gradientCtx = gradientCanvas.getContext('2d');

        var canvas = document.createElement('canvas');
        dom.appendChild(canvas);

        var gradientPoints;

        function updateHeatmap() {
            if (loading || ! gradientPoints) {
                return;
            }

            var gradient = gradientCtx.createLinearGradient(0, 0, 256, 1);

            gradientPoints.forEach(function (point) {
                gradient.addColorStop(point.position, point.color);
            });

            gradientCtx.fillStyle = gradient;
            gradientCtx.fillRect(0, 0, 256, 1);

            heatmap(img, null, canvas, gradientCanvas)
        }

        updateHeatmap = _.throttle(updateHeatmap, 100);

        var img = new Image();
        img.onload = function () {
            loading = false;
            var ratio = img.width / img.height;
            img.height = dom.clientHeight;
            img.width = ratio * dom.clientHeight;
            loading = false;

            canvas.width = img.width;
            canvas.height = img.height;

            updateHeatmap();
        }
        img.src = 'data/cngdp2010-exp.png';


        var $gradientPicker = $('<div>');
        $(dom).append($gradientPicker);

        $gradientPicker.css({
            width: 300,
            height: 20,
            left: 50,
            bottom: 150,
            'z-index': 100
        }).gradientPicker({
            change: function(points, styles) {
                gradientPoints = points;
                updateHeatmap();
            },
            controlPoints: ['blue 15%', 'green 45%', 'yellow 85%', 'red 100%']
        })
        $gradientPicker.css({
            position: 'absolute'
        })
    }

    function dispose(dom) {
        dom.innerHTML = '';
    }

    return {
        init: init,
        dispose: dispose
    };
});