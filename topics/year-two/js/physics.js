define(function(require) {
    
    var Engine = require('qtek-physics/Engine');
    var RigidBody = require('qtek-physics/RigidBody');
    var StaticPlaneShape = require('qtek-physics/shape/StaticPlane');
    var CompoundShape = require('qtek-physics/shape/Compound');
    var ConvexHullShape = require('qtek-physics/shape/ConvexHull');
    var Collider = require('qtek-physics/Collider');
    var PhysicsMaterial = require('qtek-physics/Material');
    var Renderer = require('qtek/Renderer');
    var Animation = require('qtek/animation/Animation');
    var Cylinder = require('qtek/geometry/Cylinder');
    var Plane = require('qtek/geometry/Plane');
    var Scene = require('qtek/Scene');
    var PerspectiveCamera = require('qtek/camera/Perspective');
    var Vector3 = require('qtek/math/Vector3');
    var Vector2 = require('qtek/math/Vector2');
    var DirectionalLight = require('qtek/light/Directional');
    var AmbientLight = require('qtek/light/Ambient');
    var Mesh = require('qtek/Mesh');
    var Material = require('qtek/Material');
    var Shader = require('qtek/Shader');
    var textureUtil = require('qtek/util/texture');
    var shaderLibrary = require('qtek/shader/library');
    var OrbitControl = require('qtek/plugin/OrbitControl');
    var GLTFLoader = require('qtek/loader/GLTF');
    var qtekUtil = require('qtek/core/util');

    var engine;
    var renderer;
    var animation;

    function init(dom) {
        if (engine) {
            return;
        }
        engine = new Engine({
            ammoUrl : '../../js/lib/ammo.fast.js'
        });
        engine.init();
        renderer = new Renderer({
            devicePixelRatio : 1.0
        });
        renderer.resize(dom.clientWidth, dom.clientHeight);
        dom.appendChild(renderer.canvas);

        animation = new Animation();
        animation.start();
        
        var scene = new Scene();
        var camera = new PerspectiveCamera({
            aspect : renderer.width / renderer.height
        });
        camera.position.set(0, 6, 20);
        camera.lookAt(Vector3.ZERO);

        var light = new DirectionalLight({
            shadowResolution : 2048,
            shadowBias : 0.005
        });
        light.position.set(1, 2, 1);
        light.lookAt(Vector3.ZERO);
        scene.add(light);
        scene.add(new AmbientLight({intensity : 0.1}));

        var material = new Material({
            shader : shaderLibrary.get('buildin.physical', 'diffuseMap')
        });
        material.set('glossiness', 0.2);
        var texture = textureUtil.createChessboard(2048, 8);
        texture.anisotropic = 32;
        material.set('diffuseMap', texture);

        var planeMesh = new Mesh({
            material : material,
            geometry : new Plane(),
            scale : new Vector3(200, 200, 1)
        });
        planeMesh.rotation.rotateX(-Math.PI / 2);

        var floorBody = new RigidBody({
            shape : new StaticPlaneShape()
        });
        engine.addCollider(new Collider({
            collisionObject : floorBody,
            physicsMaterial : new PhysicsMaterial(),
            sceneNode : planeMesh,
            isStatic : true
        }));
        scene.add(planeMesh);
        /****************************
                    Barrel
         ****************************/
        var loader = new GLTFLoader();
        loader.load('assets/barrel/prop_barrel.json');
        var compoundShape = new CompoundShape();
        var barrelShape = new ConvexHullShape({
            geometry : new Cylinder({
                capSegments : 8,
                height : 1.2,
                radius : 0.5
            })
        });
        compoundShape.addChildShape(barrelShape, new Vector3(0, 0.6, 0));
        var barrelPhysicsMaterial = new PhysicsMaterial();

        loader.success(function(res) {
            var _scene = res.scene;
            var barrelNode = _scene.getNode('prop_barrel');

            qtekUtil.each(res.materials, function(mat, name) {
                mat.shader.define('DIFFUSEMAP_ALPHA_GLOSS');
                mat.set('glossiness', 0.5);
            });
            qtekUtil.each(res.textures, function(texture) {
                texture.flipY = false;
            });
            for (var i = 0; i < 100; i++) {
                var newBarrel = barrelNode.clone();
                newBarrel.position.set(Math.random() * 10 - 5, Math.random() * 5 + 5, Math.random() * 10 - 5);
                scene.add(newBarrel);

                var rigidBody = new RigidBody({
                    shape : compoundShape,
                    mass : 10
                });
                var collider = new Collider({
                    collisionObject : rigidBody,
                    sceneNode : newBarrel,
                    physicsMaterial : barrelPhysicsMaterial
                });
                engine.addCollider(collider);
            }

            renderer.canvas.onclick = function(e) {
                var ray = camera.castRay(new Vector2());
                var newBarrel = barrelNode.clone();
                newBarrel.position.copy(ray.origin).add(ray.direction.clone().scale(1));
                newBarrel.rotation.rotateX(Math.random() * 6);
                newBarrel.rotation.rotateY(Math.random() * 6);
                scene.add(newBarrel);

                var rigidBody = new RigidBody({
                    shape : compoundShape,
                    mass : 1
                });
                var collider = new Collider({
                    collisionObject : rigidBody,
                    sceneNode : newBarrel,
                    physicsMaterial : barrelPhysicsMaterial
                });
                engine.addCollider(collider);

                rigidBody.applyImpulse(ray.direction.clone().add(new Vector3(0, 0.1, 0)).scale(20));
            }
        });
        /****************************
                Interaction
         ****************************/
        var control = new OrbitControl({
            target : camera,
            domElement : renderer.canvas
        });
        animation.on('frame', function(dTime) {
            engine.step(dTime / 1000);
            control.update(dTime);
            // shadowMapPass.render(renderer, scene, camera);
            renderer.render(scene, camera);
        });
    }

    function dispose() {
        if (renderer) {
            renderer.canvas.onclick = renderer.canvas.onkeydown = null;
            renderer.dispose();
            animation.stop();
            engine.dispose();
            animation = null;
            renderer = null;
            engine = null;
        }
    }

    return {
        init: init,
        dispose: dispose
    }
});