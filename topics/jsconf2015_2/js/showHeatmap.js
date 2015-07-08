define(function (require) {

    var heatmap = require('./heatmap');

    var loading = false;

    function init(dom) {
        if (loading) {
            return;
        }
        var img = new Image();
        var gradientImg = new Image();
        var count = 2;
        img.onload = gradientImg.onload = function () {
            count--;
            if (count === 0) {
                var ratio = img.width / img.height;
                img.height = dom.clientHeight;
                img.width = ratio * dom.clientHeight;
                loading = false;
                dom.appendChild(heatmap(img, gradientImg));
            }
        }

        img.src = 'data/cngdp2010-exp.png';
        gradientImg.src = 'img/gradient.png';

        loading = true;
    }

    function dispose(dom) {
        dom.innerHTML = '';
    }

    return {
        init: init,
        dispose: dispose
    };
});