define(function (require) {

    var whiteNoise = require('./whiteNoise');

    return {
        init: function (dom) {
            var canvas = whiteNoise(dom.clientWidth, dom.clientHeight);
            dom.appendChild(canvas);
        },
        dispose: function (dom) {
            dom.innerHTML = '';
        }
    }
});