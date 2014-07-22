/**
 * slides.js
 * 
 * @author shenyi
 */
var slides = (function() {

	var articles = [];
	
	var	locked = false;
	var	currentSlide = 0;
	var prevSlide = 0;
	var	currentAppearIndex = -1;
	var	baseURL = "";

	var	appearQueue = [];

	var enterActions = {};
	var leaveActions = {};

	function g(id) {
		return document.getElementById(id);
	}

	var init = function(container, opt) {
		if (typeof(container) == 'string') {
			container = g(container );
		}
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
			var locations = urls[1].split('~'),
				page = parseInt(locations[0] || 0),
				appearIndex =  parseInt(locations[1] || -1);
			for (var i = 0; i < page; i++) {
				appearQueue[i].forEach(function(item) {
					item.classList.remove('hidden');
					item.classList.add('show');
				})
			}
			for (var i = 0; i <= appearIndex; i++) {
				appearQueue[page][i].classList.remove('hidden');
				appearQueue[page][i].classList.add('show');
			}
			jumpTo(page, appearIndex);
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
				lis[j].classList.add('hidden');
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
		
		jumpTo(currentSlide, currentAppearIndex+1);

		enter();
	}
	
	var prev = function() {
		leave(true);

		jumpTo(currentSlide, currentAppearIndex-1);

		enter();
	}
	
	var jumpTo = function(page, appearIndex) {

		if (appearIndex < -1) {
			page --;
			appearIndex = appearQueue[page].length-1;
		}
		if (appearIndex > appearQueue[page].length -1) {
			page++;
			appearIndex = -1;
		}
		currentAppearIndex = appearIndex;

		if (page > articles.length-1) {
			return;
		}		
		if (page < 0) {
			return;
		}
		for (var i =0; i < page; i++) {
			articles[i].classList.add('prev');
			articles[i].classList.remove('next');
			articles[i].classList.remove('current');
		}
		for (var i = page+1; i < articles.length; i++) {
			articles[i].classList.add('next');
			articles[i].classList.remove('prev');
			articles[i].classList.remove('current');
		}
		articles[page].classList.add('current');
		articles[page].classList.remove('prev');
		articles[page].classList.remove('next');
	
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
		
		document.location.href = baseURL + '#'+page+'~'+appearIndex;
	}
	
	function leave(back) {

		var item  = appearQueue[currentSlide][currentAppearIndex];
		if (! item) {
			return ;
		}
		if (back) {
			item.classList.remove('show');
			item.classList.add('hidden');
		}

		var functionName = item.getAttribute('data-action');
		if (functionName) {	
			if (leaveActions[functionName]) {
				leaveActions[functionName](item);
			}
		}

	}

	function enter() {
		
		var item  = appearQueue[currentSlide][currentAppearIndex];
		if (!item) {
			return ;
		}
		item.classList.remove('hidden');
		item.classList.add('show');

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