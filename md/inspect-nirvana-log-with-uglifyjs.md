使用UglifyJS统计涅磐监控代码
===========================
> by 沈毅(shenyi01@baidu.com)

-------------------!SLIDE---------------------
### 现在的前端监控存在的问题

+	不同业务的监控需求多种多样
+	监控方式的多种多样
+	添加监控很不方便，需要根据需求在相应的业务代码处加入监控代码, 然后找一个版本上线


-------------------!SLIDE---------------------
### 一个统一的监控平台

+	在配置界面添加监控的位置和监控的参数
+	前端分开加载监控的配置脚本，通过aop的方式加入监控

-------------------!SLIDE---------------------
### 为什么要统计现在的监控代码

+	可以一目了然的看出现在监控位置的大概分布，分类，埋点方式，以及几个特殊点
+	为以后写一个自动生成现有监控的转换脚本做个铺垫.

-------------------!SLIDE---------------------
### 手工统计 vs 程序分析？

#### 手工统计
+	代码变动太大（刚刚就经历过一次大的目录结构调整）
+	容易遗漏
+	但是比较准确

#### 程序分析
+	一劳永逸
+	js的静态代码分析很难做精确
+	代码再利用

-------------------!SLIDE---------------------
###	最底层的监控方法NIRVANA_LOG.send

	var logParams = {
        'target' : 'showq_bubble',
        'issearch' : true,
        'planid' : item.planid,
        'unitid' : item.unitid,
        'wordid' : item.wordid,
        'winfoid' : item.winfoid,
        'showq_level' : getShowqLevel(item.showqstat),
        'showq_difficulty' : getShowqDifficulty(item.showqstat),
        'issearch' : isSearch
    };
    
    NIRVANA_LOG.send(logParams);

----
	var logParams = {
		target: me.id + "_" + me.type + "_radio",
		label: labelName
	};
	NIRVANA_LOG.send(logParams);

---
	NIRVANA_LOG.send(UEManager.getUe());

-------------------!SLIDE---------------------
---
	NIRVANA_LOG.send({
		filter_trigger : stc.lastSearchControl,
		filter_condition : stc.searchCondition
	});

---
	while(target && target != ui.util.get("unitTableList").main){
		if(baidu.dom.hasClass(target,"edit_btn")){
			.....
			switch(type){
				case "unitname":
					me.inlineUnitName(target);
					logParams.target = "editInlineUnitName_btn";
					break;
				case "unitbid":
					me.inlineUnitBid(target);
					logParams.target = "editInlineUnitBid_btn";
					break;
				case "negative":
					me.inlineNegative(target);
					logParams.target = "editInlineNegative_btn";
					break;
			}
			break;
		}

		.....

		target = target.parentNode;
	}
	if(logParams.target){
		NIRVANA_LOG.send(logParams);
	}

-------------------!SLIDE---------------------
正则表达式

	code.match(/NIRVANA_LOG.send\(.*?\)/g);

+	NIRVANA\_LOG.send.call, NIRVANA\_LOG.send.apply ？
+	传了哪些参数？
+	二次封装的监控函数？

		KR_CTRL.logCenter

-------------------!SLIDE---------------------
###	借助UglifyJS做语法和语义上的分析

-------------------!SLIDE---------------------
### UglifyJS介绍
[https://github.com/mishoo/UglifyJS](https://github.com/mishoo/UglifyJS)

+	node上的js代码压缩工具(google closure, yui compressor)
+	通过分析js的作用域，将一些局部变量的名字mangle成缩写。
	<pre>
	var Module = (function(){
		// private
		var privateProp = 10;
		var privateMethod = function(){
			doSomething();
		}
		// public
		var publicProp = 10;
		var publicMethod = function(){
			doSomething();
		}
		return {
			prop : publicProp,
			method : publicMethod
		}
	})
	</pre>

-------------------!SLIDE---------------------
### 输出
	var Module = function() {
	    var e = 10, 
	    	t = function() {
		        doSomething();
		    }, 
	    	n = 10, 
	    	r = function() {
		        doSomething();
		    };
	    return {
	        prop: n,
	        method: r
	    };
	};

-------------------!SLIDE---------------------
### 奇淫异巧
	new Array(1, 2, 3, 4)  => [1,2,3,4]
	Array(a, b, c)         => [a,b,c]
	new Array(5)           => Array(5)
	new Array(a)           => Array(a)

	if (foo) bar(); else baz(); 
		==> foo?bar():baz();
	if (!foo) bar(); else baz(); 
		==> foo?baz():bar();
	if (foo) bar(); 
		==> foo&&bar();
	if (!foo) bar(); 
		==> foo||bar();
	if (foo) return bar(); else return baz(); 
		==> return foo?bar():baz();
	if (foo) return bar(); else something(); 
		==> {if(foo)return bar();something()}

-------------------!SLIDE---------------------
### UglifyJS的模块组成
+	parser
	-	tokenize
	-	generate abstract syntax tree
+	uglify
	-	ast walker
	-	add scope
	-	mangle
	-	generate code

-------------------!SLIDE---------------------
### 使用parser模块生成AST
	var jsp = require('uglify-js');
	var ast = jsp.parse('var foo;');

=>

	["toplevel", [["var", [["foo"]]]]]

+	var表达式：

		VAR
	   	 |
	   	foo
+	assign表达式:
	
		a = b;

	----

			ASSIGN
			/	\
		  NAME  NAME
		   |     |
		   a     b

-------------------!SLIDE---------------------
+	name表达式:

		foo;

	---

		NAME
	 	  |
	 	 foo
+	function
+	object
+	call
+	dot
+	string
+	num
+	for
+	...

-------------------!SLIDE---------------------
### 借助uglify模块(process.js)遍历AST

	var process = require('uglify-js').uglify;
	var walker = process.ast_walker();

	walker.with_walkers({
		'defun' : ast_function,
		'function' : ast_function,
		'object' : ast_object,
		'var' : ast_var,
		'assign' : ast_assign,

		'call' : function(expr, args){
			......
			return [ this[0], walk(expr), process.MAP(args, walk) ];
		}
	}, function(){
		walk( ast );
	})

+	每种节点的处理函数的输入和输出可以参考process.js中ast_walkers方法中每种节点的默认处理函数

-------------------!SLIDE---------------------
### NIRVANA_LOG.send(logParams);
	
				CALL
		       /    \
		     DOT    NAME
		     /  \     |
		  NAME  send logParams
		   |
		NIRVANA_LOG

---

			 DOT    
		     /  \
		  NAME  send 
		   |
		NIRVANA_LOG

=> NIRVANA_LOG.send

-------------------!SLIDE---------------------
---

	walker.with_walkers({
		'call' : function(expr, args){
			exprStr = gen_dot_expr( expr );
			if(exprStr == 'NIRVANA_LOG.send' ||
				exprStr == 'NIRVANA_LOG.send.apply' ||
				exprStr == 'NIRVANA_LOG.send.call'){
				...
			}
			return [ this[0], walk(expr), process.MAP(args, walk) ];
		}
	}, function(){
		walk( ast );
	})

+	跟正则表达式相比灵活很多

-------------------!SLIDE---------------------
---

	function gen_dot_expr(expr){
		var path = '';
		walk_node = expr;
		while( walk_node ){
			var type = walk_node[0].name || walk_node[0];
			// ??
			if( type == 'dot'){
				if( path ){
					path = walk_node[2] + '.' + path;
				}else{
					path = walk_node[2];
				}
				walk_node = walk_node[1];
			}
			else if(type == 'sub'){
				if( path ){
					path = walk_node[2][1] + '.' + path;
				}else{
					path = walk_node[2][1];
				}
				walk_node = walk_node[1];
			}else if(type == 'name'){
				path = walk_node[1] + '.' + path;
				walk_node = null;
			}else{
				walk_node = null;
			}
		}
		return path;
	}

+	忽略了一些写法，例如`get('foo').bar`
+	可以直接使用process.gen_code, 但是太慢

-------------------!SLIDE---------------------
### 二次封装的监控函数

+	直接使用NIRVANA_LOG.send来发送监控的方式只是冰山一角

+	各种logCenter
	+	nirvana.effectAnalyse.lib.logCenter
	+	IDEA\_EDIT\_LOG.logCenter
	+	KR\_CTRL.logCenter
	+	nirvana.aoPkgControl.logCenter.sendAs
	+	nirvana.aoControl.sendLog


-------------------!SLIDE---------------------
###	列一张logCenter的白名单

	var logCenterPath = [
		'nirvana.effectAnalyse.lib.logCenter',
		'IDEA_EDIT_LOG.logCenter',
		'KR_CTRL.logCenter',
		'nirvana.aoPkgControl.logCenter.sendAs',
		'nirvana.aoControl.sendLog',
	]

	walker.with_walkers({
		'call' : function(expr, args){
			exprStr = gen_dot_expr( expr );
			if(exprStr == 'NIRVANA_LOG.send' ||
				exprStr == 'NIRVANA_LOG.send.apply' ||
				exprStr == 'NIRVANA_LOG.send.call'){
				// do something
				...
			}
			else if(_.find(logCenterPath, function(path){
					return path == exprStr;
				})){
				// do something
				...
			}
			return [ this[0], walk(expr), process.MAP(args, walk) ];
		}
	}, function(){
		walk( ast );
	})

-------------------!SLIDE---------------------

###	更常见的调用方法
	var me = this;

	....
	
	me.logCenter //or this.logCenter

这里

	me = nirvana.effectAnalyse;
	// or 
	me = IDEA_EDIT_LOG
	// or
	me = KR_CTRL
	// or
	me = nirvana.aoPkgControl.logCenter
	// or
	me = nirvana.aoControl

-------------------!SLIDE---------------------
### 找出this所指向的完整访问路径
	
	var nirvana = {
		prop : {
			method : function(){
				this.sendLog()
			},
			sendLog : function(){
				// send some log
			}
		},
		anOtherMethod : function(){

		}
	}

----
	这里this = nirvana.prop;

+	遍历到method节点的时候，不能通过向上查询找出method所在的具体位置
+	状态保存
	-	遍历到nirvana节点，判断为对象赋值，初始化一个状态, path = 'nirvana'
	-	遍历nirvana的所有属性，碰到'prop', 也是一个object, 继续，同时path='nirvana.prop'
	-	碰到'method'， 是一个方法，path继续为'nirvana.prop', 这里的this就是'nirvana.prop'
	-	...
	-	prop遍历完后path回到'nirvana'
	-	....

-------------------!SLIDE---------------------

### 还有一些更"丧心病狂"的

	/**
	 * 声明快捷方式
	 */
	nirvana.aoControl = nirvana.ao.lib.control;
	nirvana.aoListPager = nirvana.ao.lib.listPager;
	nirvana.aoGroup = nirvana.ao.lib.group;
	nirvana.aoAreaHide = nirvana.ao.lib.areahide;	

	....

	nirvana.aoControl.sendLog();


-------------------!SLIDE---------------------

+	### 多加几个"白名单"

+	或者

+	###	分析数据流

-------------------!SLIDE---------------------

### 设置监控参数的几种方式

+	直接型

		NIRVANA_LOG.send({
			filter_trigger : stc.lastSearchControl,
			filter_condition : stc.searchCondition
		});

	---
	直接分析其参数对象的key和value就行了。

+	含蓄型

		var logParams = {
			target: me.id + "_" + me.type + "_radio",
			label: labelName
		};
		NIRVANA_LOG.send(logParams);

	---
	需要重新查看定义logParams的作用域中的代码，找出任何可能赋值的地方

+	找出定义logParams的作用域？？

-------------------!SLIDE---------------------

### js中的作用域

+	没有块状作用域
	
		if(foo){
			var bar = 10;
		}
		useBar(bar);

	---
	给一个列表添加事件

		for(var i = 0; i < lis.length; i++){
			var foo = getSomething();
			lis[i].onclick = function(){
				useFoo(foo);
			}
		}
		// 利用闭包
		li.forEach(function(li, idx){
			var foo = getSomething();
			li.onclick = function(){
				useFoo(foo);
			}
		})

-------------------!SLIDE---------------------

### scope chain
+	如果没有当前作用不存在定义的地方，就去父作用域找
	
		function a(){
			var foo = 1;
			function b(){
				function c(){
					function d(){
						useFoo(foo);
					}
				}
			}
		}

-------------------!SLIDE---------------------

+	拐弯抹角型
	
		while(target && target != ui.util.get("unitTableList").main){
			if(baidu.dom.hasClass(target,"edit_btn")){
				.....
				switch(type){
					case "unitname":
						me.inlineUnitName(target);
						logParams.target = "editInlineUnitName_btn";
						break;
					case "unitbid":
						me.inlineUnitBid(target);
						logParams.target = "editInlineUnitBid_btn";
						break;
					case "negative":
						me.inlineNegative(target);
						logParams.target = "editInlineNegative_btn";
						break;
				}
				break;
			}
			.....
			target = target.parentNode;
		}
		if(logParams.target){
			NIRVANA_LOG.send(logParams);
		}

	---
	如果需要分析各种参数可能性的话，还要去看程序的control flow，现在只能找出可能有的值，并不能分析出条件

+	丧心病狂型

		NIRVANA_LOG.send(UEManager.getUe());

-------------------!SLIDE---------------------

### Type Analyzer for JavaScript
[http://www.brics.dk/TAJS/](http://www.brics.dk/TAJS/)

+	dataflow analysis
	-	construct a control flow graph
	-	define an appropriate dataflow lattice(abstraction of data)
	-	define transfer functions(abstraction of operations)


-------------------!SLIDE---------------------

#	THANKS!