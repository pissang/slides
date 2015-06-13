define(function (require) {

    var Vector2 = require('qtek/math/Vector2');

    var ShapeBundle = require('zrender/shape/ShapeBundle');

    function ForceField(force) {
        this.force = force || new Vector2();
    }

    ForceField.prototype.applyTo = function (velocity, position, weight, deltaTime) {
        Vector2.scaleAndAdd(velocity, velocity, this.force, deltaTime);
    }

    function BoxCollision(rect) {
        this.rect = rect || [[0, 0], [100, 100]];
    }

    BoxCollision.prototype.applyTo = function (velocity, position, weight, deltaTime) {
        var rect = this.rect;
        var min = rect[0];
        var max = rect[1];
        position = position._array;
        velocity = velocity._array;
        if (position[0] < min[0] || position[0] > max[0]) {
            velocity[0] = -velocity[0] * 0.8;
        }
        if (position[1] < min[1] || position[1] > max[1]) {
            velocity[1] = -velocity[1] * 0.8;
        }
    }

    function Particle() {
        this.position = new Vector2();
        
        this.velocity = new Vector2();

        this.life = 1;

        this.age = 0;

        this.shape = null;
    }

    Particle.prototype.update = function (deltaTime) {
        if (this.velocity) {
            Vector2.scaleAndAdd(this.position, this.position, this.velocity, deltaTime);
        }
    }

    function Emitter(createShape) {
        this.max = 4000;
        this.amount = 15;

        this.life = null;
        this.position = null;
        this.velocity = null;

        this._particlePool = [];

        for (var i = 0; i < this.max; i++) {
            var particle = new Particle();
            particle.emitter = this;
            particle.shape = createShape(particle);
            this._particlePool.push(particle);
        }
    }

    Emitter.prototype.emit = function (out) {
        var amount = Math.min(this._particlePool.length, this.amount);

        for (var i = 0; i < amount; i++) {
            var particle = this._particlePool.pop();
            if (this.position) {
                this.position.get(particle.position);
            }
            if (this.velocity) {
                this.velocity.get(particle.velocity);
            }
            if (this.life) {
                particle.life = this.life.get();
            }

            particle.age = 0;

            out.push(particle);
        }
    }

    Emitter.prototype.kill = function (particle) {
        this._particlePool.push(particle);
    }

    function ParticleEffect(zr) {

        this.zr = zr;

        this._particles = [];

        this._effectors = [];

        this._emitters = [];

        this._elapsedTime = 0;

        this._emitting = true;

        this._shapeBundle = new ShapeBundle({
            style: {
                color: 'white'
            }
        });
        zr.addShape(this._shapeBundle);
    }

    ParticleEffect.prototype = {

        addEmitter: function (emitter) {
            emitter.zr = this.zr;
            this._emitters.push(emitter);
        },

        addEffector: function (effector) {
            this._effectors.push(effector);
        },

        update: function (deltaTime) {
            // MS => Seconds
            deltaTime /= 1000;
            this._elapsedTime += deltaTime;

            var particles = this._particles;

            if (this._emitting) {
                for (var i = 0; i < this._emitters.length; i++) {
                    this._emitters[i].emit(particles);
                }
                if (this.oneshot) {
                    this._emitting = false;
                }
            }

            var shapeList = [];
            // Aging
            var len = particles.length;
            for (var i = 0; i < len;) {
                var p = particles[i];
                p.age += deltaTime;
                if (p.age >= p.life) {
                    p.emitter.kill(p);
                    particles[i] = particles[len-1];
                    particles.pop();
                    len--;
                } else {
                    shapeList.push(p.shape);
                    i++;
                }
            }

            this._shapeBundle.style.shapeList = shapeList;
            this.zr.modShape(this._shapeBundle);

            for (var i = 0; i < len; i++) {
                // Update
                var p = particles[i];
                if (this._effectors.length > 0) {
                    for (var j = 0; j < this._effectors.length; j++) {
                        this._effectors[j].applyTo(p.velocity, p.position, p.weight, deltaTime);
                    }
                }
                p.update(deltaTime);

                var shape = p.shape;
                if (shape) {
                    shape.style.x = p.position.x;
                    shape.style.y = p.position.y;
                }
            }
        }
    };

    ParticleEffect.Emitter = Emitter;
    ParticleEffect.ForceField = ForceField;
    ParticleEffect.BoxCollision = BoxCollision;

    return ParticleEffect;
});