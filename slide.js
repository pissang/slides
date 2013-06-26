/**
 * slides.js
 * 
 * @author shenyi
 *			shenyi01@baidu.com
 */
(function(){
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
		var classes = elem.className.split(' ');
		classes.push(className);
		elem.className = classes.join(' ');
	}

	function removeClass(elem, className){
		var classes = elem.className.split(' ');
		if(classes.indexOf(className) < 0){
			return;
		}
		classes.splice(classes.indexOf(className), 1)
		elem.className =classes.join(' ');
	}

	function hasClass(elem, className){
		var classes = elem.className.split(' ');
		return classes.indexOf(className) > -1;
	}

	document.addEventListener('DOMContentLoaded', function(){
			
		articles = document.querySelectorAll('#articles>article');
		for(var i = 0; i < articles.length; i++){
			articles[i].style.left = 100+(articles[i].scrollWidth + 100)*i +'px'
			articles[i].style.top = "20px"
		}
		container = document.querySelector('#articles');
		
		appearSerial();

		var urls = document.location.href.split('#')
		baseURL = urls[0];
		//跳到指定位置

		if(urls[1]){
			var locations = urls[1].split('~'),
				page = parseInt(locations[0] || 0),
				appearIndex =  parseInt(locations[1] || -1);
			for(var i = 0; i < page; i++){
				for(var j = 0; j < appearQueue[i].length; j++){
					removeClass(appearQueue[i][j], 'hidden');
					addClass(appearQueue[i][j], 'show');
				}
			}
			for(var i = 0; i <= appearIndex; i++){
				removeClass(appearQueue[page][i], 'hidden');
				addClass(appearQueue[page][i], 'show');
			}

			jumpTo(page, appearIndex);
		}
		//代码高亮
		// sh_highlightDocument();
		
		//初始化一些杂七杂八的东西
		initAll();
	});

	function appearSerial(){

		for(var k = 0; k < articles.length; k++){
			appearQueue[k] = [];
			var lis = articles[k].querySelectorAll('ul.serial>li');

			for(var j = 0; j < lis.length; j++){

				addClass(lis[j], 'hidden');
				appearQueue[k].push(lis[j]);
			}
		}
	}
	
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
		      event.preventDefault();
		      break;
		      
		    case 37: // left arrow
		    case 8: // Backspace
		    case 33: // PgUp
		      prev();
		      event.preventDefault();
		      break;
	
			default:
		}
	})
	
	var lock = function(time){
		locked = true;
		setTimeout(unlock, time)
	}
	var unlock = function(){
		locked = false;
	}
	
	var translateX = function(size){
		container.style['WebkitTransform'] = 'translateX('+size+'px)';
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
		//lock(animateInterval*3);
		if(page != currentSlide){

			var distance = -(articles[0].scrollWidth + 100) * page;
			animateChain([{
				func : perspective,
				interval : animateInterval
			},
			{
				func : function(){translateX(distance);},
				interval : animateInterval
			},
			{
				func : ortho,
				interval : animateInterval
			}])

		}
		currentSlide = page;
		
		document.location.href = baseURL + '#'+page+'~'+appearIndex;
	}
	
	function leaveAction(back){
		var item = appearQueue[currentSlide][currentAppearIndex];
		if( ! item){
			return;
		}
		if(hasClass(item, 'action')){
			var functionName = item.getAttribute('data-function');
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

		if(hasClass(item, 'action')){
			actions[item.getAttribute('function')]();
		}


		removeClass(item, 'hidden');
		addClass(item, 'show');

	}

	//
	//useless for now
	//
	function clip(){
		for(i = 0; i < currentSlide; i++){
			articles[i].style.display = 'none';
		}
		for(i = currentSlide-1; i < articles.length; i++){
			articles[i].style.display = 'block';
		}
	}
	
	function perspective(){
		document.getElementById('wrapper').style['WebkitTransform'] = 
						'perspective(1000px) rotateY(20deg) translate3D(0px, 20px, -30px)';
	}
	
	function ortho(){
		document.getElementById('wrapper').style['WebkitTransform'] = '';
	}
	/**
	 * 
	 */
	function animateChain(animates, callback){
		callback = callback || function(){};
		var time = 0;
		for(var i =0; i < animates.length; i++){
			setTimeout(animates[i].func, time);
			time += animates[i].interval
		}
		setTimeout(callback, time);
	}
	
	/**
	 * 初始化一些杂七杂八的东西
	 */
	function initAll(){
	

	}

	var actions = {
		__global__ : {},

	}

	var undoActions = {
	}

})()