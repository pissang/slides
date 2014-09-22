define(function (require) {

    var qtek = require('qtek');

    var renderer;
    var scene;
    var shadowMapPass;
    var animation;

    var timeInterval;

    function init(dom) {
        //----------------------------------
        // Prepare animation shape data
        //----------------------------------
        var canvas = document.createElement('canvas');
        var SIZE = 40;
        canvas.width = SIZE;
        canvas.height = SIZE;
        var ctx = canvas.getContext('2d');
        function drawCross() {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, SIZE, SIZE);
            ctx.save()
            ctx.scale(0.6, 0.6);
            ctx.translate(10, 10);
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.lineWidth = SIZE / 3.5;
            ctx.moveTo(0, 0);
            ctx.lineTo(SIZE, SIZE);
            ctx.stroke();

            ctx.moveTo(SIZE, 0);
            ctx.lineTo(0, SIZE);
            ctx.stroke();
            ctx.restore();
            return ctx.getImageData(0, 0, SIZE, SIZE).data;
        }

        function drawCheck() {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, SIZE, SIZE);

            ctx.scale(0.7, 0.7);
            ctx.translate(10, 10);
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.lineWidth = SIZE / 3.5;
            ctx.moveTo(0, SIZE / 2);
            ctx.lineTo(SIZE / 2, SIZE / 1.2);

            ctx.lineTo(SIZE, SIZE / 10);
            ctx.stroke();

            return ctx.getImageData(0, 0, SIZE, SIZE).data;
        }

        document.body.appendChild(canvas);

        function pixelToPositionArray(pixels) {
            var position = [];
            for (var i = 0; i < pixels.length; i+=4) {
                var r = pixels[i];
                if (r < 128) {
                    continue;
                }
                var idx = i / 4;
                var x = (idx % SIZE) / SIZE * 40 - 20;
                var y = 20 - (idx / SIZE) / SIZE * 40;
                var z = Math.random() * 5;

                position.push([x, y, z]);
            }
            return position;
        }
        var crossPixels = drawCross();
        var checkPixels = drawCheck();

        var crossPosArr = pixelToPositionArray(crossPixels);
        var checkPosArr = pixelToPositionArray(checkPixels);

        var larger = checkPosArr.length < crossPosArr.length ? crossPosArr : checkPosArr;
        var smaller = larger == crossPosArr ? checkPosArr : crossPosArr;

        for (var i = smaller.length; i < larger.length; i++) {
            var random = smaller[Math.round(Math.random() * (smaller.length - 1))];
            random = random.slice();
            random[2] += Math.random() * 5;
            smaller[i] = random;
        }

        var positionArr = [];

        for (var i = 0; i < crossPosArr.length; i++) {
            positionArr[i] = crossPosArr[i].slice();
        }

        //----------------------------------
        // Prepare scene
        //----------------------------------
        var Shader = qtek.Shader;

        renderer = new qtek.Renderer({
            devicePixelRatio: 1.0
        });
        renderer.resize(dom.clientWidth, dom.clientHeight);
        dom.appendChild(renderer.canvas);
        scene = new qtek.Scene();
        shadowMapPass = new qtek.prePass.ShadowMap();

        renderer.resize(window.innerWidth, window.innerHeight);
        var camera = new qtek.camera.Perspective({
            aspect: renderer.canvas.width / renderer.canvas.height
        });
        camera.position.set(0, 0, 45);

        var shader = qtek.shader.library.get('buildin.physical');

        var cubeMat = new qtek.Material({
            shader : shader
        });
        cubeMat.set('glossiness', 0.6);
        cubeMat.set('color', [0.7, 0.3, 0.2]);

        var root = new qtek.Node();
        scene.add(root);

        var cubeList = [];

        var gltfLoader = new qtek.loader.GLTF();
        gltfLoader.load('asset/cube/cube.json');
        gltfLoader.success(function(res) {
            if (!renderer) {
                return;
            }
            var cubeGeo = res.scene.getNode('Cube').geometry;
            for (var i = 0; i < positionArr.length; i++) {
                var position = positionArr[i];
                var mesh = new qtek.Mesh({
                    material: cubeMat,
                    geometry: cubeGeo
                });
                mesh.position.set(position[0], position[1], position[2]);

                mesh.rotation.rotateX(Math.random() * Math.PI * 2);
                mesh.rotation.rotateZ(Math.random() * Math.PI * 2);

                mesh.scale.set(0.5, 0.5, 0.5);
                root.add(mesh);

                cubeList.push(mesh);
            }

            var light = new qtek.light.Directional({
                shadowResolution : 1024,
                shadowBias: 0.005,
                intensity: 1.0
            });
            light.position.set(0, 30, 40);
            light.lookAt(scene.position);
            scene.add(light);

            scene.add(new qtek.light.Ambient({
                intensity: 0.6
            }));

            animation = new qtek.animation.Animation();
            animation.start();

            animation.on('frame', function(deltaTime) {

                shadowMapPass.render(renderer, scene, camera);
                var drawInfo = renderer.render(scene, camera);

                for (var i = 0; i < cubeList.length; i++) {
                    var pos = positionArr[i];
                    qtek.math.Quaternion.rotateY(cubeList[i].rotation, cubeList[i].rotation, deltaTime / 500);
                    qtek.math.Vector3.set(cubeList[i].position, pos[0], pos[1], pos[2]);
                }
            });

            document.body.addEventListener('mousemove', function(e) {
                var dx = e.pageX - window.innerWidth / 2;

                root.rotation.identity().rotateY(dx / 400);
            });
            
            var obj = {
                position : positionArr
            }

            var current = crossPosArr;
            timeInterval = setInterval(function() {
                var another = current == crossPosArr ? checkPosArr : crossPosArr;
                animation.animate(obj)
                .when(1000, {
                    position : another
                }).start("CubicInOut");
                current = another;
            }, 2000);
        });
    }

    function dispose() {
        if (renderer) {
            renderer.canvas.parentNode.removeChild(renderer.canvas);
            renderer.disposeScene(scene);
            renderer.dispose();
            shadowMapPass.dispose(renderer.gl);
            if (animation) {
                animation.stop();
            }

            shadowMapPass = null;
            renderer = null;
            animation = null;

            clearInterval(timeInterval);
        }
    }

    return {
        init: init,
        dispose: dispose
    };
})