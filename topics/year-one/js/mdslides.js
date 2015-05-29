var mdslides = (function(){

	function parse(content, markdownConverter){
		var head = {};

		function parseHead(content){
			return content.replace(/---\n([\s\S]*?)---/, function($1, $2){
				arr = $2.split(/\n/);
				for(var i = 0; i < arr.length; i++){
					var tmp = arr[i].split(":");
					if(tmp[0] && tmp[1]){
						var name = trim(tmp.shift());
						var value = trim(tmp.join(":"));
						head[name] = value;
					}
				}
				return "";
			})
		}

		content = parseHead(content);

		var partial = content.split(/-*!SLIDE-*/),
			len = 0;

		if(partial){
			len = partial.length;
		}
		for(var i = 0; i < len; i++){
			partial[i] = trim(partial[i]);
		}

		// convert to html
		if( ! markdownConverter){
			// use showdown converter as default
			markdownConverter = (new Showdown.converter ).makeHtml;
		}
		var html = [];
		for(var i = 0; i < len; i++){
			if(partial[i]){	
				html.push( '<article>\n'+
							markdownConverter(partial[i])+
							'</article>\n' );
			}
		}
		html.join('\n');

		return {
			meta : head,
			html : html
		}
	}

	function trim(str){
		return str.replace(/(^\s*)|(\s*$)/g, "");  
	}

	return {
		parse : parse
	}
})()