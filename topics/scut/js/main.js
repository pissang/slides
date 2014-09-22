define(function (require) {

    require('./particle').start();

    $(".lang-html").each(function() {
        // Encode html
        // http://stackoverflow.com/questions/1219860/javascript-jquery-html-encoding
        this.innerHTML = $("<div />").text(this.innerHTML).html();
    });

    prettyPrint();

    var actions = {
        showCubeAnim: {
            enter: function (dom) {
                require('./cubeAnim').init(dom);
            },
            leave: function (dom) {
                require('./cubeAnim').dispose();
            }
        },
        showWorldCup: {
            enter: function (dom) {
                require('./worldcup').init(dom);
            },
            leave: function (dom) {
                require('./worldcup').dispose();
            }
        },
        showSVG: {
            enter: function (dom) {
                require('./showSVG').init(dom);
            },
            leave: function (dom) {
                require('./showSVG').dispose();
            }
        },
        evaluateCss3: {
            interval: 0,
            enter: function (dom) {
                if (actions.evaluateCss3.interval) {
                    clearInterval(actions.evaluateCss3.interval);
                }
                // setInterval(function () {

                // }, 1000);
            },
            leave: function (dom) {
                if (actions.evaluateCss3.interval) {
                    clearInterval(actions.evaluateCss3.interval);
                    actions.evaluateCss3.interval = 0;
                }
            }
        }
    };

    slides.init('articles', {
        
        itemClass : 'item',

        actions : actions
    });

});