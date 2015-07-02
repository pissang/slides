define(function (require) {

    var Mesh = require('qtek/Mesh');
    var Node = require('qtek/Node');
    var Material = require('qtek/Material');
    var Shader = require('qtek/Shader');
    var DynamicGeometry = require('qtek/DynamicGeometry');
    var DirectionalLight = require('qtek/light/Directional');
    var AmbientLight = require('qtek/light/Ambient');
    var PointLight = require('qtek/light/Point');
    var PlaneGeometry = require('qtek/geometry/Plane');

    var glMatrix = require('qtek/dep/glmatrix');
    var vec3 = glMatrix.vec3;

    Shader.import(require('text!./shader/lambert.essl'));

    var cubePositions = [
        [-0.4, -0.4, 0], [0.4, -0.4, 0], [0.4, 0.4, 0], [-0.4, 0.4, 0],
        [-0.4, -0.4, -1], [0.4, -0.4, -1], [0.4, 0.4, -1], [-0.4, 0.4, -1]
    ];
    var cubeFaces = [
        // PX
        [1, 5, 6], [1, 6, 2],
        // NX
        [0, 3, 7], [0, 7, 4],
        // PY
        [3, 2, 7], [2, 6, 7],
        // NY
        [1, 4, 5], [1, 0, 4],
        // NZ
        [4, 6, 5], [4, 7, 6]
    ];
    var faceNormals = [
        [1, 0, 0], [1, 0, 0],
        [-1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, 1, 0],
        [0, -1, 0], [0, -1, 0],
        [0, 0, -1], [0, 0, -1]
    ];

    var Histogram3D = function (data, color, opt) {

        this.root = new Node();

        this.root.add(this._createMesh(data, color, opt));
        this.root.add(this._createPlane());

        if (opt.light) {
            var light = new DirectionalLight({
                intensity: 0.8
            });
            var light2 = new DirectionalLight({
                intensity: 0.5
            });
            this.root.add(light);
            this.root.add(light2);

            light.position.set(1, 1, -1);
            light.lookAt(this.root.position);

            light2.position.set(-1, -1, -2);
            light2.lookAt(this.root.position);

            this.root.add(new AmbientLight({
                intensity: 0.1
            }));
        }

        this.root.rotation.rotateX(-Math.PI / 2);
    }

    Histogram3D.prototype = {

        _createPlane: function () {
            // TODO
            var plane = new Mesh({
                geometry: new PlaneGeometry({
                    widthSegments: 60,
                    heightSegments: 60
                }),
                material: new Material({
                    shader: new Shader({
                        vertex: Shader.source('buildin.wireframe.vertex'),
                        fragment: Shader.source('buildin.wireframe.fragment')
                    })
                }),
                transparent: true
            });
            plane.geometry.generateBarycentric();
            plane.scale.set(800, 800, 1);
            plane.material.set('color', [0.8, 0.8, 0.8]);

            return plane;
        },

        _createMesh: function (data, color, opt) {
            var width = data[0].length;
            var height = data.length;

            var geo = new DynamicGeometry();
            for (var i = 0; i < height; i++) {
                var row = data[i];
                for (var j = 0; j < width; j++) {
                    var h = row[j];

                    for (var m = 0; m < 10; m++) {
                        var face = cubeFaces[m];
                        for (var n = 0; n < 3; n++) {
                            var index = face[n];

                            var position = vec3.clone(cubePositions[index]);
                            position[0] += j - width / 2;
                            position[1] += i - height / 2;
                            position[1] = -position[1];
                            position[2] *= -h;

                            if (h) {
                                geo.attributes.position.value.push(position);
                                geo.attributes.normal.value.push(faceNormals[m]);
                                geo.attributes.color.value.push(color[i][j]);
                            }
                        }
                    }
                }
            }

            var shader = new Shader({
                vertex: Shader.source('histogram3d.lambert.vertex'),
                fragment: Shader.source('histogram3d.lambert.fragment')
            });
            var material = new Material({
                shader: shader
            });

            var mesh = new Mesh({
                geometry: geo,
                material: material
            });
            mesh.scale.set(1000 / width, 1000 / width, 1);
            return mesh;
        }
    }

    return Histogram3D;
});