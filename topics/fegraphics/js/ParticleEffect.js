define(function (require) {

    var Vector2 = require('qtek/math/Vector2');

    function ForceField() {
        this.force = new Vector2();
    }

    ForceField.prototype.applyTo = function (velocity, position, weight, deltaTime) {
        Vector2.scaleAndAdd(velocity, velocity, this.force, deltaTime);
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
        this.max = 1000;
        this.amount = 20;

        this.life = null;
        this.position = null;
        this.velocity = null;

        this.zr = null;

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

            this.zr.addShape(particle.shape);

            particle.age = 0;

            out.push(particle);
        }
    }

    Emitter.prototype.kill = function (particle) {
        this._particlePool.push(particle);
        this.zr.delShape(particle.shape);
    }

    function ParticleEffect(zr) {

        this.zr = zr;

        this._particles = [];

        this._fields = [];

        this._emitters = [];

        this._elapsedTime = 0;

        this._emitting = true;
    }

    ParticleEffect.prototype = {

        addEmitter: function (emitter) {
            emitter.zr = this.zr;
            this._emitters.push(emitter);
        },

        addField: function (field) {
            this._fields.push(field);
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
                    i++;
                }
            }

            for (var i = 0; i < len; i++) {
                // Update
                var p = particles[i];
                if (this._fields.length > 0) {
                    for (var j = 0; j < this._fields.length; j++) {
                        this._fields[j].applyTo(p.velocity, p.position, p.weight, deltaTime);
                    }
                }
                p.update(deltaTime);

                var shape = p.shape;
                if (shape) {
                    shape.position[0] = p.position.x;
                    shape.position[1] = p.position.y;
                }
                this.zr.modShape(shape);
            }
        }
    };

    ParticleEffect.Emitter = Emitter;
    ParticleEffect.ForceField = ForceField;

    return ParticleEffect;
});