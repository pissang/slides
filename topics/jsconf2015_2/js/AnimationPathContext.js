define(function (require) {

    var zrender = require('zrender');
    var Circle = require('zrender/shape/Circle');
    var Line = require('zrender/shape/Line');
    var BezierCurve = require('zrender/shape/BezierCurve');
    var Circle = require('zrender/shape/Circle');
    var Rectangle = require('zrender/shape/Rectangle');

    var PathProxy = require('zrender/shape/util/PathProxy');
    var Path = require('zrender/shape/Path');

    var curveTool = require('zrender/tool/curve');

    function AnimationPathContext(dom) {

        this.zr = zrender.init(dom);

        this._steps = [];

        this._pathProxy = new PathProxy();

        this._fillShape = new Path({
            style: {
                color: 'rgba(255, 255, 255, 0.5)'
            }
        });
    }

    AnimationPathContext.prototype = {
        
        constructor: AnimationPathContext,

        beginPath: function (ctx) {
            this.zr.clear();

            this._x = null;
            this._y = null;

            this._pathProxy.begin();
        },

        _pointCircle: function (x, y, cb) {
            var circle = new Circle({
                style: {
                    color: 'white',
                    x: x,
                    y: y,
                    r: 0
                },
                z: 1
            });
            this.zr.addShape(circle);

            this.zr.animate(circle, 'style')
                .when(200, {
                    r: 5
                })
                .done(cb)
                .start('ElasticOut');
        },

        _createControlPoint: function (x, y, sx, sy, cb) {
            var circle = new Circle({
                style: {
                    color: 'white',
                    x: 0,
                    y: 0,
                    r: 5
                },
                position: [x, y],
                z: 1,
                draggable: true,
                ondrift: function () {
                    var position = this.position;
                    line.style.xStart = position[0];
                    line.style.yStart = position[1];

                    cb && cb(position[0], position[1]);
                }
            });
            var line = new Line({
                style: {
                    color: 'white',
                    lineWidth: 1,
                    xStart: x,
                    yStart: y,
                    xEnd: sx,
                    yEnd: sy
                },
                hoverable: false
            });

            this.zr.addShape(circle);
            this.zr.addShape(line);
        },

        moveTo: function (x, y) {
            this._x = x;
            this._y = y;

            var zr = this.zr;
            var self = this;

            this._steps.push(function (cb) {
                self._pointCircle(x, y, cb);
            });

            this._pathProxy.moveTo(x, y);
        },

        lineTo: function (x, y) {

            if (this._x === null) {
                this._x = x;
                this._y = y;
                return;
            }

            var zr = this.zr;
            var self = this;

            var x0 = this._x;
            var y0 = this._y;

            this._steps.push(function (cb) {
                var line = new Line({
                    style: {
                        color: 'white',
                        xStart: x0,
                        yStart: y0,
                        xEnd: x0,
                        yEnd: y0,
                        lineWidth: 2
                    }
                });
                zr.addShape(line);

                zr.animate(line, 'style')
                    .when(200, {
                        xEnd: x,
                        yEnd: y
                    })
                    .done(function () {
                        self._pointCircle(x, y, cb);
                    })
                    .start();
            });

            this._x = x;
            this._y = y;

            this._pathProxy.lineTo(x, y);
        },

        quadraticCurveTo: function (x1, y1, x2, y2) {

            if (this._x === null) {
                this._x = x1;
                this._y = y1;
            }

            var zr = this.zr;
            var self = this;

            this._steps.push(function (cb) {
                var curve = new BezierCurve({
                    style: {
                        color: 'white',
                        xStart: x0,
                        yStart: y0,
                        cpX1: x0,
                        cpY1: y0,
                        xEnd: x0,
                        yEnd: y0,
                        lineWidth: 2
                    }
                });
                zr.addShape(curve);

                var obj = {p: 0}

                var xArr = [];
                var yArr = [];
                var style = curve.style;
                zr.animation.animate(obj)
                    .when(200, {
                        p: 1
                    })
                    .during(function () {
                        curveTool.quadraticSubdivide(x0, x1, x2, obj.p, xArr);
                        curveTool.quadraticSubdivide(y0, y1, y2, obj.p, yArr);

                        style.xStart = xArr[0];
                        style.yStart = yArr[0];
                        style.cpX1 = xArr[1];
                        style.cpY1 = yArr[1];
                        style.xEnd = xArr[2];
                        style.yEnd = yArr[2];

                        zr.modShape(curve);
                    })
                    .done(function () {
                        self._pointCircle(x2, y2, function () {
                            self._createControlPoint(
                                style.cpX1, style.cpY1,
                                style.xStart, style.yStart,
                                function (x, y) {
                                    style.cpX1 = x;
                                    style.cpY1 = y;
                                    zr.modShape(curve);
                                }
                            );
                            cb();
                        });
                    })
                    .start();
            });

            var x0 = this._x;
            var y0 = this._y;

            this._x = x2;
            this._y = y2;

            this._pathProxy.quadraticCurveTo(x1, y1, x2, y2);
        },

        bezierCurveTo: function (x1, y1, x2, y2, x3, y3) {

            if (this._x === null) {
                this._x = x1;
                this._y = y1;
            }

            var zr = this.zr;
            var self = this;

            this._steps.push(function (cb) {
                var curve = new BezierCurve({
                    style: {
                        color: 'white',
                        xStart: x0,
                        yStart: y0,
                        cpX1: x0,
                        cpY1: y0,
                        cpX2: x0,
                        cpY2: y0,
                        xEnd: x0,
                        yEnd: y0,
                        lineWidth: 2
                    }
                });
                zr.addShape(curve);

                var obj = {p: 0}

                var xArr = [];
                var yArr = [];
                var style = curve.style;
                zr.animation.animate(obj)
                    .when(200, {
                        p: 1
                    })
                    .during(function () {
                        curveTool.cubicSubdivide(x0, x1, x2, x3, obj.p, xArr);
                        curveTool.cubicSubdivide(y0, y1, y2, y3, obj.p, yArr);

                        style.xStart = xArr[0];
                        style.yStart = yArr[0];
                        style.cpX1 = xArr[1];
                        style.cpY1 = yArr[1];
                        style.cpX2 = xArr[2];
                        style.cpY2 = yArr[2];
                        style.xEnd = xArr[3];
                        style.yEnd = yArr[3];

                        zr.modShape(curve);
                    })
                    .done(function () {
                        self._pointCircle(x3, y3, function () {
                            self._createControlPoint(
                                style.cpX1, style.cpY1,
                                style.xStart, style.yStart,
                                function (x, y) {
                                    style.cpX1 = x;
                                    style.cpY1 = y;
                                    zr.modShape(curve);
                                }
                            );
                            self._createControlPoint(
                                style.cpX2, style.cpY2,
                                style.xEnd, style.yEnd,
                                function (x, y) {
                                    style.cpX2 = x;
                                    style.cpY2 = y;
                                    zr.modShape(curve);
                                }
                            );
                            cb();
                        });
                    })
                    .start();
            });

            var x0 = this._x;
            var y0 = this._y;

            this._x = x3;
            this._y = y3;

            this._pathProxy.quadraticCurveTo(x1, y1, x2, y2, x3, y3);
        },

        arc: function (cx, cy, r, startAngle, endAngle, anticlockwise) {
            endAngle = (anticlockwise ? -1 : 1) * endAngle;

            var x0 = Math.cos(startAngle) * r + cx;
            var y0 = Math.sin(startAngle) * r + cy;

            var x1 = Math.cos(endAngle) * r + cx;
            var y1 = Math.sin(endAngle) * r + cy;

            if (this._x === null) {
                this.moveTo(x0, y0);
            }

            var zr = this.zr;
            var self = this;

            this._steps.push(function (cb) {
                var arc = new Arc({
                    style: {
                        color: 'white',
                        x: cx,
                        y: cy,
                        r: r,
                        startAngle: startAngle,
                        endAngle: startAngle,
                        anticlockwise: anticlockwise,
                        lineWidth: 2
                    }
                });
                zr.addShape(arc);

                zr.animate(arc, 'style')
                    .when(200, {
                        endAngle: endAngle
                    })
                    .done(function () {
                        self._pointCircle(x1, y1, cb);
                    })
                    .start();
            });

            this._x = x1;
            this._y = y1;

            this._pathProxy.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
        },

        stroke: function () {},

        fill: function () {
            var fillShape = this._fillShape;
            var zr = this.zr;
            fillShape.style.pathArray = this._pathProxy.pathCommands;
            var rect = this._pathProxy.fastBoundingRect();
            var height = rect.height;
            rect.height = 0;
            this._steps.push(function (cb) {
                zr.addShape(fillShape);
                fillShape.clipShape = new Rectangle({
                    style: rect
                });
                zr.animation.animate(fillShape.clipShape.style)
                    .when(2000, {
                        height: height
                    })
                    .during(function () {
                        zr.modShape(fillShape)
                    })
                    .done(cb)
                    .start();
            });
        },

        run: function (done) {
            var i = 0;

            var steps = this._steps;

            function step() {
                if (steps[i]) {
                    steps[i](step);
                    i++;
                }
                else {
                    done && done();
                }
            }

            step();
        },

        dispose: function () {
            this.zr.dispose();
        }
    }

    return AnimationPathContext;
});