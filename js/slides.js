/**
 * slides.js
 * 
 * @author shenyi
 */
var slides = (function() {

    var articles = [];
    
    var locked = false;
    var currentSlide = 0;
    var prevSlide = 0;
    var currentAppearIndex = -1;
    var baseURL = "";

    var appearQueue = [];

    var enterActions = {};
    var leaveActions = {};

    function g(id) {
        return document.getElementById(id);
    }

    var $progressContainer = document.createElement('div');
    $progressContainer.id = 'slides-progress';
    var $progress = document.createElement('div');
    $progress.id = 'slides-progress-inner';
    $progressContainer.appendChild($progress);
    document.body.appendChild($progressContainer);

    var init = function(container, opt) {
        if (typeof(container) == 'string') {
            container = g(container );
        }
        container.style.display = 'block';

        opt = opt || {};

        if (opt.actions) {
            for (var name in opt.actions) {
                if (opt.actions[name].enter) {
                    enterActions[name] = opt.actions[name].enter;
                }
                if (opt.actions[name].leave) {
                    leaveActions[name] = opt.actions[name].leave;
                }   
            }
        }

        articles = container.querySelectorAll('article');

        appearSerial(opt.itemClass);

        var urls = document.location.href.split('#')
        baseURL = urls[0];

        //跳到指定位置
        if (urls[1]) {
            var locations = urls[1].split('~');
            
            var page = parseInt(locations[0] || 0);
            page = Math.min(page, appearQueue.length - 1);
            var appearIndex =  parseInt(locations[1] || -1);
            appearIndex = Math.min(appearIndex, appearQueue[page].length - 1);

            for (var i = 0; i < page; i++) {
                appearQueue[i].forEach(function(item) {
                    item.classList.remove('next');
                    item.classList.add('prev');
                });
            }
            for (var i = 0; i <= appearIndex; i++) {
                appearQueue[page][i].classList.remove('next');
                if (i === appearIndex) {
                    appearQueue[page][i].classList.add('current');
                } else {
                    appearQueue[page][i].classList.add('prev');
                }
            }
            jumpTo(page, appearIndex);

            var item = appearQueue[page][appearIndex];
            if (item) {
                var functionName = item.getAttribute('data-action');
                if (functionName) { 
                    if (enterActions[functionName]) {
                        enterActions[functionName](item);
                    }
                }
            }
        }else{
            jumpTo(0, -1);
        }

        initKeyEvent();
    };

    function appearSerial(itemClass) {
        for (var k = 0; k < articles.length; k++) {
            appearQueue[k] = [];
            var selector = itemClass ? '.'+itemClass : 'ul>li'
            var lis = articles[k].querySelectorAll(selector);

            for (var j = 0; j < lis.length; j++) {
                lis[j].classList.add('next');
                appearQueue[k].push(lis[j]);
            }
        }
    }
    
    function initKeyEvent() {

        document.addEventListener('keydown', function(e) {
            if (locked) {
                return false;
            }
            switch(e.keyCode) {
                case 39: // right arrow
                case 13: // Enter
                case 32: // space
                case 34: // PgDn
                  next();
                  e.preventDefault();
                  break;
                  
                case 37: // left arrow
                case 8: // Backspace
                case 33: // PgUp
                  prev();
                  e.preventDefault();
                  break;
        
                default:
            }
        })
    }
    
    var lock = function(time) {
        locked = true;
        setTimeout(unlock, time)
    }
    var unlock = function() {
        locked = false;
    }
    
    var next = function() {
        leave();
        
        jumpTo(currentSlide, currentAppearIndex + 1);

        enter();
    }
    
    var prev = function() {
        leave(true);

        jumpTo(currentSlide, currentAppearIndex - 1);

        enter(true);
    }
    
    var jumpTo = function(page, appearIndex) {

        if (page < 0 || page > articles.length - 1) {
            return;
        }

        if (appearIndex < -1) {
            page --;
            if (page < 0 || page > articles.length - 1) {
                return;
            }
            appearIndex = appearQueue[page].length - 1;
        }
        if (appearIndex > appearQueue[page].length -1) {
            page++;
            if (page < 0 || page > articles.length - 1) {
                return;
            }
            appearIndex = -1;
        }
        currentAppearIndex = appearIndex;

        for (var i =0; i < page; i++) {
            articles[i].classList.add('prev');
            articles[i].classList.remove('next');
            articles[i].classList.remove('current');
        }
        for (var i = page + 1; i < articles.length; i++) {
            articles[i].classList.add('next');
            articles[i].classList.remove('prev');
            articles[i].classList.remove('current');
        }
        articles[page].classList.add('current');
        articles[page].classList.remove('prev');
        articles[page].classList.remove('next');

        // Lazy loading images
        var images = articles[page].getElementsByTagName('img');
        for (var i = 0; i < images.length; i++) {
            if (!images[i].getAttribute('src')) {
                var src = images[i].getAttribute('data-src');
                if (src) {
                    images[i].src = src;
                }
            }
        }

        if (currentSlide !== page) {
            prevSlide = currentSlide;
            currentSlide = page;

            var article = articles[currentSlide];
            var functionName = article.getAttribute('data-action');
            if (functionName) { 
                if (enterActions[functionName]) {
                    enterActions[functionName](article);
                }
            }
            var article = articles[prevSlide];
            var functionName = article.getAttribute('data-action');
            if (functionName) { 
                if (leaveActions[functionName]) {
                    leaveActions[functionName](article);
                }
            }
        }   
        
        document.location.href = baseURL + '#' + page + '~' + appearIndex;
        $progress.style.width = Math.round((page + 1) / articles.length * 100) + '%';
    }
    
    function leave(back) {

        var item  = appearQueue[currentSlide][currentAppearIndex];
        if (!item) {
            return ;
        }
        item.classList.remove('current');
        if (back) {
            item.classList.add('next');
        } else {
            item.classList.add('prev');
        }

        var functionName = item.getAttribute('data-action');
        if (functionName) { 
            if (leaveActions[functionName]) {
                leaveActions[functionName](item);
            }
        }
    }

    function enter(back) {
        
        var item  = appearQueue[currentSlide][currentAppearIndex];
        if (!item) {
            return ;
        }
        item.classList.remove('prev');
        item.classList.remove('next');
        item.classList.add('current');

        var functionName = item.getAttribute('data-action');
        if (functionName) {
            if (enterActions[functionName]) {
                enterActions[functionName](item);
            }
        }

    }

    return {
        init : init
    }
})()