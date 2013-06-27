---
title:Web3D Development
date:2013-06-25
author:沈毅
github:<a href="https://github.com/pissang" target="_blank">pissang</a>
weibo:<a href="http://weibo.com/pissang" target="_blank">pissang</a>
---


<h1 class="title">WEB3D DEVELOPMENT</h1>

+ Web3D简介
+ WebGL
+ 性能优化
+ 资源管理

----------------------!SLIDE----------------------

# Web3D 简介

----------------------!SLIDE-----------------------
# Web3D 历史

+	VRML
+	X3D(JAVA 3D)
+	Firefox Canvas3D, Google O3D
+	Flash 3D(pv3d, away3d)
+	WebGL, Flash Stage3D

----------------------!SLIDE-----------------------
# PV3D

+ 优点
	- 使用flash(覆盖率高)
+ 缺点
	- 软渲染，速度慢，不适合顶点数多的场景
	- 破面(根据物体面来进行的z排序，可以分层，可以选择另一个速度更慢的四叉树渲染)
+ 适用那些简单的展示

----------------------!SLIDE-----------------------
# PV3D SCREENSHOT

<div style="text-align:center">
	<img src="imgs/pv3d.jpg"></img>
</div>


----------------------!SLIDE-----------------------
# O3D

+ 优点
	- 使用javascript对本地d3d和openGL接口的封装
	- 大量模型顶点数据计算和矩阵计算用c++写，效率高
+ 缺点
	- 要装插件
	- google留下的一个烂坑

----------------------!SLIDE-----------------------
# O3D SCREENSHOT
<div style="text-align:center">
	<img src="imgs/o3d.jpg"></img>
</div>

----------------------!SLIDE-----------------------
# FLASH STAGE3D
+ 优点
	- flash 11中引入的东西，跟WebGL一样基于OpenGL ES2.0 标准
	- 部分游戏引擎已经开始加入flash的导出，例如unreal engine, unity3D
	- 开发环境
+ 缺点
	- 这是flash

----------------------!SLIDE-----------------------
<div style="text-align:center">
<iframe width="853" height="480" src="//www.youtube.com/embed/2uo2BI6McQk" frameborder="0" allowfullscreen></iframe>
</div>

----------------------!SLIDE-----------------------
# STAGE3D SCREENSHOT
<div style="text-align:center">
	<img src="imgs/ue3flash2.jpg"></img>
</div>

----------------------!SLIDE-----------------------
# WEBGL

+ 优点
	- 基于OpenGL ES2.0标准(已提出3.0标准)
	- 是高端大气上档次的HTML5标准之一
+ 缺点
	- JavaScript的执行效率受限(asm.js)

----------------------!SLIDE-----------------------
# WEBGL SCREENSHOT
<div style="text-align:center">
	<img src="imgs/webgl-car.jpg"></img>
</div>

----------------------!SLIDE-----------------------
<div style="text-align:center">
<iframe width="853" height="480" src="//www.youtube.com/embed/BV32Cs_CMqo" frameborder="0" allowfullscreen></iframe>
</div>

----------------------!SLIDE-----------------------
# TAKING A PHOTO
<div style="text-align:center">
<img src="http://ww2.sinaimg.cn/large/731863cajw1e5z7dybzxfj20p018g0w1.jpg" height="400px"></img>
</div>

----------------------!SLIDE-----------------------
<ul style="text-align:center">
    <li style="list-style:none">摆好场景</li>
    <li style="list-style:none">放置好相机</li>
    <li style="list-style:none">曝光</li>
    <li style="list-style:none">PS</li>
</ul>

----------------------!SLIDE-----------------------
# RENDERING A SCENE

	var scene = load("somescene.json");
	var camera = createCamera();
	render(scene, camera);

----------------------!SLIDE-----------------------

# TOO YOUNG TOO SIMPLE !

+ WebGL is Low Level API


----------------------!SLIDE-----------------------

# LESSON 1 IN LEARNING WEBGL
<pre class="prettyprint" style="height:300px;overflow-y:scroll">
var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
    	return null;
    }
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
var shaderProgram;
function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}
var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;
function initBuffers() {
    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    var vertices = [
         0.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
}
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}
function webGLStart() {
    var canvas = document.getElementById("lesson01-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    drawScene();
}
</pre>
----------------------!SLIDE-----------------------
# ONLY GET THIS STUFF(WTF)

<div style="text-align:center">
	<img src="imgs/simple.png"></img>
</div>


----------------------!SLIDE-----------------------
# SOME LIBRARY

+ [THREE.JS](https://github.com/mrdoob/three.js)
+ [SCENE.JS](https://github.com/xeolabs/scenejs)
+ [lightgl.js](https://github.com/evanw/lightgl.js)
+ SpiderGL, GLGE, O3D
+ [Comparison of WebGL Framework APIs](http://weblog.benjaminsommer.com/blog/2012/05/13/comparison-of-webgl-framework-apis/)

----------------------!SLIDE-----------------------
# USING THREE.JS

+ WebGLRenderer

+ CSS3 Renderer
	- 使用css3的transform3d

+ Canvas Renderer
	- 通过变换Path的顶点位置, 把3D空间坐标中的顶点位置变换到屏幕坐标
	- 不能实现面交叉

+ Software Renderer
	- 软件光栅化
	- 慢

----------------------!SLIDE-----------------------
# HELLO WORLD

<pre class="prettyprint" style="height:300px;overflow-y:scroll">
var camera, scene, renderer;
var geometry, material, mesh;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 1000;

    scene = new THREE.Scene();

    geometry = new THREE.CubeGeometry( 200, 200, 200 );
    material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

}

function animate() {

    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame( animate );

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    renderer.render( scene, camera );

}
</pre>

----------------------!SLIDE-----------------------
# SCREENSHOT

<div style="text-align:center">
	<img src="imgs/threejshelloworld.png"></img>
</div>

----------------------!SLIDE-----------------------
# MAIN STEPS(1) - CREATE SCENE

+ scene = new THREE.Scene();
+ geometry = new THREE.CubeGeometry( 200, 200, 200 );
+ material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
+ mesh = new THREE.Mesh( geometry, material );
+ scene.add(mesh);


----------------------!SLIDE-----------------------
# MAIN STEPS(2) - CREATE CAMERA

+ camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
+ camera.position.z = 1000;

----------------------!SLIDE-----------------------
# PERSPECTIVE CAMERA

<div style="text-align:center">
	<img src="imgs/perspective.png"></img>
</div>


----------------------!SLIDE-----------------------
# MAIN STEPS(3) - RENDER

+ renderer = new THREE.WebGLRenderer();
+ renderer.setSize( window.innerWidth, window.innerHeight );
+ renderer.render(scene, camera);

----------------------!SLIDE-----------------------
# BEHIND THREE.JS

<div style="text-align:center">
	<img src="imgs/snapshot.png"></img>
</div>


----------------------!SLIDE-----------------------
# RENDERING PIPELINE

<div style="text-align:center">
	<img src="imgs/pipeline.png"></img>
</div>

----------------------!SLIDE-----------------------
# VERTEX DATA

+ 位置(position)
+ 颜色(color)
+ 纹理坐标(texcoord)
+ 法线(normal)
+ 切线(tangent)
+ 骨骼权重
+ 骨骼索引

----------------------!SLIDE-----------------------
# DCC TOOLS

+ 3ds Max
+ MAYA
+ Cinima 4D
+ Blender

----------------------!SLIDE-----------------------
# BLENDER

<div style="text-align:center">
	<img src="imgs/blender.png"></img>
</div>

----------------------!SLIDE-----------------------
# SHADERS

<div style="text-align:center">
	<img src="imgs/shaders.png"></img>
</div>

----------------------!SLIDE-----------------------
# SHADERS

+ 坐标变换
+ 纹理贴图
+ 光照计算
+ 阴影
+ ....


----------------------!SLIDE-----------------------
# MATHMATICAL IN WEBGL

----------------------!SLIDE-----------------------
# 矩阵运算

+ 线性变换
    - 平移
    - 旋转
    - 缩放
+ 求逆和转置
+ 分解

----------------------!SLIDE-----------------------
# LIGHTNING

+ 点光源
    - 烛光（理想模型）
+ 聚光灯
    - 台灯
+ 平行光
    - 日光
+ 面光源

----------------------!SLIDE-----------------------
# WHAT IS SHADING

<div style="text-align:center">
<iframe width="853" height="480" src="//www.youtube.com/embed/V3WmrWUEIJo" frameborder="0" allowfullscreen></iframe>
</div>

----------------------!SLIDE-----------------------
<div style="text-align:center">
<img src="imgs/lighting.png" style="width:500px"></img>
</div>

+ Diffuse
    - Lambert
+ Specular
    - Blinn Phong 


----------------------!SLIDE-----------------------
# SHADOWS

+ Shadow Mapping

----------------------!SLIDE-----------------------
# ADVANCED SHADOWS

+ Soft Shadows

    - Percentage Close Filter
    - Variance Shadow Mapping

+ Casced Shadow Mapping

----------------------!SLIDE-----------------------
# ADVANCED RENDERING

+ Normal Mapping
+ Screen Space Ambient Occlusion
+ Physically Based Lighting
+ Image Based Lighting
+ Subsurface Scattering
+ Indirect Lighting(Light Globe)
+ ...

----------------------!SLIDE-----------------------
# PROCEDURE WORLD

+ Ocean Rendering

    - Vertex Texture Fetching
    - Perlin Noise
    - UV Shifting

+ Terrain Rendering

    - Height Map

+ Particles

----------------------!SLIDE-----------------------
# Image Processing

+ HDR + Tone Mapping
+ Depth Of Field + Bokeh
+ Mothion Blur
+ Lens Flares
+ Color Grading

----------------------!SLIDE-----------------------
# HDR
<div style="text-align:center">
<img src="http://upload.wikimedia.org/wikipedia/commons/b/b3/HDRI-Example.jpg" />
</div>


----------------------!SLIDE-----------------------
# DOF

<div style="text-align:center">
<img src="http://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Josefina_with_Bokeh.jpg/800px-Josefina_with_Bokeh.jpg" width="500px"/>
</div>

+ 毒！德味！焦内如刀割般锐利！焦外如奶油般化开！

----------------------!SLIDE-----------------------
# Motion Blur
<div style="text-align:center">
<img src="imgs/motionblur.png" />
</div>

----------------------!SLIDE-----------------------
# Lens Flare
<div style="text-align:center">
<iframe width="853" height="480" src="//www.youtube.com/embed/7tneIXR1btQ" frameborder="0" allowfullscreen></iframe>
</div>

----------------------!SLIDE-----------------------
# Rendering Worlds With Two Triangles

+ [http://www.iquilezles.org/www/material/nvscene2008/rwwtt.pdf](http://www.iquilezles.org/www/material/nvscene2008/rwwtt.pdf)
+ [https://www.shadertoy.com/](https://www.shadertoy.com/)

----------------------!SLIDE-----------------------
# RESOURCES

+ Real Time Rendering
+ OpenGL ES 2.0 Specification
+ The OpenGL Shading Language Specification

+ [http://codeflow.org/](http://codeflow.org/)
+ [blog.tojicode.com/](blog.tojicode.com/)
+ [http://learningwebgl.com/blog/](http://learningwebgl.com/blog/)

----------------------!SLIDE-----------------------
# THANKS

