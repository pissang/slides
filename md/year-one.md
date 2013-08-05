---
title:工作第一年
date:2013-08-02
author:沈毅
github:<a href="https://github.com/pissang" target="_blank">pissang</a>
weibo:<a href="http://weibo.com/pissang" target="_blank">pissang</a>
---


<h1 class="title">工作第一年<h1>

----------------------!SLIDE----------------------

+ 主修

    - 前端图形(WebGL, canvas2d, svg)
    - 前端动画

+ 辅修

    - js代码分析
    - Web App
    - ui框架

----------------------!SLIDE----------------------

# 数据可视化

+ zrender

    - Animation
    - Transform

+ echarts
    
    - 力导向布局(Force Directed Layout)

----------------------!SLIDE----------------------

# qtek3d

----------------------!SLIDE----------------------

+ 场景树

    - 场景物体的位置、旋转、缩放

+ 灯光

    - 点光源
    - 平行光
    - 聚光灯

+ 材质库

    - Lambert
    - Phong
    - Wireframe

+ json格式的模型加载
+ 骨骼动画
+ 阴影, PCF, VSM

----------------------!SLIDE----------------------

+ 纹理

    - 图片、视频、Canvas
    - 法线贴图(Normal Map)，高光贴图(Specular Map)
    - 渲染到纹理(RTT)

+ 后期处理模块(Post Processing)

    - Graph Based
    - HDR, Tone Mapping
    - 镜头特效(Depth of Field, Motion Blur, Lens Flare)
    - 颜色调整(LUT)

+ 摄像机控制

    - 第一视角
    - Orbit

----------------------!SLIDE----------------------

# TECH DEMO

----------------------!SLIDE----------------------



----------------------!SLIDE----------------------

# js数据流分析 dfatool

+ js程序中变量数据流的分析
+ 任意一个位置变量类型和值的推导

----------------------!SLIDE----------------------


----------------------!SLIDE----------------------

# UI框架qpf（富客户端编辑器)

+ 组件

    - button
    - slider
    - spinner
    - checkbox
    - combobox
    - label
    - textfield
    - color picker
    - vector

----------------------!SLIDE----------------------

+ 容器

    - panel
    - window
    - vbox
    - hbox
    - tab

----------------------!SLIDE----------------------

+ XML格式

    <application>
        <vbox>
            <panel flex="1">
                <inline style="margin:10px">
                    <label style="margin:5px">Button</label>
                    <button name="button" onclick="@binding[clickHandler]"> click me!</button>
                </inline>
                <checkbox style="margin:10px" checked="@binding[visible]" label="I am a checkbox"></checkbox>

                <inline style="margin:10px" visible="@binding[visible]">
                    <label style="margin:5px">TextField</label>
                    <textfield text="Hi"></textfield>
                </inline>
                <inline style="margin:10px">
                    <label style="margin:5px">Combobox</label>
                    <combobox value="4" width="150">
                        <item value="1">JavaScript</item>
                        <item value="2">PHP</item>
                        <item value="3">Ruby</item>
                        <item value="4">Python</item>
                    </combobox>
                </inline>
            </panel>
            <panel prefer="800">
            </panel>
            <panel prefer="300">
            </panel>
        </vbox>
    </application>

----------------------!SLIDE----------------------

# 应用

+ 
