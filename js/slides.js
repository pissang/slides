/**
 * slides.js
 * 
 * @author shenyi
 */
var slides = (function(){
	var articles = [],
		container = null,
	
		locked = false,
		currentSlide = 0,
		currentAppearIndex = -1;
		animateInterval = 500,//ms
		baseURL = "",

		appearQueue = [];
	
	function g(id){
		return document.getElementById(id);
	}

	function addClass(elem, className){
		var classes = trimArray(elem.className.split(' '));
		if(classes.indexOf(className) >= 0){
			return;
		}
		classes.push(className);
		elem.className = classes.join(' ');
	}

	function removeClass(elem, className){
		var classes = trimArray(elem.className.split(' '));
		if(classes.indexOf(className) < 0){
			return;
		}
		classes.splice(classes.indexOf(className), 1)
		elem.className =classes.join(' ');
	}

	function hasClass(elem, className){
		var classes = trimArray(elem.className.split(' '));
		return classes.indexOf(className) >=0
	}
	function trimArray(strArr){
		for(var i = 0; i < strArr.length; i++){
			strArr[i] = strArr[i].replace(/(^\s*)|(\s*$)/g, "");
		}
		return strArr;
	}
	function each(array, callback){
		if( ! array){
			return;
		}
		for(var i = 0; i < array.length; i++){
			callback(array[i], i);
		}
	}

	var init = function(container){
		
		if( typeof(container) == 'string'){
			container = g( container );
		}
		articles = container.querySelectorAll('article');

		appearSerial();

		var urls = document.location.href.split('#')
		baseURL = urls[0];

		//跳到指定位置
		if(urls[1]){
			var locations = urls[1].split('~'),
				page = parseInt(locations[0] || 0),
				appearIndex =  parseInt(locations[1] || -1);
			for(var i = 0; i < page; i++){
				each(appearQueue[i], function(item){
					removeClass(item, 'hidden');
					addClass(item, 'show');
				})
			}
			for(var i = 0; i <= appearIndex; i++){
				removeClass(appearQueue[page][i], 'hidden');
				addClass(appearQueue[page][i], 'show');
			}

			jumpTo(page, appearIndex);
		}else{
			jumpTo(0, -1);
		}

		initKeyEvent();
	};

	function appearSerial(){

		for(var k = 0; k < articles.length; k++){
			appearQueue[k] = [];
			var lis = articles[k].querySelectorAll('ul>li');

			for(var j = 0; j < lis.length; j++){

				addClass(lis[j], 'hidden');
				appearQueue[k].push(lis[j]);
			}
		}
	}
	
	function initKeyEvent(){

		document.addEventListener('keydown', function(e){
			if(locked){
				return false;
			}
			switch(e.keyCode){
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
	
	var lock = function(time){
		locked = true;
		setTimeout(unlock, time)
	}
	var unlock = function(){
		locked = false;
	}
	
	var next = function(){
		leaveAction();
		
		jumpTo(currentSlide, currentAppearIndex+1);

		enterAction();
	}
	
	var prev = function(){
		leaveAction(true);

		jumpTo(currentSlide, currentAppearIndex-1);
	}
	
	var jumpTo = function(page, appearIndex){

		if(appearIndex < -1){
			page --;
			appearIndex = appearQueue[page].length-1;
		}
		if(appearIndex > appearQueue[page].length -1){
			page++;
			appearIndex = -1;
		}
		currentAppearIndex = appearIndex;

		if(page > articles.length-1){
			return;
		}		
		if(page < 0){
			return;
		}
		for(var i =0; i < page; i++){
			addClass(articles[i], 'prev');
			removeClass(articles[i], 'next');
			removeClass(articles[i], 'current');
		}
		for(var i = page+1; i < articles.length; i++){
			addClass(articles[i], 'next');
			removeClass(articles[i], 'prev');
			removeClass(articles[i], 'current');
		}
		addClass(articles[page], 'current');
		removeClass(articles[page], 'prev');
		removeClass(articles[page], 'next');
	
		currentSlide = page;
		
		document.location.href = baseURL + '#'+page+'~'+appearIndex;
	}
	
	function leaveAction(back){
		var item = appearQueue[currentSlide][currentAppearIndex];
		if( ! item){
			return;
		}
		var functionName = item.getAttribute('data-function');
		if( functionName){	
			if(undoActions[functionName]){
				undoActions[functionName]();
			}
		}
		if(back){

			removeClass(item, 'show');
			addClass(item, 'hidden');
		}
	}

	function enterAction(){
		if( ! appearQueue[currentSlide].length){
			return;
		}

		var item  = appearQueue[currentSlide][currentAppearIndex];
		if( ! item){
			return ;
		}

		var functionName = item.getAttribute('data-function');
		if( functionName){
			if(actions[functionName]){
				actions[functionName]();
			}
		}

		removeClass(item, 'hidden');
		addClass(item, 'show');

	}

	var actions = {
		__global__ : {},

	}

	var undoActions = {
	}

	return {
		init : init
	}
})()