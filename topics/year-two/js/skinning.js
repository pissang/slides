define(function(require) {

    var Renderer = require('qtek/Renderer');
    var Animation = require('qtek/animation/Animation');
    var Scene = require('qtek/Scene');
    var PerspectiveCamera = require('qtek/camera/Perspective');
    var PlaneGeo = require('qtek/geometry/Plane');
    var SphereGeo = require('qtek/geometry/Sphere');
    var DirectionalLight = require('qtek/light/Directional');
    var AmbientLight = require('qtek/light/Ambient');
    var GLTFLoader = require('qtek/loader/GLTF');
    var OrbitControl = require('qtek/plugin/OrbitControl');
    var Material = require('qtek/Material');
    var Shader = require('qtek/Shader');
    var Mesh = require('qtek/Mesh');
    var Node = require('qtek/Node');
    var TransformClip = require('qtek/animation/TransformClip');
    var SkinningClip = require('qtek/animation/SkinningClip');
    var Vector3 = require('qtek/math/Vector3');
    var Task = require('qtek/async/Task');
    var TaskGroup = require('qtek/async/TaskGroup');
    var ShadowMapPass = require('qtek/prePass/ShadowMap');
    var DynamicGeometry = require('qtek/DynamicGeometry');
    var meshUtil = require('qtek/util/mesh');
    var textureUtil = require('qtek/util/texture');
    var shaderLibrary = require('qtek/shader/library');
    var Texture2D = require('qtek/texture/Texture2D');
    var Texture = require('qtek/Texture');

    var SMDParser = require('./SMDParser');

    var glMatrix = require('glmatrix');
    var vec3 = glMatrix.vec3;

    var heroFragStr = require('text!../assets/hero.essl');

    var renderer;
    var animation;
    
    function createSkeletonDebugScene(rootNode) {
        var scene = new Scene();
        var sphereGeo = new SphereGeo({
            radius : 2
        });
        var sphereMat = new Material({
            shader : shaderLibrary.get('buildin.basic')
        });
        sphereMat.set("color", [1, 1, 1]);

        var jointDebugSpheres = [];

        var updates = [];
        rootNode.traverse(function(node, parentNode) {

            var sphere = new Mesh({
                geometry : sphereGeo,
                material : sphereMat,
                autoUpdateLocalTransform : false
            });
            scene.add(sphere);

            var lineGeo = new DynamicGeometry();
            var lineGeoVertices = lineGeo.attributes.position.value;
            lineGeoVertices.push(vec3.create(), vec3.create());
            var line = new Mesh({
                geometry : lineGeo,
                material : sphereMat,
                mode : Mesh.LINES,
                lineWidth : 2
            });
            scene.add(line);

            updates.push(function() {
                sphere.localTransform.copy(node.worldTransform);
                if (parentNode) {
                    lineGeoVertices[0] = node.getWorldPosition()._array;
                    lineGeoVertices[1] = parentNode.getWorldPosition()._array;
                }  
                lineGeo.dirty('position');
            });

            scene.before('render', function() {
                for (var i = 0; i < updates.length; i++) {
                    updates[i]();
                }
            });
            return scene;
        });
        
        scene.before('render', function() {
            for (var i = 0; i < updates.length; i++) {
                updates[i]();
            }
        });

        scene.position.x = -30;
        return scene;
    }

    function init(dom) {
        if (renderer) {
            return;
        }
        renderer = new Renderer();
        renderer.resize(dom.clientWidth, dom.clientHeight);
        dom.appendChild(renderer.canvas);
        animation = new Animation();
        animation.start();

        var camera = new PerspectiveCamera({
            aspect: renderer.width / renderer.height
        });
        camera.position.set(40, 10, 40);
        camera.lookAt(new Vector3(0, 8, 0));

        var control = new OrbitControl({
            target: camera,
            domElement: renderer.canvas
        });
        var shadowMapPass = new ShadowMapPass({
            softShadow: ShadowMapPass.VSM,
            shadowBlur: 0.2
        });

        var scene = new Scene();
        var heroRootNode = new Node();
        heroRootNode.rotation.rotateX(-Math.PI/2);
        heroRootNode.scale.set(0.1, 0.1, 0.1);
        heroRootNode.position.x = 10;

        scene.add(heroRootNode);
        var light = new DirectionalLight({
            intensity : 1,
            shadowResolution : 512,
            shadowBias : 0.02
        });
        light.position.set(10, 20, 5);
        light.lookAt(new Vector3(0, 10, 0));

        scene.add(light);
        scene.add(new AmbientLight({
            intensity : 0.1
        }));

        var groundPlane = new Mesh({
            geometry : new PlaneGeo(),
            material : new Material({
                shader : shaderLibrary.get('buildin.physical', 'diffuseMap', 'normalMap')
            }),
            culling : false
        });
        groundPlane.geometry.generateTangents();
        groundPlane.material.set('glossiness', 0.8);
        groundPlane.material.set('specularColor', [0.5, 0.5, 0.5]);
        var diffuse = new Texture2D({
            anisotropic: 32,
            wrapS: Texture.REPEAT,
            wrapT: Texture.REPEAT
        });
        diffuse.load('assets/chessboard.png');
        var normal = new Texture2D({
            anisotropic: 32,
            wrapS: Texture.REPEAT,
            wrapT: Texture.REPEAT
        });
        normal.load('assets/chessboard_NRM.png');
        
        groundPlane.material.set('diffuseMap', diffuse);
        groundPlane.material.set('normalMap', normal);
        groundPlane.material.set('uvRepeat', [30, 30]);

        groundPlane.scale.set(500, 500, 1);
        groundPlane.rotation.rotateX(-Math.PI / 2);

        scene.add(groundPlane);

        var loader = new GLTFLoader();
        loader.load('assets/abaddon/abaddon.json');
        var materialLoader = Task.makeRequestTask('assets/abaddon/materials.json');
        var taskGroup = new TaskGroup();
        taskGroup.all([loader, materialLoader]).success(function(res) {
            var gltf = res[0];
            var materials = JSON.parse(res[1]);
            var children = gltf.scene.children();
            var animationPrepared = false;
            for (var i = 0; i < children.length; i++) {
                heroRootNode.add(children[i]);
            }
            heroRootNode.update(true);
            var meshes = [];
            heroRootNode.traverse(function(node) {
                if (node.geometry) {
                    if (node.geometry.getVertexNumber() > 0) {
                        meshes.push(node);
                        node.geometry.generateTangents();
                    }
                    if (node.material) {
                        var mat = node.material;
                        var shader = mat.shader;
                        shader.setFragment(heroFragStr);
                        // reattach
                        mat.attachShader(shader);
                        shader.enableTexturesAll();
                    }
                }
            });
            for (var name in materials) {
                var params = materials[name];
                var mat = gltf.materials[name];
                mat.shader.disableTexturesAll();
                if (mat) {
                    ['diffuseMap', 'normalMap', 'maskMap1', 'maskMap2']
                        .forEach(function(name) {
                            if (params[name] !== undefined) {
                                var texture = new Texture2D({
                                    wrapS : Texture.REPEAT,
                                    wrapT : Texture.REPEAT
                                });
                                texture.load(params[name]);
                                mat.set(name, texture);
                                mat.shader.enableTexture(name);
                            }
                        });
                    ['u_SpecularExponent', 'u_SpecularScale', 'u_SpecularColor', 'u_RimLightScale', 'u_RimLightColor']
                        .forEach(function(name) {
                            if (params[name] !== undefined) {
                                mat.set(name, params[name]);
                            }
                        });
                    if (params.transparent) {
                        mat.transparent = true;
                        mat.depthMask = false;
                    }
                }
            }
            for (var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i];
                meshUtil.splitByJoints(mesh, 30, true);
            }

            var skeletonDebugScene = createSkeletonDebugScene(scene.getNode('root'));
            var clearAll = renderer.clear;
            animation.on('frame', function(deltaTime) {
                control.update(deltaTime);
                for (var name in gltf.skeletons) {
                    if (gltf.skeletons[name].getClipNumber()) {
                        gltf.skeletons[name].setPose(0);
                    }
                }
                shadowMapPass.render(renderer, scene, camera);
                renderer.clear = clearAll;
                renderer.render(scene, camera);
                renderer.clear = 0;
                renderer.render(skeletonDebugScene, camera);
            });

            // Loading animation
            var animTask = Task.makeRequestTask('assets/abaddon/smd/run.smd');
            animTask.success(function(data) {
                var frames = SMDParser(data);
                var skinningClip = new SkinningClip();
                skinningClip.setLoop(true);

                for (var name in frames) {
                    var jointClip = new TransformClip({
                        name: name,
                        keyFrames: frames[name]
                    });
                    skinningClip.addJointClip(jointClip);
                }
                animation.removeClipsAll();
                animation.addClip(skinningClip);
                for (var name in gltf.skeletons) {
                    gltf.skeletons[name].addClip(skinningClip);
                }
            });
        });
    }

    function dispose() {
        if (renderer) {
            renderer.canvas.parentNode.removeChild(renderer.canvas);
            renderer.dispose();
            animation.stop();
            renderer = null;
            animation = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    }
 });