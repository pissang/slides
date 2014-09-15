define(function(require) {

    var worldcup;

    function exit() {
        if (!worldcup) {
            return;
        }
        var obj = {
            opacity: 1
        };
        worldcup.animation.animate(obj)
            .when(2000, {
                opacity: 0
            })
            .during(function() {
                worldcup.renderer.canvas.style.opacity = obj.opacity;
            })
            .done(function() {
                worldcup.dispose();
                worldcup = null;
            })
            .start('CubicIn');
    }

    function keyDown(e) {
        var kc = e.keyCode;
        if (
            kc == 27 // exit
            || kc == 13 // enter
            || kc == 32 // space
        ) {
            exit();
        }
    }

    function init() {
        if (worldcup) {
            return;
        }

        var obj = {
            opacity: 1
        };

        worldcup = require('worldcup-high');
        worldcup.onDone = exit;

        worldcup.renderer.canvas.addEventListener('keydown', keyDown);
    }

    function dispose() {
        exit();
    }

    return {
        init: init,
        dispose: dispose
    }
});