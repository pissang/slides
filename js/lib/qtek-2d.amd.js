define('qtek-2d/qtek-2d.amd',[],function() {
    console.log('Loaded qtek 2d module');
});
define('qtek-2d', ['qtek-2d/qtek-2d.amd'], function (main) { return main; });

define('qtek-2d/CanvasRenderer',['require','qtek/core/Base'],function(require) {

    var Base = require('qtek/core/Base');

    var Renderer = Base.derive(function() {
        return {
            canvas : null,

            ctx : null,
            
            width : 0,
            
            height : 0,
            
        }
    }, function() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }

        if (this.width) {
            this.canvas.width = this.width;
        } else {
            this.width = this.canvas.width;
        }
        if (this.height) {
            this.canvas.height = this.height;
        } else {
            this.height = this.canvas.height;
        }

        this.ctx = this.canvas.getContext('2d');

        this.ctx.__GUID__ = this.__GUID__;
    }, {

        resize : function(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;

            this.width = width;
            this.height = height;
        },

        render : function(scene, camera) {
            if (this.clearColor) {
                this.ctx.fillStyle = this.clearColor;
                this.ctx.fillRect(0, 0, this.width, this.height);
            } else {
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
            if (camera) {
                var vm = camera.getViewMatrix()._array;
                this.ctx.transform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);   
            }
            scene.render(this.ctx);
        }
    });

    return Renderer;
});
/**
 * Adapter to CanvasGradient
 * base of linear gradient and radial gradient
 *
 * @export{class} Gradient
 */
define('qtek-2d/Gradient',['require','qtek/core/Base','qtek/math/Vector2','qtek/core/Cache'],function(require) {

    var Base = require('qtek/core/Base');
    var Vector2 = require("qtek/math/Vector2");
    var Cache = require("qtek/core/Cache");

    var Gradient = Base.derive(function(){
        return {
            stops : []
        }
    }, function() {
        this.cache = new Cache();
    }, {
        addColorStop : function(offset, color){
            this.stops.push([offset, color]);
            this.dirty();
        },
        removeAt : function(idx){
            this.stops.splice(idx, 1);
            this.dirty();
        },
        dirty : function(){
            for (var contextId in this.cache._caches){
                this.cache._caches[contextId]['dirty'] = true;
            }
        },
        getInstance : function(ctx){
            this.cache.use(ctx.__GUID__);
            if (this.cache.get("dirty") ||
                this.cache.miss("gradient")) {
                this.update(ctx);
            }
            return this.cache.get("gradient");
        },
        update : function(ctx){}
    });

    return Gradient;
});
/**
 * Adapter to CanvasLinearGradient
 *
 * @export{class} LinearGradient
 */
define('qtek-2d/LinearGradient',['require','./Gradient','qtek/math/Vector2'],function(require) {

    var Gradient = require('./Gradient');
    var Vector2 = require("qtek/math/Vector2");

    var LinearGradient = Gradient.derive(function(){
        return {
            start : new Vector2(),
            end : new Vector2(100, 0)
        }
    }, {
        update : function(ctx){
            var gradient = ctx.createLinearGradient(this.start.x, this.start.y, this.end.x, this.end.y);
            for (var i = 0; i < this.stops.length; i++) {
                var stop = this.stops[i];
                gradient.addColorStop(stop[0], stop[1]);
            }
            this.cache.put('gradient', gradient);
        }
    });

    return LinearGradient;
});
/**
 * Style
 * @config  fillStyle | fill,
 * @config  strokeStyle | stroke,
 * @config  lineWidth,
 * @config  lineCap,
 * @config  lineJoin,
 * @config  lineDash,
 * @config  lineDashOffset,
 * @config  miterLimit,
 * @config  shadowColor,
 * @config  shadowOffsetX,
 * @config  shadowOffsetY,
 * @config  shadowBlur,
 * @config  globalAlpha | alpha,
 * @config  globalCompositeOperation,
 * @config  alpha,
 * @config  shadow
 */
define('qtek-2d/Style',['require','qtek/core/Base'],function(require) {
    
    var Base = require('qtek/core/Base');

    var shadowSyntaxRegex = /([0-9\-]+)\s+([0-9\-]+)\s+([0-9]+)\s+(.+)/;
    
    var Style = Base.derive({}, {

        bind : function(ctx) {
            // Alias
            var fillStyle = this.fillStyle || this.fill;
            var strokeStyle = this.strokeStyle || this.stroke;
            var globalAlpha = this.globalAlpha || this.alpha;
            var globalCompositeOperation = this.globalCompositeOperation || this.composite;
            // parse shadow string
            if (this.shadow) {
                var res = shadowSyntaxRegex.exec(trim(this.shadow));
                if (res) {
                    var shadowOffsetX = parseInt(res[1]);
                    var shadowOffsetY = parseInt(res[2]);
                    var shadowBlur = res[3];
                    var shadowColor = res[4];
                }
            }
            shadowOffsetX = this.shadowOffsetX || shadowOffsetX;
            shadowOffsetY = this.shadowOffsetY || shadowOffsetY;
            shadowBlur = this.shadowBlur || shadowBlur;
            shadowColor = this.shadowColor || shadowColor;

            (globalAlpha !== undefined) &&
                (ctx.globalAlpha = globalAlpha);
            globalCompositeOperation &&
                (ctx.globalCompositeOperation = globalCompositeOperation);
            (this.lineWidth !== undefined) &&
                (ctx.lineWidth = this.lineWidth);
            (this.lineCap !== undefined) && 
                (ctx.lineCap = this.lineCap);
            (this.lineJoin !== undefined) &&
                (ctx.lineJoin = this.lineJoin);
            (this.miterLimit !== undefined) &&
                (ctx.miterLimit = this.miterLimit);
            (shadowOffsetX !== undefined) &&
                (ctx.shadowOffsetX = shadowOffsetX);
            (shadowOffsetY !== undefined) &&
                (ctx.shadowOffsetY = shadowOffsetY);
            (shadowBlur !== undefined) &&
                (ctx.shadowBlur = shadowBlur);
            (shadowColor !== undefined) &&
                (ctx.shadowColor = shadowColor);
            this.font &&
                (ctx.font = this.font);
            this.textAlign &&
                (ctx.textAlign = this.textAlign);
            this.textBaseline &&
                (ctx.textBaseline = this.textBaseline);

            if (fillStyle) {
                // Fill style is gradient or pattern
                if (fillStyle.getInstance) {
                    ctx.fillStyle = fillStyle.getInstance(ctx);
                } else {
                    ctx.fillStyle = fillStyle;
                }
            }
            if (strokeStyle) {
                // Stroke style is gradient or pattern
                if (strokeStyle.getInstance) {
                    ctx.strokeStyle = strokeStyle.getInstance(ctx);
                } else {
                    ctx.strokeStyle = strokeStyle;
                }
            }
            // Set line dash individually
            if (this.lineDash) {
                if (ctx.setLineDash) {
                    ctx.setLineDash(this.lineDash);
                    if (typeof(this.lineDashOffset) === 'number') {
                        ctx.lineDashOffset = this.lineDashOffset;
                    }
                } else {
                    console.warn("Browser does not support setLineDash method");
                }
            }
        }
    })

    function trim(str) {
        return (str || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
    }

    return Style;
});
/**
 * Node of the scene tree
 * And it is the base class of all elements
 */
define('qtek-2d/Node',['require','qtek/core/Base','qtek/core/util','qtek/math/Vector2','qtek/math/Matrix2d','./Style','glmatrix'],function(require) {
    
    var Base = require("qtek/core/Base");
    var util = require("qtek/core/util");
    var Vector2 = require("qtek/math/Vector2");
    var Matrix2d = require("qtek/math/Matrix2d");
    var Style = require("./Style");

    var glMatrix = require('glmatrix');
    var mat2d = glMatrix.mat2d;
    var vec2 = glMatrix.vec2;

    var Node = Base.derive(function() {
        return {
            
            name : '',
            
            //Axis Aligned Bounding Box
            boundingBox : {
                min : new Vector2(),
                max : new Vector2()
            },
            // z index
            z : 0,
            
            style : null,
            
            position : new Vector2(0, 0),
            rotation : 0,
            scale : new Vector2(1, 1),

            autoUpdate : true,
            transform : new Matrix2d(),
            // inverse matrix of transform matrix
            transformInverse : new Matrix2d(),
            _prevRotation : 0,

            // visible flag
            visible : true,

            _children : [],
            // virtual width of the stroke line for intersect
            intersectLineWidth : 0,

            // Clip flag
            // If it is true, this element can be used as a mask
            // and all the children will be clipped in its shape
            //
            // TODO: add an other mask flag to distinguish with the clip?
            clip : false,

            // flag of fill when drawing the element
            fill : true,
            // flag of stroke when drawing the element
            stroke : false,
            // Enable picking
            enablePicking : true
        }
    }, {
        updateTransform : function() {
            var m2d = this.transform._array;
            if (! this.autoUpdate) {
                return;
            }
            if (! this.scale._dirty &&
                ! this.position._dirty &&
                this.rotation === this._prevRotation) {
                return;
            }
            mat2d.identity(m2d, m2d)
            mat2d.scale(m2d, m2d, this.scale._array);
            mat2d.rotate(m2d, m2d, this.rotation);
            mat2d.translate(m2d, m2d, this.position._array);

            this._prevRotation = this.rotation;
            this.scale._dirty = false;
            this.position._dirty = false;
        },
        updateTransformInverse : function() {
            mat2d.invert(this.transformInverse._array, this.transform._array);
        },
        // intersect with the bounding box
        intersectBoundingBox : function(x, y) {
            var boundingBox = this.boundingBox;
            return  (boundingBox.min.x < x && x < boundingBox.max.x) && (boundingBox.min.y < y && y< boundingBox.max.y);
        },
        add : function(elem) {
            if (elem) {
                this._children.push(elem);
                if (elem.parent) {
                    elem.parent.remove(elem);
                }
                elem.parent = this;
            }
        },
        remove : function(elem) {
            if (elem) {
                this._children.splice(this._children.indexOf(elem), 1);
                elem.parent = null;
            }
        },
        children : function() {
            // get a copy of children
            return this._children.slice();
        },
        childAt : function(idx) {
            return this._children[idx];
        },
        draw : null,

        render : function(context) {
            
            this.trigger("beforerender", context);

            var renderQueue = this.getSortedRenderQueue();
            if (this.style) {
                if (!this.style instanceof Array) {
                    for (var i = 0; i < this.style.length; i++) {
                        this.style[i].bind(context);
                    }
                } else if(this.style.bind) {
                    this.style.bind(context);
                }
            }
            // TODO : some style should not be inherited ?
            context.save();
            this.updateTransform();
            var m = this.transform._array;
            context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);

            if (this.draw) {
                this.draw(context);
            }

            //clip from current path;
            this.clip && context.clip();

            for (var i = 0; i < renderQueue.length; i++) {
                renderQueue[i].render(context);
            }
            context.restore();

            this.trigger("afterrender", context);
        },

        traverse : function(callback) {
            callback && callback(this);
            var children = this._children;
            for (var i = 0, len = children.length; i < len; i++) {
                children[i].traverse(callback);
            }
        },

        intersect : function(x, y, eventName) {},

        // Get transformed bounding rect
        // getBoundingRect : function() {
        //     return {
        //         left : null,
        //         top : null,
        //         width : null,
        //         height : null
        //     }
        // },

        getSortedRenderQueue : function() {
            var renderQueue = this._children.slice();
            renderQueue.sort(_zSortFunction);
            return renderQueue; 
        }
    });

    function _zSortFunction(x, y) {
        if (x.z === y.z)
            return x.__GUID__ > y.__GUID__ ? 1 : -1;
        return x.z > y.z ? 1 : -1 ;
    }

    return Node;
});
/**
 * Adapter to CanvasPattern
 *
 * @export{class} Pattern
 */
define('qtek-2d/Pattern',['require','qtek/core/Base','qtek/math/Vector2','qtek/core/Cache'],function(require) {

    var Base = require('qtek/core/Base');
    var Vector2 = require("qtek/math/Vector2");
    var Cache = require("qtek/core/Cache");

    var Pattern = Base.derive(function(){
        return {
            image : null,
            // 'repeat', 'repeat-x', 'repeat-y', 'no-repeat'
            repetition : 'repeat'
        }
    }, function() {
        this.cache = new Cache();
    }, {
        getInstance : function(ctx){
            this.cache.use(ctx.__GUID__);
            if (this.cache.get("dirty") ||
                this.cache.miss("pattern")) {
                var pattern = ctx.createPattern(this.image, this.repetition);
                this.cache.put("pattern", pattern);
                return pattern;
            }
            return this.cache.get("pattern");
        },
    });

    return Pattern;
});
/**
 * Adapter to CanvasRadialGradient
 *
 * @export{class} RadialGradient
 */
define('qtek-2d/RadialGradient',['require','./Gradient','qtek/math/Vector2'],function(require) {

    var Gradient = require('./Gradient');
    var Vector2 = require("qtek/math/Vector2");

    var RadialGradient = Gradient.derive(function(){
        return {
            start : new Vector2(),
            startRadius : 0,
            end : new Vector2(),
            endRadius : 0
        }
    }, {
        update : function(ctx){
            var gradient = ctx.createRadialGradient(this.start.x, this.start.y, this.startRadius, this.end.x, this.end.y, this.endRadius);
            for (var i = 0; i < this.stops.length; i++) {
                var stop = this.stops[i];
                gradient.addColorStop(stop[0], stop[1]);
            }
            this.cache.put('gradient', gradient);
        }
    });

    return RadialGradient;
});
define('qtek-2d/context/tool/math',[],function() {

    var mathTool = {

        area : function(points) {
            // Signed polygon area
            var n = points.length / 2;
            if (n < 3) {
                return 0;
            }
            var area = 0;
            for (var i = (n - 1) * 2, j = 0; j < n * 2;) {
                var x0 = points[i];
                var y0 = points[i + 1];
                var x1 = points[j];
                var y1 = points[j + 1];
                i = j;
                j += 2;
                area += x0 * y1 - x1 * y0;
            }

            return area;
        },

        isCCW : function(points) {
            return this.area(points) < 0;
        },

        triangleArea : function(x0, y0, x1, y1, x2, y2) {
            return (x1 - x0) * (y2 - y1) - (y1 - y0) * (x2 - x1);
        },

        isTriangleConvex : function(x0, y0, x1, y1, x2, y2) {
            // Cross product edge 01 and edge 12
            return (x1 - x0) * (y2 - y1) - (y1 - y0) * (x2 - x1) < 0;
        },

        isPointInTriangle : function(x0, y0, x1, y1, x2, y2, xi, yi) {
            return !(mathTool.triangleArea(x0, y0, x2, y2, xi, yi) <= 0
                || mathTool.triangleArea(x0, y0, xi, yi, x1, y1) <= 0
                || mathTool.triangleArea(xi, yi, x2, y2, x1, y1) <= 0);
        },

        // PENDING
        approxEqualInt : function(a, b) {
            return Math.abs(a - b) < 0.1;
        },

        approxEqual : function(a, b) {
            return Math.abs(a - b) < 1e-5;
        },

        reverse : function(points, n, stride) {
            for (var i = 0; i < Math.floor(n / 2); i++) {
                for (var j = 0; j < stride; j++) {
                    var a = i * stride + j;
                    var b = (n - i - 1) * stride + j;
                    var tmp = points[a];
                    points[a] = points[b];
                    points[b] = tmp;
                }
            }

            return points;
        }
    }

    return mathTool;
});
// Convex hull intersection using GJK algorithm
// http://physics2d.com/content/gjk-algorithm
// http://mollyrocket.com/849
define('qtek-2d/context/tool/GJK',['require','./math'],function(require) {

    var mathUtil = require('./math');

    var GJK = function() {

        // Direction
        this._D = [0, 0];

        // Farthest point on the direction
        // In Minkowski Difference space
        this._S = [0, 0];
    }

    GJK.prototype.intersect = function(ch0, ch1) {

        var D = this._D;
        var S = this._S;

        // Random pick a direction
        D[0] = ch0[0] - ch1[0];
        D[1] = ch0[1] - ch1[1];
        this._support(ch0, ch1, D, S);
        D[0] = -S[0];
        D[1] = -S[1];

        var simplex = S.slice();

        while (true) {
            // PENDING
            this._support(ch0, ch1, D, S);
            if (D[0] * S[0] + D[1] * S[1] <= 0) {
                return false;
            }
            simplex.push(S[0]);
            simplex.push(S[1]);

            var isIntersect = this._updateSimplex(simplex, D);
            if (isIntersect) {
                return true;
            }
        }
    }


    var ac = [0, 0];
    var ab = [0, 0];
    // Update simplex and direction
    GJK.prototype._updateSimplex = function(simplex, D) {
        var n = simplex.length / 2;
        switch(n) {
            // Simplex 1
            case 2:
                var ax = simplex[2];
                var ay = simplex[3];
                var bx = simplex[0];
                var by = simplex[1];
                // Vector ab
                ab[0] = bx - ax;
                ab[1] = by - ay;

                if (ab[0] * -ax + ab[1] * -ay < 0) {
                    // Remove point b
                    simplex.shift();
                    simplex.shift();

                    D[0] = -ax;
                    D[1] = -ay;
                } else {
                    if (-ab[1] * -ax + ab[0] * -ay > 0) {
                        D[0] = -ab[1];
                        D[1] = ab[0];
                    } else {
                        D[0] = ab[1];
                        D[1] = -ab[0];
                    }
                }
                break;
            // Simplex 2
            case 3:
                var ax = simplex[4], ay = simplex[5];
                var bx = simplex[2], by = simplex[3];
                var cx = simplex[0], cy = simplex[1];

                if (!mathUtil.isTriangleConvex(ax, ay, cx, cy, bx, by)) {
                    // swap b, c
                    bx = simplex[0]; by = simplex[1];
                    cx = simplex[2]; cy = simplex[3];
                }

                ac[0] = cx - ax; ac[1] = cy - ay;
                ab[0] = bx - ax; ab[1] = by - ay;
                // if 0 is on the right side of ac
                if (!mathUtil.isTriangleConvex(0, 0, ax, ay, cx, cy)) {
                    // if O is ahead of the point a on the line ac
                    if (-ax * ac[0] + -ay * ac[1] > 0) {
                        simplex.length = 4;
                        simplex[0] = cx; simplex[1] = cy;
                        simplex[2] = ax; simplex[3] = ay;
                        if (-ac[1] * -ax + ac[0] * -ay > 0) {
                            D[0] = -ac[1];
                            D[1] = ac[0];
                        } else {
                            D[0] = ac[1];
                            D[1] = -ac[0];
                        }
                    }
                    // O is behind a on the line ac
                    else {
                        simplex.length = 2;
                        simplex[0] = ax; simplex[1] = ay;

                        D[0] = -ax;
                        D[1] = -ay;
                    }
                }
                //if O is to the left of ab
                else if (mathUtil.isTriangleConvex(0, 0, ax, ay, bx, by)) {
                    if (ab[0] * -ax + ab[1] * -ay > 0) {
                        simplex.length = 4;
                        simplex[0] = bx; simplex[1] = by;
                        simplex[2] = ax; simplex[3] = ay;
                        if (-ab[1] * -ax + ab[0] * -ay > 0) {
                            D[0] = -ab[1];
                            D[1] = ab[0];
                        } else {
                            D[0] = ab[1];
                            D[1] = -ab[0];
                        }
                    } else {
                        simplex.length = 2;
                        simplex[0] = ax; simplex[1] = ay;

                        D[0] = -ax;
                        D[1] = -ay;
                    }
                }
                // Intersect
                else {
                    return true;
                }
                break;
        }
    }
    
    // Support mapping in Minkowski Difference
    // ch1 - ch0
    GJK.prototype._support = function(ch0, ch1, D, out) {
        var max = -Infinity;

        var x0, y0, x1, y1;
        for (var i = 0; i < ch0.length;) {
            var x = ch0[i++];
            var y = ch0[i++];
            var projDist = x * -D[0] + y * -D[1];
            if (projDist > max) {
                max = projDist;
                x0 = x;
                y0 = y;
            }
        }

        max = -Infinity;
        for (i = 0; i < ch1.length;) {
            x = ch1[i++];
            y = ch1[i++];
            projDist = x * D[0] + y * D[1];
            if (projDist > max) {
                max = projDist;
                x1 = x;
                y1 = y;
            }
        }

        out[0] = x1 - x0;
        out[1] = y1 - y0;

        return out;
    }

    return GJK;
});
define('qtek-2d/context/BezierCurveSegment',['require','./tool/math','glmatrix','./tool/GJK'],function(require) {

    var mathTool = require('./tool/math');
    var glMatrix = require('glmatrix');
    var vec3 = glMatrix.vec3;
    var vec2 = glMatrix.vec2;
    var mat4 = glMatrix.mat4;

    var epsilon = 5e-5;

    var GJKContext = require('./tool/GJK');

    var GJK = new GJKContext();


    var roundToZero = function(val) {
        if (val < epsilon && val > -epsilon) {
            return 0;
        }
        return val;
    }

    var BezierCurveSegment = function(x0, y0, x1, y1, x2, y2, x3, y3) {

        this.type = BezierCurveSegment.type;
        
        this.points = [x0, y0, x1, y1, x2, y2, x3, y3];

        this.thickness = 0;

        this.coords = [];

        // Two sub curves after subdivision
        this.subCurveA = null;

        this.subCurveB = null;

        this.subdivisionLevel = 0;

        this.triangles = [];
    }

    // Number of segments of bezier curve stroking
    BezierCurveSegment.prototype.strokeSteps = 0;

    // Precalculated parameters for incremental interpolation
    // http://antigrain.com/research/bezier_interpolation/index.html#PAGE_BEZIER_INTERPOLATION
    BezierCurveSegment.prototype.fx = 0;
    BezierCurveSegment.prototype.fy = 0;
    BezierCurveSegment.prototype.dfx = 0;
    BezierCurveSegment.prototype.dfy = 0;
    BezierCurveSegment.prototype.ddfx = 0;
    BezierCurveSegment.prototype.ddfy = 0;
    BezierCurveSegment.prototype.dddfx = 0;
    BezierCurveSegment.prototype.dddfy = 0;

    BezierCurveSegment.prototype.updateStrokeSegments = function(sx, sy) {
        var cps = this.points;
        var x0 = cps[0];
        var y0 = cps[1];
        var x1 = cps[2];
        var y1 = cps[3];
        var x2 = cps[4];
        var y2 = cps[5];
        var x3 = cps[6];
        var y3 = cps[7];

        var dx0 = (x1 - x0) * sx;
        var dy0 = (y1 - y0) * sy;
        var dx1 = (x2 - x1) * sx;
        var dy1 = (y2 - y1) * sy;
        var dx2 = (x3 - x2) * sx;
        var dy2 = (y3 - y2) * sy;

        var len = Math.sqrt(dx0 * dx0 + dy0 * dy0) + Math.sqrt(dx1 * dx1 + dy1 * dy1) + Math.sqrt(dx2 * dx2 + dy2 * dy2);

        // PENDING
        // Reduce steps ?
        this.strokeSteps = Math.ceil(len * 0.25);
        var step = 1.0 / (this.strokeSteps + 1.0);
        var step2 = step * step;
        var step3 = step2 * step;

        var pre1 = 3.0 * step;
        var pre2 = 3.0 * step2;
        var pre4 = 6.0 * step2;
        var pre5 = 6.0 * step3;

        var tmp1x = x0 - x1 * 2.0 + x2;
        var tmp1y = y0 - y1 * 2.0 + y2;

        var tmp2x = (x1 - x2) * 3.0 - x0 + x3;
        var tmp2y = (y1 - y2) * 3.0 - y0 + y3;

        this.fx = cps[0];
        this.fy = cps[1];

        this.dfx = (x1 - x0) * pre1 + tmp1x * pre2 + tmp2x * step3;
        this.dfy = (y1 - y0) * pre1 + tmp1y * pre2 + tmp2y * step3;

        this.ddfx = tmp1x * pre4 + tmp2x * pre5;
        this.ddfy = tmp1y * pre4 + tmp2y * pre5;

        this.dddfx = tmp2x * pre5;
        this.dddfy = tmp2y * pre5;
    }

    BezierCurveSegment.prototype.reverse = function() {
        mathTool.reverse(this.points, 4, 2);
        if (this.coords.length === 12) {
            mathTool.reverse(this.coords, 4, 3);
        }
        for (var i = 0; i < this.triangles.length; i++) {
            this.triangles[i] = 4 - this.triangles[i];
        }

        var cps = this.points;
        this.fx = cps[0];
        this.fy = cps[1];

        this.dfx = -this.dfx;
        this.dfy = -this.dfy;

        this.ddfx = -this.ddfx;
        this.ddfy = -this.ddfy;

        this.dddfx = -this.dddfx;
        this.dddfy = -this.dddfy;
    }

    BezierCurveSegment.prototype.subdivide = function(p) {

        var cps = this.points;
        var x0 = cps[0];
        var y0 = cps[1];
        var x1 = cps[2];
        var y1 = cps[3];
        var x2 = cps[4];
        var y2 = cps[5];
        var x3 = cps[6];
        var y3 = cps[7];

        var x01 = (x1 - x0) * p + x0;
        var y01 = (y1 - y0) * p + y0;

        var x12 = (x2 - x1) * p + x1;
        var y12 = (y2 - y1) * p + y1;

        var x23 = (x3 - x2) * p + x2;
        var y23 = (y3 - y2) * p + y2;

        var x012 = (x12 - x01) * p + x01;
        var y012 = (y12 - y01) * p + y01;

        var x123 = (x23 - x12) * p + x12;
        var y123 = (y23 - y12) * p + y12;

        var x0123 = (x123 - x012) * p + x012;
        var y0123 = (y123 - y012) * p + y012;

        var subCurveA = new BezierCurveSegment(x0, y0, x01, y01, x012, y012, x0123, y0123);
        var subCurveB = new BezierCurveSegment(x0123, y0123, x123, y123, x23, y23, x3, y3);

        subCurveA.subdivisionLevel = this.subdivisionLevel + 1;
        subCurveB.subdivisionLevel = this.subdivisionLevel + 1;

        this.subCurveA = subCurveA;
        this.subCurveB = subCurveB;
    }

    BezierCurveSegment.prototype.intersectCurve = function(curve) {
        if (this.subCurveA) {
            if (curve.subCurveA) {
                return this.subCurveA.intersectCurve(curve.subCurveA)
                    || this.subCurveA.intersectCurve(curve.subCurveB)
                    || this.subCurveB.intersectCurve(curve.subCurveA)
                    || this.subCurveB.intersectCurve(curve.subCurveB);
            } else {
                return this.subCurveA.intersectCurve(curve)
                    || this.subCurveB.intersectCurve(curve);
            }
        } else {
            return GJK.intersect(this.points, curve.points);
        }
    }

    BezierCurveSegment.prototype.updateTriangles = function() {
        var triangles = this._getTriangles();
        for (var i = 0; i < triangles.length; i++) {
            this.triangles[i] = triangles[i];
        }
        this.triangles.length = triangles.length;
    }

    // Procedure texture coords klm for cubic bezier curve drawing
    // http://http.developer.nvidia.com/GPUGems3/gpugems3_ch25.html
    // http://www.opensource.apple.com/source/WebCore/WebCore-1298.39/platform/graphics/gpu/LoopBlinnTextureCoords.cpp
    BezierCurveSegment.prototype.updateTextureCoords = (function() {
        // Homogeneous coords
        var b0 = vec3.fromValues(0, 0, 1);
        var b1 = vec3.fromValues(0, 0, 1);
        var b2 = vec3.fromValues(0, 0, 1);
        var b3 = vec3.fromValues(0, 0, 1);
        var tmpv3 = vec3.create();

        var a1, a2, a3, d1, d2, d3,
            ls, lt, ms, mt,
            ql, qm,
            tmp, discr,
            lt_ls, mt_ms,
            sign, k1,
            len;
        var oneThird = 1 / 3;
        var subdivision = -1;

        return function(force) {
            var coords = this.coords;
            var cps = this.points;
            var x0 = cps[0];
            var y0 = cps[1];
            var x1 = cps[2];
            var y1 = cps[3];
            var x2 = cps[4];
            var y2 = cps[5];
            var x3 = cps[6];
            var y3 = cps[7];

            vec2.set(b0, x0, y0);
            vec2.set(b1, x1, y1);
            vec2.set(b2, x2, y2);
            vec2.set(b3, x3, y3);

            // Discriminant
            vec3.cross(tmpv3, b3, b2);
            a1 = vec3.dot(b0, tmpv3);
            vec3.cross(tmpv3, b0, b3);
            a2 = vec3.dot(b1, tmpv3);
            vec3.cross(tmpv3, b1, b0);
            a3 = vec3.dot(b2, tmpv3);

            d1 = a1 - 2 * a2 + 3 * a3;
            d2 = -a2 + 3 * a3;
            d3 = 3 * a3;

            d1 = roundToZero(d1);
            d2 = roundToZero(d2);
            d3 = roundToZero(d3);

            sign = 1;
            // Is a line
            if (d1 == 0 && d2 == 0 && d3 == 0) {
                return;
            }
            // Is quadratic
            else if (d1 == 0 && d2 == 0) {
                sign = d3 < 0 ? -sign : sign;
                // cp0
                coords[0] = coords[1] = coords[2] = 0;
                // cp1
                coords[3] = oneThird * sign;
                coords[4] = 0;
                coords[5] = oneThird;
                // cp2
                coords[6] = 2 / 3 * sign;
                coords[7] = oneThird * sign;
                coords[8] = oneThird;
                // cp3
                coords[9] = coords[10] = sign;
                coords[11] = 1;

            } else {
                
                discr = 3 * d2 * d2 - 4 * d1 * d3;
                discr = roundToZero(discr);

                if (discr == 0 && d1 == 0) { // Cusp
                    ls = d3;
                    lt = 3 * d2;

                    lt_ls = lt - ls;

                     // cp0
                    coords[0] = ls;
                    coords[1] = ls * ls * ls;
                    coords[2] = 1.0;
                    // cp1
                    coords[3] = ls - oneThird * lt;
                    coords[4] = ls * ls * -lt_ls;
                    coords[5] = 1.0;
                    // cp2
                    coords[6] = ls - 2 * oneThird * lt;
                    coords[7] = lt_ls * lt_ls * ls;
                    coords[8] = 1.0;
                    // cp3
                    coords[9] = -lt_ls;
                    coords[10] = - lt_ls * lt_ls * lt_ls;
                    coords[11] = 1.0;

                } else if (discr >= 0) {   //Serpentine

                    tmp = Math.sqrt(discr * 3);
                    ls = 3 * d2 - tmp;
                    lt = 6 * d1;
                    ms = 3 * d2 + tmp;
                    mt = lt;

                    // Normalize
                    len = Math.sqrt(ls * ls + lt * lt);
                    ls /= len;
                    lt /= len;
                    len = Math.sqrt(ms * ms + mt * mt);
                    ms /= len;
                    mt /= len;

                    lt_ls = lt - ls;
                    mt_ms = mt - ms;

                    sign = d1 < 0 ? -sign : sign;
                    // cp0
                    coords[0] = ls * ms * sign;
                    coords[1] = ls * ls * ls * sign;
                    coords[2] = ms * ms * ms;
                    // cp1
                    coords[3] = oneThird * (3 * ls * ms -  ls * mt - lt * ms) * sign;
                    coords[4] = ls * ls * -lt_ls * sign;
                    coords[5] = ms * ms * -mt_ms;
                    // cp2
                    coords[6] = oneThird * (lt * (mt - 2 * ms) + ls * (3 * ms - 2 * mt)) * sign;
                    coords[7] = lt_ls * lt_ls * ls * sign;
                    coords[8] = mt_ms * mt_ms * ms;
                    // cp3
                    coords[9] = lt_ls * mt_ms * sign;
                    coords[10] = - lt_ls * lt_ls * lt_ls * sign;
                    coords[11] = - mt_ms * mt_ms * mt_ms;

                } else {    // Loop
                    tmp = Math.sqrt(-discr);
                    ls = d2 - tmp;
                    lt = 2 * d1;
                    ms = d2 + tmp;
                    mt = lt;

                    // Normalize
                    len = Math.sqrt(ls * ls + lt * lt);
                    ls /= len;
                    lt /= len;
                    len = Math.sqrt(ms * ms + mt * mt);
                    ms /= len;
                    mt /= len;

                    // Figure coords whether there is a rendering artifact requiring
                    // the curve to be subdivided by the caller.
                    ql = ls / lt;
                    qm = ms / mt;

                    if (ql > 0.0 && ql < 1.0) {
                        subdivision = ql;
                    } else if (qm > 0.0 && qm < 1.0) {
                        subdivision = qm;
                    } else {
                        subdivision = -1;
                    }
                    
                    // Use force to make sure only recursive once, dirty trick
                    // Because of numerical error
                    // http://stackoverflow.com/questions/20970673/how-to-solve-rendering-artifact-in-blinn-loops-resolution-independent-curve-ren
                    if (subdivision < 0 || force) {
                        lt_ls = lt - ls;
                        mt_ms = mt - ms;

                        k1 = roundToZero(ls * ms);
                        sign = (d1 > 0 && k1 < 0) || (d1 < 0 && k1 > 0) ? -sign : sign;

                        // cp0
                        coords[0] = k1 * sign;
                        coords[1] = ls * ls * ms * sign;
                        coords[2] = ls * ms * ms;
                        // cp1
                        coords[3] = oneThird * (-ls * mt - lt * ms + 3 * ls * ms) * sign;
                        coords[4] = - oneThird * ls * (ls * (mt - 3 * ms) + 2 * lt * ms) * sign;
                        coords[5] = - oneThird * ms * (ls * (2 * mt - 3 * ms) + lt * ms);
                        // cp2
                        coords[6] = oneThird * (lt * (mt - 2 * ms) + ls * (3 * ms - 2 * mt)) * sign;
                        coords[7] = oneThird * lt_ls * (ls * (2 * mt -  3 * ms) + lt * ms) * sign;
                        coords[8] = oneThird * mt_ms * (ls * (mt - 3 * ms) + 2 * lt * ms);
                        // cp3
                        coords[9] = lt_ls * mt_ms * sign;
                        coords[10] = - lt_ls * lt_ls * mt_ms * sign;
                        coords[11] = - lt_ls * mt_ms * mt_ms;

                    } else { // Do subdivide

                        this.subdivide(subdivision);

                        this.subCurveA.updateTextureCoords(true);

                        this.subCurveB.updateTextureCoords(true);
                    }
                }
            }

            this.updateTriangles();
        }
    })()

    BezierCurveSegment.prototype._getTriangles = (function() {
        // Last two item is the type of triangle
        // 1 is convex and -1 is concave
        var triangles1 = [0, 1, 3, 0, 2, 3];
        var triangles2 = [1, 0, 3, 1, 2, 3];
        var triangles3 = [1, 0, 2, 1, 2, 3];
        var triangles4 = [0, 1, 3];
        var triangles5 = [0, 2, 3];
        return function() {
            var cps = this.points;
            var x0 = cps[0];
            var y0 = cps[1];
            var x1 = cps[2];
            var y1 = cps[3];
            var x2 = cps[4];
            var y2 = cps[5];
            var x3 = cps[6];
            var y3 = cps[7];

            var isConvex = mathTool.isTriangleConvex(x0, y0, x1, y1, x3, y3);
            if (isConvex != mathTool.isTriangleConvex(x0, y0, x2, y2, x3, y3)) {
                return triangles1;
            } else {
                if (mathTool.isTriangleConvex(x0, y0, x1, y1, x2, y2) ^ !isConvex) { // cp2 is on the left side of edge01(right side if concave)
                    // cp2 is in the triangle013
                    if (mathTool.isTriangleConvex(x2, y2, x1, y1, x3, y3) ^ !isConvex) {
                        return triangles4;
                    } else {
                        return triangles2;
                    }
                } else {   // cp2 is on the right side of edge01
                    // cp1 is in the triangle023
                    if (mathTool.isTriangleConvex(x1, y1, x2, y2, x3, y3) ^ !isConvex) {
                        return triangles5;
                    } else {
                        return triangles3;
                    }
                }
            }
        }
    })();

    BezierCurveSegment.type = 2;

    return BezierCurveSegment;
});
// Class of canvas elements
define('qtek-2d/context/CanvasElement',['require'],function(require) {

    var CanvasElement = function() {
    };

    var canvasElementMustImplementsMethods = ['hasFill', 'hasStroke', 'getHashKey', 'updateVertices', 'afterDraw'];
    var primitiveMustImplementsMethods = ['updateElements', 'addElement', 'clearElements'];

    CanvasElement._factories = [];
    var _factories = CanvasElement._factories;

    CanvasElement.register = function(elClass, primClass) {
        if (elClass && !CanvasElement._checkElementClass(elClass)) {
            return;
        }
        if (primClass && !CanvasElement._checkPrimitiveClass(primClass)) {
            return;
        }

        var eType = _factories.length;
        _factories.push({
            fElement : elClass,
            fPrimitive : primClass
        });

        return eType;
    }

    CanvasElement._checkElementClass = function(elClass) {
        var result = true;
        for (var i = 0; i < canvasElementMustImplementsMethods.length; i++) {
            var name = canvasElementMustImplementsMethods[i];
            if (typeof(elClass.prototype[name]) == 'undefined') {
                console.warn(name + ' method must be implemented in Element');
                result = false;
            }
        }
        return result;
    }

    CanvasElement._checkPrimitiveClass = function(primClass) {
        var result = true;
        for (var i = 0; i < primitiveMustImplementsMethods.length; i++) {
            var name = primitiveMustImplementsMethods[i];
            if (typeof(primClass.prototype[name]) == 'undefined') {
                console.warn(name + ' method must be implemented in Element');
                result = false;
            }
        }
        return result;
    }

    CanvasElement.setPrimitiveClass = function(eType, primClass) {
        if (!CanvasElement._checkPrimitiveClass(primClass)) {
            return;
        }
        var item = _factories[eType]
        if (item) {
            item.fPrimitive = primClass;
        }
    }
    
    CanvasElement.setElementClass = function(eType, elClass) {
        if (!CanvasElement._checkElementClass(elClass)) {
            return;
        }
        var item = _factories[eType]
        if (item) {
            item.fElement = elClass;
        }
    }

    CanvasElement.getPrimitiveClass = function(eType) {
        var item = _factories[eType];
        if (item) {
            return item.fPrimitive;
        }
    }

    CanvasElement.getElementClass = function(eType) {
        var item = _factories[eType];
        if (item) {
            return item.fElement;
        }
    }

    CanvasElement.createElement = function(eType) {
        var item = _factories[eType];
        if (item) {
            return new item.fElement();
        }
    }

    CanvasElement.createPrimitive = function(eType) {
        var item = _factories[eType];
        if (item) {
            return new item.fPrimitive();
        }
    }

    CanvasElement.getClassNumber = function() {
        return _factories.length;
    }

    return CanvasElement;
});
define('qtek-2d/context/CanvasImage',['require','qtek/texture/Texture2D','qtek/math/Matrix2d','./CanvasElement','glmatrix'],function(require) {

    var Texture2D = require('qtek/texture/Texture2D');
    var Matrix2d = require('qtek/math/Matrix2d');
    var CanvasElement = require('./CanvasElement');
    var glMatrix = require('glmatrix');
    var vec2 = glMatrix.vec2;

    var _textureCache = [];

    var CacheEntry = function(data) {
        this._data = data;
        this._ref = 0;
    }

    CacheEntry.prototype.reference = function() {
        this._ref++;
        return this._data;
    }

    CacheEntry.prototype.removeReference = function() {
        if (this._ref > 0) {
            this._ref--;
        }
        return this._ref == 0;   
    }

    CacheEntry.prototype.getData = function() {
        return this._data;
    }

    var quadTriangles = [0, 1, 2, 1, 3, 2];

    var CanvasImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
        
        // Element type
        this.eType = CanvasImage.eType;

        this.image = image;

        // Depth in z
        this.depth = 0;

        // WebGL Texture
        this._texture = CanvasImage.getTexture(image);

        this.transform = new Matrix2d();

        // Use two triangles to render image
        // 0-----2
        // |  /  |
        // 1-----3
        var iw = 1 / image.width;
        var ih = 1 / image.height;

        this.quadPositions = [
            vec2.fromValues(dx, dy),
            vec2.fromValues(dx, dy + dh),
            vec2.fromValues(dx + dw, dy),
            vec2.fromValues(dx + dw, dy + dh)
        ];
        this.quadTexcoords = [
            vec2.fromValues(sx * iw, sy * ih),
            vec2.fromValues(sx * iw, (sy + sh) * ih),
            vec2.fromValues((sx + sw) * iw, sy * ih),
            vec2.fromValues((sx + sw) * iw, (sy + sh) * ih)
        ];

        this._verticesData = null;
    }

    CanvasImage.prototype = {

        constructor : CanvasImage,

        begin : function(){},

        end : function(ctx) {
            Matrix2d.copy(this.transform, ctx.currentTransform);

            this.updateVertices();
        },

        getTexture : function() {
            return this._texture;
        },

        hasFill : function() {
            return true;
        },

        hasStroke : function() {
            return false;
        },

        dispose : function(ctx) {
            CanvasImage.disposeImage(this.image, ctx.renderer.gl);   
        },

        getHashKey : function() {
            return this.eType + '_' + this.image.__IID__ ;
        },

        updateVertices : function() {

            if (!this._verticesData) {
                this._verticesData = {
                    position : new Float32Array(18),
                    texcoord : new Float32Array(12)
                }
            }

            var positionArr = this._verticesData.position;
            var texcoordArr = this._verticesData.texcoord;

            var z = this.depth;

            var offset3 = 0;
            var offset2 = 0;
            for (var k = 0; k < 6; k++) {
                var idx = quadTriangles[k];
                // Set position
                positionArr[offset3] = this.quadPositions[idx][0];
                positionArr[offset3 + 1] = this.quadPositions[idx][1];
                positionArr[offset3 + 2] = z;
                // Set texcoord
                texcoordArr[offset2] = this.quadTexcoords[idx][0];
                texcoordArr[offset2 + 1] = this.quadTexcoords[idx][1];
                
                offset3 += 3;
                offset2 += 2;
            }
        },

        getVertices : function() {
            return this._verticesData;
        },

        afterDraw : function() {

        },

        clone : function() {
            
        }
    }

    // Static methods
    CanvasImage.getTexture = function(image) {
        if (
            typeof(image.__IID__) == 'undefined'
            || typeof(_textureCache[image.__IID__]) == 'undefined'
        ) {
            var id = _textureCache.length;
            var texture = new Texture2D();
            texture.image = image;
            texture.flipY = false;
            image.__IID__ = id;

            _textureCache.push(new CacheEntry(texture));
        }

        return _textureCache[image.__IID__].reference();
    }

    CanvasImage.disposeImage = function(image, _gl) {
        if (!image.__IID__) {
            var id = image.__IID__;
            var entry = _textureCache[id];
            if (entry) {
                var isEmpty = entry.removeReference();

                if (isEmpty) {
                    entry.getData().dispose(_gl);

                    // Pop the last entry and put it in the removed position
                    var lastEntry = _textureCache[_textureCache.length - 1];
                    _textureCache[id] = lastEntry;
                    _textureCache.pop();
                    image.__IID__ = id; 
                }
            }
        }
    }

    CanvasImage.eType = CanvasElement.register(CanvasImage, null, null);

    return CanvasImage;
});
// (c) Dean McNamee <dean@gmail.com>, 2012.
//
// https://github.com/deanm/css-color-parser-js
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

define('qtek-2d/context/tool/color',[],function() {
    // http://www.w3.org/TR/css3-color/
    var kCSSColorTable = {
        "transparent": [0,0,0,0], "aliceblue": [240,248,255,1],
        "antiquewhite": [250,235,215,1], "aqua": [0,255,255,1],
        "aquamarine": [127,255,212,1], "azure": [240,255,255,1],
        "beige": [245,245,220,1], "bisque": [255,228,196,1],
        "black": [0,0,0,1], "blanchedalmond": [255,235,205,1],
        "blue": [0,0,255,1], "blueviolet": [138,43,226,1],
        "brown": [165,42,42,1], "burlywood": [222,184,135,1],
        "cadetblue": [95,158,160,1], "chartreuse": [127,255,0,1],
        "chocolate": [210,105,30,1], "coral": [255,127,80,1],
        "cornflowerblue": [100,149,237,1], "cornsilk": [255,248,220,1],
        "crimson": [220,20,60,1], "cyan": [0,255,255,1],
        "darkblue": [0,0,139,1], "darkcyan": [0,139,139,1],
        "darkgoldenrod": [184,134,11,1], "darkgray": [169,169,169,1],
        "darkgreen": [0,100,0,1], "darkgrey": [169,169,169,1],
        "darkkhaki": [189,183,107,1], "darkmagenta": [139,0,139,1],
        "darkolivegreen": [85,107,47,1], "darkorange": [255,140,0,1],
        "darkorchid": [153,50,204,1], "darkred": [139,0,0,1],
        "darksalmon": [233,150,122,1], "darkseagreen": [143,188,143,1],
        "darkslateblue": [72,61,139,1], "darkslategray": [47,79,79,1],
        "darkslategrey": [47,79,79,1], "darkturquoise": [0,206,209,1],
        "darkviolet": [148,0,211,1], "deeppink": [255,20,147,1],
        "deepskyblue": [0,191,255,1], "dimgray": [105,105,105,1],
        "dimgrey": [105,105,105,1], "dodgerblue": [30,144,255,1],
        "firebrick": [178,34,34,1], "floralwhite": [255,250,240,1],
        "forestgreen": [34,139,34,1], "fuchsia": [255,0,255,1],
        "gainsboro": [220,220,220,1], "ghostwhite": [248,248,255,1],
        "gold": [255,215,0,1], "goldenrod": [218,165,32,1],
        "gray": [128,128,128,1], "green": [0,128,0,1],
        "greenyellow": [173,255,47,1], "grey": [128,128,128,1],
        "honeydew": [240,255,240,1], "hotpink": [255,105,180,1],
        "indianred": [205,92,92,1], "indigo": [75,0,130,1],
        "ivory": [255,255,240,1], "khaki": [240,230,140,1],
        "lavender": [230,230,250,1], "lavenderblush": [255,240,245,1],
        "lawngreen": [124,252,0,1], "lemonchiffon": [255,250,205,1],
        "lightblue": [173,216,230,1], "lightcoral": [240,128,128,1],
        "lightcyan": [224,255,255,1], "lightgoldenrodyellow": [250,250,210,1],
        "lightgray": [211,211,211,1], "lightgreen": [144,238,144,1],
        "lightgrey": [211,211,211,1], "lightpink": [255,182,193,1],
        "lightsalmon": [255,160,122,1], "lightseagreen": [32,178,170,1],
        "lightskyblue": [135,206,250,1], "lightslategray": [119,136,153,1],
        "lightslategrey": [119,136,153,1], "lightsteelblue": [176,196,222,1],
        "lightyellow": [255,255,224,1], "lime": [0,255,0,1],
        "limegreen": [50,205,50,1], "linen": [250,240,230,1],
        "magenta": [255,0,255,1], "maroon": [128,0,0,1],
        "mediumaquamarine": [102,205,170,1], "mediumblue": [0,0,205,1],
        "mediumorchid": [186,85,211,1], "mediumpurple": [147,112,219,1],
        "mediumseagreen": [60,179,113,1], "mediumslateblue": [123,104,238,1],
        "mediumspringgreen": [0,250,154,1], "mediumturquoise": [72,209,204,1],
        "mediumvioletred": [199,21,133,1], "midnightblue": [25,25,112,1],
        "mintcream": [245,255,250,1], "mistyrose": [255,228,225,1],
        "moccasin": [255,228,181,1], "navajowhite": [255,222,173,1],
        "navy": [0,0,128,1], "oldlace": [253,245,230,1],
        "olive": [128,128,0,1], "olivedrab": [107,142,35,1],
        "orange": [255,165,0,1], "orangered": [255,69,0,1],
        "orchid": [218,112,214,1], "palegoldenrod": [238,232,170,1],
        "palegreen": [152,251,152,1], "paleturquoise": [175,238,238,1],
        "palevioletred": [219,112,147,1], "papayawhip": [255,239,213,1],
        "peachpuff": [255,218,185,1], "peru": [205,133,63,1],
        "pink": [255,192,203,1], "plum": [221,160,221,1],
        "powderblue": [176,224,230,1], "purple": [128,0,128,1],
        "red": [255,0,0,1], "rosybrown": [188,143,143,1],
        "royalblue": [65,105,225,1], "saddlebrown": [139,69,19,1],
        "salmon": [250,128,114,1], "sandybrown": [244,164,96,1],
        "seagreen": [46,139,87,1], "seashell": [255,245,238,1],
        "sienna": [160,82,45,1], "silver": [192,192,192,1],
        "skyblue": [135,206,235,1], "slateblue": [106,90,205,1],
        "slategray": [112,128,144,1], "slategrey": [112,128,144,1],
        "snow": [255,250,250,1], "springgreen": [0,255,127,1],
        "steelblue": [70,130,180,1], "tan": [210,180,140,1],
        "teal": [0,128,128,1], "thistle": [216,191,216,1],
        "tomato": [255,99,71,1], "turquoise": [64,224,208,1],
        "violet": [238,130,238,1], "wheat": [245,222,179,1],
        "white": [255,255,255,1], "whitesmoke": [245,245,245,1],
        "yellow": [255,255,0,1], "yellowgreen": [154,205,50,1]
    }

    function clamp_css_byte(i) {  // Clamp to integer 0 .. 255.
        i = Math.round(i);  // Seems to be what Chrome does (vs truncation).
        return i < 0 ? 0 : i > 255 ? 255 : i;
    }

    function clamp_css_float(f) {  // Clamp to float 0.0 .. 1.0.
        return f < 0 ? 0 : f > 1 ? 1 : f;
    }

    function parse_css_int(str) {  // int or percentage.
        if (str[str.length - 1] === '%')
            return clamp_css_byte(parseFloat(str) / 100 * 255);
        return clamp_css_byte(parseInt(str));
    }

    function parse_css_float(str) {  // float or percentage.
        if (str[str.length - 1] === '%')
            return clamp_css_float(parseFloat(str) / 100);
        return clamp_css_float(parseFloat(str));
    }

    function css_hue_to_rgb(m1, m2, h) {
      if (h < 0) h += 1;
      else if (h > 1) h -= 1;

      if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
      if (h * 2 < 1) return m2;
      if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
      return m1;
    }

    function parse(css_str) {
        // Remove all whitespace, not compliant, but should just be more accepting.
        var str = css_str.replace(/ /g, '').toLowerCase();

        // Color keywords (and transparent) lookup.
        if (str in kCSSColorTable)
            return kCSSColorTable[str].slice();  // dup.

        // #abc and #abc123 syntax.
        if (str[0] === '#') {
            if (str.length === 4) {
                var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
                if (!(iv >= 0 && iv <= 0xfff)) return null;  // Covers NaN.
                return [
                    ((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
                    (iv & 0xf0) | ((iv & 0xf0) >> 4),
                    (iv & 0xf) | ((iv & 0xf) << 4),
                    1
                ];
            }
            else if (str.length === 7) {
                var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
                if (!(iv >= 0 && iv <= 0xffffff)) return null;  // Covers NaN.
                return [
                    (iv & 0xff0000) >> 16,
                    (iv & 0xff00) >> 8,
                    iv & 0xff,
                    1
                ];
            }
        
            return null;
        }

        var op = str.indexOf('('), ep = str.indexOf(')');
        if (op !== -1 && ep + 1 === str.length) {
            var fname = str.substr(0, op);
            var params = str.substr(op+1, ep-(op+1)).split(',');
            var alpha = 1;  // To allow case fallthrough.
            switch (fname) {
                case 'rgba':
                    if (params.length !== 4) return null;
                    alpha = parse_css_float(params.pop());
                // Fall through.
                case 'rgb':
                    if (params.length !== 3) return null;
                    return [
                        parse_css_int(params[0]),
                        parse_css_int(params[1]),
                        parse_css_int(params[2]),
                        alpha
                    ];
                case 'hsla':
                    if (params.length !== 4) return null;
                    alpha = parse_css_float(params.pop());
                // Fall through.
                case 'hsl':
                    if (params.length !== 3) return null;
                    var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;  // 0 .. 1
                    // NOTE(deanm): According to the CSS spec s/l should only be
                    // percentages, but we don't bother and let float or percentage.
                    var s = parse_css_float(params[1]);
                    var l = parse_css_float(params[2]);
                    var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
                    var m1 = l * 2 - m2;
                    return [
                        clamp_css_byte(css_hue_to_rgb(m1, m2, h+1/3) * 255),
                        clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
                        clamp_css_byte(css_hue_to_rgb(m1, m2, h-1/3) * 255),
                        alpha
                    ];
                default:
                    return null;
            }
        }

        return null;
    }

    return {
        parse : parse
    }
});
define('qtek-2d/context/DrawingStyle',['require','./tool/color'],function(require) {

    'use strict'

    // TODO replace it
    var color = require('./tool/color');

    var DrawingStyle = function() {

        this.strokeStyle = [0, 0, 0, 1];

        this.fillStyle = [0, 0, 0, 1];
    }
    
    // Line Styles
    DrawingStyle.prototype.lineWidth = 1;

    // Text styles
    // 


    DrawingStyle.prototype.globalAlpha = 1;

    // Shadows
    DrawingStyle.prototype.shadowOffsetX = 0;
    DrawingStyle.prototype.shadowOffsetY = 0;
    DrawingStyle.prototype.shadowBlur = 0;
    DrawingStyle.prototype.shadowColor = [0, 0, 0];


    DrawingStyle.prototype.setStrokeStyle = function(str) {
        if (typeof(str) == 'string') {
            var c = color.parse(str);
        } else if (str.length == 3 || str.length == 4) {
            c = str;
        }

        if (c) {
            this.strokeStyle[0] = c[0] / 255;
            this.strokeStyle[1] = c[1] / 255;
            this.strokeStyle[2] = c[2] / 255;
            this.strokeStyle[3] = c[3] || 1;
        } else {
            this.strokeStyle[0] = 0;
            this.strokeStyle[1] = 0;
            this.strokeStyle[2] = 0;
            this.strokeStyle[3] = 1;
        }
    }

    DrawingStyle.prototype.setFillStyle = function(str) {
        var c;
        if (typeof(str) == 'string') {
            c = color.parse(str);
        } else if (str.length == 3 || str.length == 4) {
            c = str;
        }
        if (c) {
            this.fillStyle[0] = c[0] / 255;
            this.fillStyle[1] = c[1] / 255;
            this.fillStyle[2] = c[2] / 255;
            this.fillStyle[3] = c[3] || 1;
        } else {
            this.fillStyle[0] = 0;
            this.fillStyle[1] = 0;
            this.fillStyle[2] = 0;
            this.fillStyle[3] = 1;
        }
    }

    DrawingStyle.prototype.copy = function(source) {
        this.strokeStyle = source.strokeStyle.slice();
        this.fillStyle = source.fillStyle.slice();

        this.lineWidth = source.lineWidth;
        this.globalAlpha = source.globalAlpha;

        this.shadowOffsetX = source.shadowOffsetX;
        this.shadowOffsetY = source.shadowOffsetY;
        this.shadowBlur = source.shadowBlur;
        this.shadowColor = source.shadowColor.slice();
    }

    DrawingStyle.prototype.clone = function(source) {
        
    }


    return DrawingStyle;
});
define('qtek-2d/context/LineSegment',['require','./tool/math'],function(require) {

    var mathTool = require('./tool/math');

    var LineSegment = function(x0, y0, x1, y1) {

        this.type = LineSegment.type;

        this.thickness = 0;

        this.points = [x0, y0, x1, y1];
    }

    LineSegment.prototype.strokeSteps = 1;

    LineSegment.prototype.reverse = function() {
        mathTool.reverse(this.points, 2, 2);
    }

    LineSegment.type = 1;


    return LineSegment;
});
// Ear clipping polygon triangulation
// @author pissang(https://github.com/pissang)
define('qtek-2d/context/tool/Triangulation2',['require','qtek/core/LinkedList','./math'],function(require) {

    'use strict'

    var LinkedList = require('qtek/core/LinkedList');
    var mathTool = require('./math');

    var VERTEX_TYPE_CONVEX = 1;
    var VERTEX_TYPE_REFLEX = 2;

    var epsilon = 5e-4;

    function Edge(p0, p1) {

        this.p0 = p0;

        this.p1 = p1;

        // Dirty trick to speed up the delete operation in linked list
        this._linkedListEntry = null;
    }

    var TriangulationContext = function() {

        this.points = [];

        this.triangles = [];

        this.maxGridNumber = 50;

        this.minGridNumber = 0;

        this._gridNumber = 20;

        this._boundingBox = [[Infinity, Infinity], [-Infinity, -Infinity]];

        this._nPoints = 0;

        this._nTriangle = 0;

        this._pointTypes = [];

        this._grids = [];

        this._gridWidth = 0;
        this._gridHeight = 0;

        this._edgeList = new LinkedList();

        // Map of point index and the edge out from the vertex
        this._edgeOut = [];

        // Map of point index and the edge in to the vertex
        this._edgeIn = [];

        this._candidates = [];
    }

    TriangulationContext.prototype.triangulate = function(points) {
        this._nPoints = points.length / 2;
        if (this._nPoints <= 3) {
            return;
        }

        // PENDING Dynamic grid number or fixed grid number ?
        this._gridNumber = Math.ceil(Math.sqrt(this._nPoints));
        this._gridNumber = Math.max(Math.min(this._gridNumber, this.maxGridNumber), this.minGridNumber);

        this.points = points;

        this._reset();

        this._prepare();

        this._earClipping();

        this.triangles.length = this._nTriangle * 3;
    }

    TriangulationContext.prototype._reset = function() {

        this._nTriangle = 0;

        this._edgeList.clear();

        this._candidates.length = 0;

        this._boundingBox[0][0] = this._boundingBox[0][1] = Infinity;
        this._boundingBox[1][0] = this._boundingBox[1][1] = -Infinity;
        // Initialize grid
        var nGrids = this._gridNumber * this._gridNumber;
        var len = this._grids.length;
        for (var i = 0; i < len; i++) {
            this._grids[i].length = 0;
        }
        for (; i < nGrids; i++) {
            this._grids[i] = [];
        }
        this._grids.length = nGrids;

        // Initialize edges
        // In case the array have undefined values
        if (len < this._nPoints) {
            len = this._edgeIn.length;
            for (var i = len; i < this._nPoints; i++) {
                this._edgeIn[i] = this._edgeOut[i] = null;
            }
        } else {
            this._edgeIn.length = this._edgeOut.length = this._nPoints;
        }
    }

    // Prepare points and edges
    TriangulationContext.prototype._prepare = function() {
        var bb = this._boundingBox;
        var n = this._nPoints;
        // Update bounding box and determine point type is reflex or convex
        for (var i = 0, j = n - 1; i < n;) {
            var k = (i + 1) % n;
            var x0 = this.points[j * 2];
            var y0 = this.points[j * 2 + 1];
            var x1 = this.points[i * 2];
            var y1 = this.points[i * 2 + 1];
            var x2 = this.points[k * 2];
            var y2 = this.points[k * 2 + 1];

            if (x1 < bb[0][0]) bb[0][0] = x1;
            if (y1 < bb[0][1]) bb[0][1] = y1;
            if (x1 > bb[1][0]) bb[1][0] = x1;
            if (y1 > bb[1][1]) bb[1][1] = y1;

            // Make the bounding box a litte bigger
            // Avoid the geometry hashing will touching the bound of the bounding box
            bb[0][0] -= 0.1;
            bb[0][1] -= 0.1;
            bb[1][0] += 0.1;
            bb[1][1] += 0.1;

            var area = mathTool.triangleArea(x0, y0, x1, y1, x2, y2);
            if (Math.abs(area) < 1) {
                // Ignore tiny triangles, remove the point i
                this.points.splice(i * 2, 2);
                n --;
            } else {
                this._pointTypes[i] = area < 0 ? VERTEX_TYPE_CONVEX : VERTEX_TYPE_REFLEX;
                if (area < 0) {
                    this._candidates.push(i);
                }
                j = i;
                i++;
            }
        }

        this._pointTypes.length = n;

        this._gridWidth = (bb[1][0] - bb[0][0]) / this._gridNumber;
        this._gridHeight = (bb[1][1] - bb[0][1]) / this._gridNumber;

        // Put the points in the grids
        for (var i = 0; i < n; i++) {
            if (this._pointTypes[i] == VERTEX_TYPE_REFLEX) {
                var x = this.points[i * 2];
                var y = this.points[i * 2 + 1];
                var key = this._getPointHash(x, y);
                this._grids[key].push(i);
            }
        }

        // Create edges
        for (var i = 0; i < n-1; i++) {
            this._addEdge(i, i+1);
        }
        this._addEdge(i, 0);
    }

    TriangulationContext.prototype._earClipping = function() {
        var candidates = this._candidates;
        var nPoints = this._nPoints;
        while(candidates.length) {
            var isDesperate = true;
            for (var i = 0; i < candidates.length;) {
                var idx = candidates[i];
                if (this._isEar(idx)) {
                    this._clipEar(idx);
                    // TODO
                    // candidates[i] = candidates[candidates.length - 1];
                    // candidates.pop();
                    candidates.splice(i, 1);
                    isDesperate = false;

                    nPoints--;
                } else {
                    i++;
                }
            }

            if (isDesperate) {
                // Random pick a convex vertex when there is no more ear
                // can be clipped and there are more than 3 points left
                // After clip the random picked vertex, go on finding ears again
                // So it can be extremely slow in worst case
                // TODO
                this._clipEar(candidates.pop());
                nPoints--;
            }
        }
    }

    TriangulationContext.prototype._isEar = function(p1) {
        // Find two adjecent edges
        var e0 = this._edgeIn[p1];
        var e1 = this._edgeOut[p1];
        // Find two adjecent vertices
        var p0 = e0.p0;
        var p2 = e1.p1;

        var x0 = this.points[p0 * 2];
        var y0 = this.points[p0 * 2 + 1];
        var x1 = this.points[p1 * 2];
        var y1 = this.points[p1 * 2 + 1];
        var x2 = this.points[p2 * 2];
        var y2 = this.points[p2 * 2 + 1];

        // Clipped the tiny triangles directly
        if (Math.abs(mathTool.triangleArea(x0, y0, x1, y1, x2, y2)) < 1) {
            return true;
        }

        var range = this._getTriangleGrids(x0, y0, x1, y1, x2, y2);

        // Find all the points in the grids covered by the triangle
        // And figure out if any of them is in the triangle
        for (var j = range[0][1]; j <= range[1][1]; j++) {
            for (var i = range[0][0]; i <= range[1][0]; i++) {
                var gridIdx = j * this._gridNumber + i;
                var gridPoints = this._grids[gridIdx];

                for (var k = 0; k < gridPoints.length; k++) {
                    var idx = gridPoints[k];
                    if (this._pointTypes[idx] == VERTEX_TYPE_REFLEX) {
                        var xi = this.points[idx * 2];
                        var yi = this.points[idx * 2 + 1];
                        if (mathTool.isPointInTriangle(x0, y0, x1, y1, x2, y2, xi, yi)) {
                            return false;
                        }   
                    }
                }
            }
        }

        return true;
    }

    TriangulationContext.prototype._clipEar = function(p1) {

        var e0 = this._edgeIn[p1];
        var e1 = this._edgeOut[p1];

        var offset = this._nTriangle * 3;
        this.triangles[offset] = e0.p0;
        this.triangles[offset + 1] = e0.p1;
        this.triangles[offset + 2] = e1.p1;
        this._nTriangle++;

        var e0i = this._edgeIn[e0.p0];
        var e1o = this._edgeOut[e1.p1];
        // New candidate after clipping (convex vertex)
        if (this._pointTypes[e0.p0] == VERTEX_TYPE_REFLEX) {
            if (this.isTriangleConvex2(e0i.p0, e0.p0, e1.p1)) {
                // PENDING
                // The index in the grids also needs to be removed
                // But because it needs `splice` and `indexOf`
                // may cost too much
                this._candidates.push(e0.p0);
                this._pointTypes[e0.p0] = VERTEX_TYPE_CONVEX;
            }
        }
        if (this._pointTypes[e1.p1] == VERTEX_TYPE_REFLEX) {
            if (this.isTriangleConvex2(e0.p0, e1.p1, e1o.p1)) {
                this._candidates.push(e1.p1);
                this._pointTypes[e1.p1] = VERTEX_TYPE_CONVEX;
            }
        }

        this._removeEdge(e0);
        this._removeEdge(e1);

        this._addEdge(e0.p0, e1.p1);

    }

    TriangulationContext.prototype._addEdge = function(p0, p1) {
        
        var edge = new Edge(p0, p1);
        this._edgeOut[p0] = edge;
        this._edgeIn[p1] = edge;
        var entry = this._edgeList.insert(edge);
        edge._linkedListEntry = entry;

        return edge;
    }

    TriangulationContext.prototype._removeEdge = function(e) {
        this._edgeList.remove(e._linkedListEntry);
        this._edgeOut[e.p0] = null;
        this._edgeIn[e.p1] = null;
    }

    // Get geometric hash of point
    // Actually it will find the grid index by giving the point (x y)
    TriangulationContext.prototype._getPointHash = function(x, y) {
        var bb = this._boundingBox;
        return Math.floor((y - bb[0][1]) / this._gridHeight) * this._gridNumber
            + Math.floor((x - bb[0][0]) / this._gridWidth);
    }

    // Get the grid range covered by the triangle
    TriangulationContext.prototype._getTriangleGrids = (function() {
        var range = [[-1, -1], [-1, -1]];
        var minX, minY, maxX, maxY;
        return function(x0, y0, x1, y1, x2, y2) {
            var bb = this._boundingBox;

            // Use `if` instead of `min` `max` methods when having three or more params
            // http://jsperf.com/min-max-multiple-param
            minX = maxX = x0;
            minY = maxY = y0;
            if (x1 < minX) minX = x1;
            if (y1 < minY) minY = y1;
            if (x1 > maxX) maxX = x1;
            if (y1 > maxY) maxY = y1;
            if (x2 < minX) minX = x2;
            if (y2 < minY) minY = y2;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;

            range[0][0] = Math.floor((minX - bb[0][0]) / this._gridWidth);
            range[1][0] = Math.floor((maxX - bb[0][0]) / this._gridWidth);

            range[0][1] = Math.floor((minY - bb[0][1]) / this._gridHeight);
            range[1][1] = Math.floor((maxY - bb[0][1]) / this._gridHeight);

            return range;
        }
    })();

    TriangulationContext.prototype.isTriangleConvex2 = function(p0, p1, p2) {
        return this.triangleArea(p0, p1, p2) < 0;
    }

    TriangulationContext.prototype.triangleArea = function(p0, p1, p2) {
        var x0 = this.points[p0 * 2];
        var y0 = this.points[p0 * 2 + 1];
        var x1 = this.points[p1 * 2];
        var y1 = this.points[p1 * 2 + 1];
        var x2 = this.points[p2 * 2];
        var y2 = this.points[p2 * 2 + 1];
        return (x1 - x0) * (y2 - y1) - (y1 - y0) * (x2 - x1);
    }


    return TriangulationContext;
});
define('qtek-2d/context/Polygon',['require','./tool/math','glmatrix','./tool/Triangulation2'],function (require) {

    var mathTool = require('./tool/math');
    var glMatrix = require('glmatrix');
    var vec2 = glMatrix.vec2;

    var TriangulationTool = require('./tool/Triangulation2');
    var triangulation = new TriangulationTool();

    var Polygon = function(autoUpdateBBox) {

        this.points = [];

        this.triangles = [];

        this._nPoints = 0;

        this._isClosed = false;

        this._isEnded = false;

        // Start point
        this._x0 = 0;
        this._y0 = 0;
        // Current point
        this._xi = 1;
        this._yi = 1;

        this._autoUpdateBBox = autoUpdateBBox;

        if (autoUpdateBBox) {
            this.boundingBox = [vec2.create(), vec2.create()];
        } else {
            this.boundingBox = null;
        }

        this._isStatic = false;
    }

    Polygon.prototype.begin = function(x, y) {
        if (this._isStatic) {
            this._isStatic = false;
            this.points = [];
            this.triangles = [];
        }

        this._nPoints = 0;
        this._isClosed = false;
        this._isEnded = false;


        this.addPoint(x, y);

        this._x0 = this._xi = x;
        this._y0 = this._yi = y;


        if (this._autoUpdateBBox) {
            var bbox = this.boundingBox;
            vec2.set(bbox[0], x, y);
            vec2.set(bbox[1], x, y);   
        }
    }

    Polygon.prototype.end = function() {
        if (this._isEnded) {
            return;
        }

        this.points.length = this._nPoints * 2;

        this._isEnded = true;
    }


    Polygon.prototype.addPoint = function(x, y) {

        var n = this._nPoints * 2;

        this.points[n] = x;
        this.points[n + 1] = y;

        this._xi = x;
        this._yi = y;

        this._nPoints++;

        // Update bounding box
        if (this._autoUpdateBBox) {
            var bbox = this.boundingBox;
            if (x < bbox[0][0]) bbox[0][0] = x;
            if (y < bbox[0][1]) bbox[0][1] = y;
            if (x > bbox[1][0]) bbox[1][0] = x;
            if (y > bbox[1][1]) bbox[1][1] = y;
        }
    }

    // TODO Clipping performance
    Polygon.prototype.triangulate = function() {
        if (this._nPoints < 3) {
            return;
        } else if (this._nPoints == 3) {
            this.triangles[0] = 0;
            this.triangles[1] = 1;
            this.triangles[2] = 2;
            this.triangles.length = 3;
        } else {
            triangulation.triangles = this.triangles;
            triangulation.triangulate(this.points);

            this.points = triangulation.points;
            this._nPoints = this.points.length / 2; 
        }
    }

    Polygon.prototype.checkClose = function(x, y) {
        if (this._nPoints >= 1 && mathTool.approxEqualInt(x, this._x0) && mathTool.approxEqualInt(y, this._y0)) {
            this._isClosed = true;
            return true;
        }
        return false;
    }

    Polygon.prototype.isCCW = function() {
        return mathTool.area(this.points) < 0;
    }

    Polygon.prototype.area = function() {
        return mathTool.area(this.points);
    }

    // Make sure not having duplicate neighbour points
    Polygon.prototype.removeDuplicate = function() {
        var points = this.points;
        var n = this._nPoints * 2;
        for (var i = 0; i < n;) {
            x0 = points[i], y0 = points[i + 1];
            x1 = points[(i + 2) % n], y1 = points[(i + 3) % n];
            if(mathTool.approxEqualInt(x0, x1) && mathTool.approxEqualInt(y0, y1)) {
                points.splice(i, 2);
                this._nPoints --;
                n -= 2;
            } else {
                i += 2;
            }
        }
    }

    Polygon.prototype.updateBoundingBox = function() {
        if (!this.boundingBox) {
            this.boundingBox = [vec2.create(), vec2.create()];
        }
        var bbox = this.boundingBox;
        var points = this.points;
        bbox[0][0] = Infinity; bbox[0][1] = Infinity;
        bbox[1][0] = -Infinity; bbox[1][1] = -Infinity;

        for (var i = 0; i < this._nPoints * 2;) {
            var x = points[i++];
            var y = points[i++];
            if (x < bbox[0][0]) bbox[0][0] = x;
            if (y < bbox[0][1]) bbox[0][1] = y;
            if (x > bbox[1][0]) bbox[1][0] = x;
            if (y > bbox[1][1]) bbox[1][1] = y;
        }
    }

    Polygon.prototype.isPointInPolygon = function(x, y) {
        var bbox = this.boundingBox;
        if (bbox[0][0] > x || bbox[1][0] < x || bbox[0][1] > y || bbox[1][1] < y) {
            return false;
        }

    }

    Polygon.prototype.toStatic = function() {
        if (this._isStatic) {
            return;
        }
        this.points = new Float32Array(this.points);
        this.triangles = new Uint32Array(this.triangles);
        this._isStatic = true;
    }

    // Reverse the orientation
    Polygon.prototype.reverse = function() {
        mathTool.reverse(this.points, this._nPoints, 2);
    }

    return Polygon;
});
define('qtek-2d/context/CanvasSubpath',['require','./tool/math','./LineSegment','./BezierCurveSegment','./Polygon','glmatrix'],function(require) {
    
    

    var mathTool = require('./tool/math');

    var LineSegment = require('./LineSegment');
    var BezierCurveSegment = require('./BezierCurveSegment');

    var Polygon = require('./Polygon');

    var glMatrix = require('glmatrix');
    var vec3 = glMatrix.vec3;
    var vec2 = glMatrix.vec2;
    var mat4 = glMatrix.mat4;

    var SEG_TYPE_LINE = 1;
    var SEG_TYPE_QUADRATIC = 2;
    var SEG_TYPE_CUBIC = 3;

    var CanvasSubpath = function() {

        this.basePolygon = new Polygon(true);

        this.interiorPolygon = new Polygon(true);

        // Seperate the fill segments and stroke segments
        // because curve segment may be subdivided
        this.fillSegments = [];

        this.fillCurveSegments = [];

        this.strokeSegments = [];

        this.strokeVerticesArray = null;

        this._nFillSegments = 0;

        this._nStrokeSegments = 0;

        this._nFillCurveSegements = 0;

        this._isClosed = false;

        this._isEnded = false;

        this._fill = true;
        this._stroke = false;
    }

    CanvasSubpath.prototype.begin = function(x, y) {
        // Reset the states
        this._nFillSegments = 0;
        this._nStrokeSegments = 0;
        this._nFillCurveSegements = 0;

        this._isEnded = false;
        this._isClosed = false;
        this._fill = false;
        this._stroke = false;

        this.basePolygon.begin(x, y);
    }

    CanvasSubpath.prototype.end = function() {
        if (this._isEnded) {
            return;
        }

        this.strokeSegments.length = this._nStrokeSegments;
        this.fillSegments.length = this._nFillSegments;
        this.fillCurveSegments.length = this._nFillCurveSegements;

        this._isEnded = true;

        this.basePolygon.end();
        var area = this.basePolygon.area();
        if (area > 0) {
            this.reverse();
        } else if (area == 0) {
            // TODO
            // Simple hack when there is only one curve or multiple collinear curve
            // Of cource there are still some bad case
            if (this._nFillCurveSegements > 0) {
                if(!mathTool.isCCW(this.fillCurveSegments[0].points)) {
                    this.reverse();
                }
            }
        }
    }

    CanvasSubpath.prototype.close = function(thickness) {
        if (this._isClosed) {
            return;
        }
        // Add close line
        var poly = this.basePolygon;
        if (poly._nPoints > 1) {
            var seg = new LineSegment(poly._xi, poly._yi, poly._x0, poly._y0);
            seg.thickness = thickness;
            this.strokeSegments[this._nStrokeSegments++] = seg;
        }
        this._isClosed = true;
    }

    CanvasSubpath.prototype.stroke = function(sx, sy) {
        if (!this._stroke) {
            // Assume the subpath is ended
            this._stroke = true;

            for (var i = 0; i < this.strokeSegments.length; i++) {
                var seg = this.strokeSegments[i];
                if (seg.type == BezierCurveSegment.type) {
                    seg.updateStrokeSegments(sx, sy);
                }
            }

            this._convertLineToPolygon();
        }
    }

    CanvasSubpath.prototype.updateStrokeThickness = function(thickness) {
        if (this._stroke) {
            for (var i = 0; i < this.segments.length; i++) {
                var seg = this.strokeSegments[i];
                seg.thickness = thickness;
            }

            this._convertLineToPolygon();
        }
    }

    CanvasSubpath.prototype.fill = function() {
        if (!this._fill) {
            // Assume the subpath is ended
            this._fill = true;
            
            this._checkOverlap();

            this._updateCurveTextureCoords();

            this._updateSegments();

            this._updateInteriorPolygon();

            this.interiorPolygon.triangulate();

        }
    }

    CanvasSubpath.prototype.addLine = function(x0, y0, x1, y1, thickness) {
        
        var isClosed = this._checkClose(x1, y1);
        if (!isClosed) {
            this.basePolygon.addPoint(x1, y1);
        } else {
            this._isClosed = true;
        }
        
        var seg = new LineSegment(x0, y0, x1, y1);
        seg.thickness = thickness;

        this.strokeSegments[this._nStrokeSegments++] = seg;
        this.fillSegments[this._nFillSegments++] = seg;

        return isClosed;
    }

    CanvasSubpath.prototype.addQuadraticBezierCurve = function(x0, y0, x1, y1, x2, y2, thickness) {
        // Convert quadratic to cubic using degree elevation
        var x3 = x2;
        var y3 = y2;
        x2 = (x2 + 2 * x1) / 3;
        y2 = (y2 + 2 * y1) / 3;
        x1 = (x0 + 2 * x1) / 3;
        y1 = (y0 + 2 * y1) / 3;

        return this.addCubicBezierCurve(x0, y0, x1, y1, x2, y2, x3, y3, thickness);
    }

    CanvasSubpath.prototype.addCubicBezierCurve = function(x0, y0, x1, y1, x2, y2, x3, y3, thickness) {
        
        var isClosed = this._checkClose(x3, y3);
        if (!isClosed) {
            this.basePolygon.addPoint(x3, y3);
        } else {
            this._isClosed = true;
        }

        var seg = new BezierCurveSegment(x0, y0, x1, y1, x2, y2, x3, y3);
        seg.thickness = thickness;

        this.strokeSegments[this._nStrokeSegments++] = seg;
        this.fillSegments[this._nFillSegments++] = seg;

        this.fillCurveSegments[this._nFillCurveSegements++] = seg;

        return isClosed;
    }

    CanvasSubpath.prototype.isPointInSubpath = function(x, y) {
        var bbox = this.interiorPolygon.boundingBox;
        if (bbox[0][0] > x || bbox[1][0] < x || bbox[0][1] > y || bbox[1][1] < y) {
            return false;
        }
        
    }

    // Return true if the subpath is closed
    CanvasSubpath.prototype._checkClose = function(x, y) {
        return this.basePolygon.checkClose(x, y);
    }

    CanvasSubpath.prototype._updateCurveTextureCoords = function() {
        for (var i = 0; i < this.fillSegments.length; i++) {
            var seg = this.fillSegments[i];
            if (seg.type == BezierCurveSegment.type) {
                this._updateLeafCurveTextureCoords(seg);
            }
        }
    }

    CanvasSubpath.prototype._updateLeafCurveTextureCoords = function(seg) {
        if (seg.subCurveA) {
            this._updateLeafCurveTextureCoords(seg.subCurveA);
            this._updateLeafCurveTextureCoords(seg.subCurveB);
        } else {
            seg.updateTextureCoords();
        }
    }

    // Subdivide the cubic bezier curve overlapped
    // Limitation : zig zag curve
    CanvasSubpath.prototype._checkOverlap = function() {

        var candidates = [];
        var nCurves = this.fillCurveSegments.length;

        for (var i = 0; i < nCurves; i++) {
            for (var j = i+1; j < nCurves; j++) {
                var curve1 = this.fillCurveSegments[i];
                var curve2 = this.fillCurveSegments[j];
                if (curve1.intersectCurve(curve2)) {
                    candidates.push(curve1);
                    candidates.push(curve2);
                }
            }
        }

        while(candidates.length) {
            var c1 = candidates.shift();
            var c2 = candidates.shift();

            c1.subdivide(0.5);

            if (c1.subCurveA.intersectCurve(c2)) {
                if (Math.abs(mathTool.area(c1.subCurveA.points)) > 1) {
                    candidates.push(c2);
                    candidates.push(c1.subCurveA);   
                }
            }
            if (c1.subCurveB.intersectCurve(c2)) {
                if (Math.abs(mathTool.area(c1.subCurveB.points)) > 1) {
                    candidates.push(c2);
                    candidates.push(c1.subCurveB);
                }
            }
        }
    }

    CanvasSubpath.prototype._updateSegments = function() {
        this._nFillCurveSegements = 0;
        for (var idx = 0; idx < this._nFillSegments;) {
            var seg = this.fillSegments[idx];
            if (seg.type == BezierCurveSegment.type) {
                if (seg.subCurveA) {
                    this.fillSegments.splice(idx, 1);
                    this._nFillSegments--;
                    idx = this._replaceSubdividedCurve(seg, idx);
                } else {
                    this.fillCurveSegments[this._nFillCurveSegements++] = seg;
                    idx++;
                }
            } else {
                idx++;
            }
        }
        this.fillCurveSegments.length = this._nFillCurveSegements;
    }

    CanvasSubpath.prototype._replaceSubdividedCurve = function(seg, idx) {
        // Pending 
        // Splice performance
        if (seg.subCurveA) {
            idx = this._replaceSubdividedCurve(seg.subCurveA, idx);
            return this._replaceSubdividedCurve(seg.subCurveB, idx);
        } else {
            this.fillSegments.splice(idx, 0, seg);
            this._nFillSegments++;
            this.fillCurveSegments[this._nFillCurveSegements++] = seg;
            return idx + 1;
        }
    }

    CanvasSubpath.prototype._updateInteriorPolygon= function() {

        var x0, y0, x1, y1, x2, y2, x3, y3;
        if (this._nFillSegments < 2) {
            return;
        }

        var poly = this.interiorPolygon;
        var seg0 = this.fillSegments[0];

        poly.begin(seg0.points[0], seg0.points[1]);

        for (var i = 0; i < this._nFillSegments; i++) {
            var seg = this.fillSegments[i];
            switch(seg.type) {
                case LineSegment.type:
                    poly.addPoint(seg.points[2], seg.points[3]);
                    break;
                case BezierCurveSegment.type:
                    x0 = seg.points[0], y0 = seg.points[1];
                    x1 = seg.points[2], y1 = seg.points[3];
                    x2 = seg.points[4], y2 = seg.points[5];
                    x3 = seg.points[6], y3 = seg.points[7];

                    var isConvex = mathTool.isTriangleConvex(x0, y0, x1, y1, x3, y3);
                    if (isConvex != mathTool.isTriangleConvex(x0, y0, x2, y2, x3, y3)) {
                        // cp1 and cp2 is not on the same side of edge03
                        if (isConvex) {
                            // remove cp1
                            poly.addPoint(x2, y2);
                            poly.addPoint(x3, y3);
                        } else {
                            // remove cp2
                            poly.addPoint(x1, y1);
                            poly.addPoint(x3, y3);
                        }
                    } else { //cp1 and cp2 is on the same side of edge03
                        if (isConvex) {
                            // Remove cp1 and cp2
                            poly.addPoint(x3, y3);
                        } else {
                            if (mathTool.isTriangleConvex(x0, y0, x2, y2, x1, y1)) { // cp2 is on the right side of edge01
                                // cp2 is in the triangle013
                                if (mathTool.isTriangleConvex(x1, y1, x2, y2, x3, y3)) {
                                    // remove cp2
                                    poly.addPoint(x1, y1);
                                    poly.addPoint(x3, y3);
                                } else {
                                    // Add all
                                    poly.addPoint(x1, y1);
                                    poly.addPoint(x2, y2);
                                    poly.addPoint(x3, y3);
                                }
                            } else {   // cp2 is on the left side of edge01
                                // cp1 is in the triangle023
                                if (mathTool.isTriangleConvex(x2, y2, x1, y1, x3, y3)) {
                                    // remove cp1
                                    poly.addPoint(x2, y2);
                                    poly.addPoint(x3, y3);
                                } else {
                                    // Swap cp1 and cp2 and add all
                                    poly.addPoint(x2, y2);
                                    poly.addPoint(x1, y1);
                                    poly.addPoint(x3, y3);
                                }
                            }
                        }
                    }

                    break;
                default:
                    break;
            }

        }

        poly.end();
        poly.removeDuplicate();
    }

    // https://forum.libcinder.org/topic/smooth-thick-lines-using-geometry-shader#23286000001269127
    // http://www.goodboydigital.com/pixi-webgl-primitives/
    CanvasSubpath.prototype._convertLineToPolygon = (function() {
        var v0 = vec2.create();
        var v1 = vec2.create();
        var v2 = vec2.create();
        var v01 = vec2.create();
        var v12 = vec2.create();
        var normal = vec2.create();
        var tmp = vec2.create();

        var segPoly = [];
        for (var i = 0; i < 4; i++) {
            segPoly[i] = vec2.create();
        }

        return function() {
            var nPoints = 0;
            var len = this.strokeSegments.length;

            for (var i = 0; i < len; i++) {
                var seg = this.strokeSegments[i];
                nPoints += seg.strokeSteps * 6;
            }
            if (
                !this.strokeVerticesArray ||
                this.strokeVerticesArray.length != nPoints * 2
            ) {
                this.strokeVerticesArray = new Float32Array(nPoints * 2);
            }
            var vertices = this.strokeVerticesArray;
            var off = 0;

            var start = this._isClosed ? len - 1 : 0;

            // First segment
            seg = this.strokeSegments[start];
            vec2.set(v0, seg.points[0], seg.points[1]);

            for (var count = 0, i = start; i < len; count++) {

                seg = this.strokeSegments[i];

                switch(seg.type) {
                    case LineSegment.type:
                        if (count == 0) {
                            vec2.set(v1, seg.points[2], seg.points[3]);
                            vec2.copy(v2, v1);
                            vec2.sub(v12, v1, v0);
                            vec2.normalize(v12, v12);
                            if (!this._isClosed) {
                                // Normal of the segment point to the left side
                                vec2.set(normal, v12[1], -v12[0]);
                                var thickness = seg.thickness / 2;
                                vec2.scaleAndAdd(segPoly[0], v0, normal, thickness);
                                vec2.scaleAndAdd(segPoly[1], v0, normal, -thickness);
                            }
                        } else {
                            vec2.set(v2, seg.points[2], seg.points[3]);
                            vec2.copy(v01, v12);
                            vec2.sub(v12, v2, v1);
                            vec2.normalize(v12, v12);
                            // normal of the vertex
                            vec2.set(normal, v01[0] - v12[0], v01[1] - v12[1]);
                            vec2.normalize(normal, normal);
                            // tmp is the normal of v01, point to the left side
                            vec2.set(tmp, v01[1], -v01[0])
                            var cosTheta = vec2.dot(normal, tmp);
                            // Make sure normal is point to the left side of v01
                            if (cosTheta < 0) {
                                vec2.negate(normal, normal);
                                cosTheta = -cosTheta;
                            }
                            var thickness = seg.thickness / cosTheta / 2;
                            vec2.scaleAndAdd(segPoly[2], v1, normal, thickness);
                            vec2.scaleAndAdd(segPoly[3], v1, normal, -thickness);

                            if (i !== 0) {
                                // Construct two triangles of previous segment
                                // 0------2
                                // |  /   |
                                // 1------3
                                vertices[off++] = segPoly[0][0]; vertices[off++] = segPoly[0][1];
                                vertices[off++] = segPoly[1][0]; vertices[off++] = segPoly[1][1];
                                vertices[off++] = segPoly[2][0]; vertices[off++] = segPoly[2][1];

                                vertices[off++] = segPoly[1][0]; vertices[off++] = segPoly[1][1];
                                vertices[off++] = segPoly[3][0]; vertices[off++] = segPoly[3][1];
                                vertices[off++] = segPoly[2][0]; vertices[off++] = segPoly[2][1];
                            }

                            vec2.copy(v0, v1);
                            vec2.copy(v1, v2);
                            vec2.copy(segPoly[0], segPoly[2]);
                            vec2.copy(segPoly[1], segPoly[3]);
                        }

                        break;
                    case BezierCurveSegment.type:
                        var fx = seg.fx, fy = seg.fy;
                        var dfx = seg.dfx, dfy = seg.dfy;
                        var ddfx = seg.ddfx, ddfy = seg.ddfy;
                        var dddfx = seg.dddfx, dddfy = seg.dddfy;

                        var ks = 0;
                        if (count == 0) {
                            fx += dfx; fy += dfy;
                            dfx += ddfx; dfy += ddfy;
                            ddfx += dddfx; ddfy += dddfy;
                            vec2.set(v1, fx, fy);
                            vec2.copy(v2, v1);

                            vec2.sub(v12, v1, v0);
                            vec2.normalize(v12, v12);
                            if (!this._isClosed) {
                                // Normal of the segment point to the left side
                                vec2.set(normal, v12[1], -v12[0]);
                                var thickness = seg.thickness / 2;
                                vec2.scaleAndAdd(segPoly[0], v0, normal, thickness);
                                vec2.scaleAndAdd(segPoly[1], v0, normal, -thickness);
                            }
                            ks = 1;
                        }
                        for (var k = ks; k < seg.strokeSteps; k++) {
                            // normal of the vertex
                            var nx = v01[0] - v12[0];
                            var ny = v01[1] - v12[1];

                            fx += dfx; fy += dfy;
                            dfx += ddfx; dfy += ddfy;
                            ddfx += dddfx; ddfy += dddfy;

                            vec2.set(v2, fx + dfx, fy + dfy);
                            vec2.copy(v01, v12);
                            vec2.sub(v12, v2, v1);
                            vec2.normalize(v12, v12);

                            // Same code with line segment
                            vec2.set(normal, v01[0] - v12[0], v01[1] - v12[1]);
                            vec2.normalize(normal, normal);
                            vec2.set(tmp, v01[1], -v01[0])
                            var cosTheta = vec2.dot(normal, tmp);
                            if (cosTheta < 0) {
                                vec2.negate(normal, normal);
                                cosTheta = -cosTheta;
                            }
                            var thickness = seg.thickness / cosTheta / 2;
                            vec2.scaleAndAdd(segPoly[2], v1, normal, thickness);
                            vec2.scaleAndAdd(segPoly[3], v1, normal, -thickness);

                            if (!((count == 0 && this._isClosed) || (count == 1 && k == ks && this._isClosed))) {
                                vertices[off++] = segPoly[0][0]; vertices[off++] = segPoly[0][1];
                                vertices[off++] = segPoly[1][0]; vertices[off++] = segPoly[1][1];
                                vertices[off++] = segPoly[2][0]; vertices[off++] = segPoly[2][1];

                                vertices[off++] = segPoly[1][0]; vertices[off++] = segPoly[1][1];
                                vertices[off++] = segPoly[3][0]; vertices[off++] = segPoly[3][1];
                                vertices[off++] = segPoly[2][0]; vertices[off++] = segPoly[2][1];
                            }

                            vec2.copy(v0, v1);
                            vec2.copy(v1, v2);
                            vec2.copy(segPoly[0], segPoly[2]);
                            vec2.copy(segPoly[1], segPoly[3]);
                        }
                        break;
                    default:
                        break;
                }
                
                if (this._isClosed) {
                    i = count;
                } else {
                    i++;
                }
            } // end of segments loop

            // Last seg
            if (!this._isClosed) {
                vec2.set(normal, v12[1], -v12[0]);
                vec2.scaleAndAdd(segPoly[2], v2, normal, seg.thickness / 2);
                vec2.scaleAndAdd(segPoly[3], v2, normal, -seg.thickness / 2);
            } else {
                vec2.set(segPoly[2], vertices[0], vertices[1]);
                vec2.set(segPoly[3], vertices[2], vertices[3]);
            }
            vertices[off++] = segPoly[0][0]; vertices[off++] = segPoly[0][1];
            vertices[off++] = segPoly[1][0]; vertices[off++] = segPoly[1][1];
            vertices[off++] = segPoly[2][0]; vertices[off++] = segPoly[2][1];

            vertices[off++] = segPoly[1][0]; vertices[off++] = segPoly[1][1];
            vertices[off++] = segPoly[3][0]; vertices[off++] = segPoly[3][1];
            vertices[off++] = segPoly[2][0]; vertices[off++] = segPoly[2][1];
        }
    })()

    CanvasSubpath.prototype.isValid = function() {
        if (this._nFillSegments > 1) {
            return true;
        } else if (this._nFillSegments == 1) {
            if (this._nFillCurveSegements > 0) {
                return true;
            } else {
                if (this.basePolygon.points.length > 2) {
                    return true;
                }
            }
        }
    }

    // Reverse the orientation
    CanvasSubpath.prototype.reverse = function() {
        mathTool.reverse(this.fillSegments, this._nFillSegments, 1);
        mathTool.reverse(this.strokeSegments, this._nStrokeSegments, 1);

        for (var i = 0; i < this._nStrokeSegments; i++) {
            this.strokeSegments[i].reverse();
        }
    }

    CanvasSubpath.prototype.toStatic = function() {
        this.basePolygon.toStatic();
        this.interiorPolygon.toStatic();

        // Clear segements
        this.fillSegments.length = 0;
        this.strokeSegments.length = 0;
        this.fillCurveSegments.length = 0;
    }


    return CanvasSubpath;
});
// Cached list of elements like CanvasPath, CanvasSubpath, CanvasImage, PathGeometry, ImageGeometry
// The objects in list will not be destroyed immediately after clear
define('qtek-2d/context/tool/CachedList',['require'],function(require) {

    

    var CachedList = function(factory, maxRange) {

        this.factory = factory;

        this.maxRange = maxRange || 50;

        this._size = 0;

        this._data = [];

        this._max = 0;
        
        this._needsClearCount = 0;
    }

    CachedList.prototype = {

        constructor : CachedList,

        increase : function() {
            var el = this._data[this._size];
            if (!el) {
                el = this._data[this._size] = new this.factory();
            }
            this._size++;
            return el;
        },

        decrease : function() {
            if (this._size > 0) {
                this._size--;
            }
        },

        clear : function(disposeFunc) {
            this.tick(disposeFunc);
            this._size = 0;
        },

        // Simple strategy to prevent memory leak
        // When subpath number is less than 1/2 of maximum 10 times
        // the size of cache will be reduced to current size
        // 
        // Callback for dispose
        tick : function(disposeFunc) {
            if (
                (this._size > 0 && this._max / this._size > 2)
                || this._max - this._size > this.maxRange
            ) {
                this._needsClearCount ++;
            } else if (this._max < this._size) {
                this._needsClearCount = 0;
                this._max = this._size;
            } else {
                this._needsClearCount = 0;
            }
            if (this._needsClearCount > 10) {
                if (disposeFunc) {
                    // Callback to do dispose
                    for (var i = this._size; i < this._data.length; i++) {
                        disposeFunc(this._data[i]);
                    }
                }
                this._max = this._data.length = this._size;
            }
        },

        size : function() {
            return this._size;
        },

        data : function() {
            return this._data;
        },

        get : function(idx) {
            return this._data[idx];
        }
    }

    return CachedList;
});
define('qtek-2d/context/CanvasPath',['require','qtek/math/Matrix2d','./DrawingStyle','./CanvasSubpath','./tool/CachedList','./CanvasElement','./tool/math','qtek/core/util'],function(require) {

    

    var Matrix2d = require('qtek/math/Matrix2d');

    var DrawingStyle = require('./DrawingStyle');
    var CanvasSubpath = require('./CanvasSubpath');
    var CachedList = require('./tool/CachedList');
    var CanvasElement = require('./CanvasElement');
    var mathTool = require('./tool/math');

    var qtekUtil = require('qtek/core/util');

    //
    var ARC_SEG_RADIAN = Math.PI / 4;
    var PI2 = Math.PI * 2;

    var CanvasPath = function() {

        // Element type
        this.eType = CanvasPath.eType;

        // A path has a list of zero or more subpaths.
        // Each subpath consists of a list of one or more points.
        // connected by straight or curved lines.
        // and a flag indicating whether the subpath is closed or not
        // A closed subpath is one where the last point of the subpath
        // is connected to the first point of the subpath by a straight line
        this.subpaths = new CachedList(CanvasSubpath);

        this.drawingStyle = new DrawingStyle();
        this.transform = new Matrix2d();

        // Depth in z
        this.depth = 0;

        // Current subpath
        this._subpath = null;

        this._fill = false;
        this._stroke = false;

        this._firstCmd = false;

        this._xi = 0;
        this._yi = 0;

        // Pre calculated vertices data
        this._verticesData = null;

        this._fillColorChanged = true;
        this._strokeColorChanged = true;

        this._isStatic = false;
    }
    CanvasPath.prototype = {

        constructor : CanvasPath,

        getHashKey : function() {
            return this.eType;
        },

        setStyle : function(styleName, value) {
            if (styleName == 'fillStyle') {
                this.setFillStyle(value);
            } else if (styleName == 'strokeStyle') {
                this.setStrokeStyle(value);
            } else if (styleName == 'lineWidth') {

            } else {
                this.drawingStyle[styleName] = value;
            }
        },

        setStrokeLineWidth : function(lineWidth) {
            if (!this._stroke) {
                return;
            }
            if (this._isStatic) {
                console.warn("Static path can't change its stroke line width");
                return;
            }

            if (lineWidth !== this.drawingStyle.lineWidth) {
                this.drawingStyle.lineWidth = lineWidth;

                var subpaths = this.subpaths.data();
                for (var i = 0; i < this.subpaths.size(); i++) {
                    subpaths[i].updateStrokeThickness(lineWidth);
                }

                this._updateStrokeVertices();
            }
        },

        setFillStyle : function(color) {
            this.drawingStyle.setFillStyle(color);
            this._fillColorChanged = true;
        },

        setStrokeStyle : function(color) {
            this.drawingStyle.setStrokeStyle(color);
            this._strokeColorChanged = true;
        },

        setGlobalAlpha : function(alpha) {
            this.drawingStyle.globalAlpha = alpha;
            this._strokeColorChanged = true;
            this._fillColorChanged = true;
        },

        moveTo : function(x, y) {
            if (this._subpath) {
                this._endSubpath();
            }
            this._firstCmd = false;
            this._subpath = this._beginSubpath(x, y);

            this._xi = x;
            this._yi = y;
        },

        lineTo : function(x, y, thickness) {
            if (!this._subpath) {
                if (this._firstCmd) {
                    this._subpath = this._beginSubpath(x, y);
                    this._xi = x;
                    this._yi = y;
                    this._firstCmd = false;
                    return;
                } else {
                    this._subpath = this._beginSubpath(this._xi, this._yi);
                }
            }
            var isClosed = this._subpath.addLine(this._xi, this._yi, x, y, thickness);
            if (isClosed) {
                // Close the current subpath and begin a new one
                this._endSubpath();
            }

            this._xi = x;
            this._yi = y;
        },

        bezierCurveTo : function(cp1x, cp1y, cp2x, cp2y, x, y, thickness) {
            if (!this._subpath) {
                if (this._firstCmd) {
                    this._subpath = this._beginSubpath(x, y);
                    this._xi = x;
                    this._yi = y;
                    this._firstCmd = false;
                    return;
                } else {
                    this._subpath = this._beginSubpath(this._xi, this._yi);
                }
            }
            var isClosed = this._subpath.addCubicBezierCurve(this._xi, this._yi, cp1x, cp1y, cp2x, cp2y, x, y, thickness);
            if (isClosed) {
                // Close the current subpath and begin a new one
                this._endSubpath();
            }

            this._xi = x;
            this._yi = y;
        },

        quadraticCurveTo : function(cpx, cpy, x, y, thickness) {
            if (!this._subpath) {
                if (this._firstCmd) {
                    this._subpath = this._beginSubpath(x, y);
                    this._xi = x;
                    this._yi = y;
                    this._firstCmd = false;
                    return;
                } else {
                    this._subpath = this._beginSubpath(this._xi, this._yi);
                }
            }
            var isClosed = this._subpath.addQuadraticBezierCurve(this._xi, this._yi, cpx, cpy, x, y, thickness);
            if (isClosed) {
                // Close the current subpath and begin a new one
                this._endSubpath();
            }
            this._xi = x;
            this._yi = y;
        },

        // PENDING
        arc : function(x, y, r, startAngle, endAngle, anticlockwise, thickness) {
            if (typeof(anticlockwise) == 'undefined') {
                anticlockwise = false;
            }
            // Add a connect line between current point to start point of circle
            var x0 = x + r * Math.cos(startAngle);
            var y0 = y + r * Math.sin(startAngle);
            if (!this._subpath) {
                this._subpath = this._beginSubpath(x0, y0);
                this._xi = x0;
                this._yi = y0;

                this._firstCmd = false;
            }

            if (!(mathTool.approxEqualInt(x0, this._xi) && mathTool.approxEqualInt(y0, this._yi))) {
                this._subpath.addLine(this._xi, this._yi, x0, y0, thickness);
            }
            if (r == 0) {
                return;
            }
            if (mathTool.approxEqual(startAngle, endAngle)) {
                return;
            }

            // Thresh to [0, 360]
            startAngle = startAngle % PI2;
            endAngle = endAngle % PI2;
            if (startAngle < 0) {
                startAngle = startAngle + PI2;
            }
            if (endAngle < 0) {
                endAngle = endAngle + PI2;
            }
            if (anticlockwise) {
                // Make sure start angle is larger than end angle
                if (startAngle <= endAngle) {
                    endAngle = endAngle - PI2;
                }
            } else {
                // Make sure start angle is smaller than end angle
                if (startAngle >= endAngle) {
                    endAngle = endAngle + PI2;
                }
            }

            // Simulate arc with bezier curve
            // "APPROXIMATION OF A CUBIC BEZIER CURVE BY CIRCULAR ARCS AND VICE VERSA"
            var tmp = endAngle - startAngle;
            var nSeg = Math.ceil(Math.abs(tmp) / ARC_SEG_RADIAN * r / 50);
            if (nSeg < 4) {
                nSeg = 4;
            }
            var gap = tmp / nSeg;

            var start = startAngle;
            var end, x1, y1, x2, y2, x3, y3;
            var tanPhi;
            var k = 0.5522847498;
            for (var i = 0; i < nSeg; i++) {
                end = start + gap;
                if (anticlockwise) {
                    if (end < endAngle) {
                        end = endAngle;
                        gap = end - start;
                    }
                } else {
                    if (end > endAngle) {
                        end = endAngle;
                        gap = end - start;
                    }
                }
                x3 = x + r * Math.cos(end);
                y3 = y + r * Math.sin(end);

                tanPhi = Math.tan(gap / 2);
                x1 = x0 - k * (y0 - y) * tanPhi;
                y1 = y0 + k * (x0 - x) * tanPhi;
                x2 = x3 + k * (y3 - y) * tanPhi;
                y2 = y3 - k * (x3 - x) * tanPhi;

                var isClosed = this._subpath.addCubicBezierCurve(x0, y0, x1, y1, x2, y2, x3, y3, thickness);
                if (isClosed) {
                    // Close the current subpath and begin a new one
                    this._endSubpath();
                    break;
                }

                x0 = x3;
                y0 = y3;
                start = end;
            }

            this._xi = x3;
            this._yi = y3;
        },

        arcTo : function() {

        },

        rect : function(x, y, w, h, thickness) {
            // Use a new subpath
            this._endSubpath();
            this._subpath = this._beginSubpath(x, y);

            this._firstCmd = false;

            this._subpath.addLine(x, y, x, y+h, thickness);
            this._subpath.addLine(x, y+h, x+w, y+h, thickness);
            this._subpath.addLine(x+w, y+h, x+w, y, thickness);
            this._subpath.addLine(x+w, y, x, y, thickness);

            this._xi = x;
            this._yi = y;

            this._endSubpath();
        },

        begin : function(ctx) {
            this.subpaths.clear();
            this._subpath = null;

            this._stroke = this._fill = false;
            this._isStatic = false;

            this._firstCmd = true;
        },

        end : function(ctx) {
            this._endSubpath();

            this.updateVertices();
        },

        // The stroke() method will trace the intended path, using the CanvasRenderingContext2D object for the line styles.
        stroke : function(ctx) {
            if (this._subpath) {
                // PENDING
                this._endSubpath();
            }

            this.drawingStyle.setStrokeStyle(ctx.strokeStyle);
            this.drawingStyle.lineWidth = ctx.lineWidth;
            this.drawingStyle.globalAlpha = ctx.globalAlpha;

            Matrix2d.copy(this.transform, ctx.currentTransform);

            // TODO
            // The stroke style is affected by the transformation during painting, even if the intended path is the current default path.
            
            // Extract scale
            var m = ctx.currentTransform._array;
            var sx = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
            var sy = Math.sqrt(m[2] * m[2] + m[3] * m[3]);
            var subpaths = this.subpaths.data();
            for (var i = 0; i < this.subpaths.size(); i++) {
                subpaths[i].stroke(sx, sy);
            }

            this._stroke = true;
        },

        // The fill() method will fill all the subpaths of the intended path
        // using fillStyle, and using the non-zero winding number rule. 
        fill : function(ctx) {
            if (this._subpath) {
                this._endSubpath();
            }
            
            this.drawingStyle.setFillStyle(ctx.fillStyle);
            this.drawingStyle.globalAlpha = ctx.globalAlpha;
            Matrix2d.copy(this.transform, ctx.currentTransform);
            
            var subpaths = this.subpaths.data();
            for (var i = 0; i < this.subpaths.size(); i++) {
                subpaths[i].fill();
            }

            this._fill = true;
        },

        hasFill : function() {
            return this._fill;
        },

        hasStroke : function() {
            return this._stroke;
        },

        close : function(thickness) {
            if (this._subpath) {
                this._subpath.close(thickness);
            }
        },

        // Update attributes data
        updateVertices : function() {
            if (!this._verticesData) {
                this._verticesData = {}
            }
            if (this._fill) {
                this._updateFillVertices();
            }
            if (this._stroke) {
                this._updateStrokeVertices();
            }
        },

        _updateFillVertices : function() {
            if (!this._verticesData.fill) {
                this._verticesData.fill = {
                    position : null,
                    coord : null
                }
            }
            var fillData = this._verticesData.fill;
            fillData.dirty = true;

            var nVertices = 0;
            var subpaths = this.subpaths.data();
            var nSubpaths = this.subpaths.size();
            for (var s = 0; s < nSubpaths; s++) {
                var subpath = subpaths[s];
                if (!subpath._fill) {
                    continue;
                }
                nVertices += subpath.interiorPolygon.triangles.length;
                for (var k = 0; k < subpath.fillCurveSegments.length; k++) {
                    nVertices += subpath.fillCurveSegments[k].triangles.length;
                }
            }

            if (!fillData.position || fillData.position.length !== nVertices * 3) {
                // Re allocate
                fillData.position = new Float32Array(nVertices * 3);
                fillData.coord = new Float32Array(nVertices * 3);
            }

            var positionArr = fillData.position;
            var coordArr = fillData.coord;

            var z = this.depth;

            var offset3 = 0;

            for (var s = 0; s < nSubpaths; s++) {
                var subpath = subpaths[s];
                if (!subpath._fill) {
                    continue;
                }
                var interiorPoly = subpath.interiorPolygon;
                // Add interior triangles
                for (var i = 0; i < interiorPoly.triangles.length; i++) {
                    var idx = interiorPoly.triangles[i];
                    // Set position
                    positionArr[offset3] = interiorPoly.points[idx * 2];
                    positionArr[offset3 + 1] = interiorPoly.points[idx * 2 + 1];
                    positionArr[offset3 + 2] = z;
                    // Coord
                    coordArr[offset3] = 0;
                    coordArr[offset3 + 1] = 1;
                    coordArr[offset3 + 2] = 1;

                    offset3 += 3;
                }
                // Add cubic bezier curve triangles
                var curves = subpath.fillCurveSegments;
                for (var i = 0; i < curves.length; i++) {
                    var curve = curves[i];
                    for (var j = 0; j < curve.triangles.length; j++) {
                        var idx = curve.triangles[j];
                        var cps = curve.points;
                        var coords = curve.coords;

                        coordArr[offset3] = coords[idx * 3];
                        coordArr[offset3 + 1] = coords[idx * 3 + 1];
                        coordArr[offset3 + 2] = coords[idx * 3 + 2];
                        // Set position
                        positionArr[offset3] = cps[idx * 2];
                        positionArr[offset3 + 1] = cps[idx * 2 + 1];
                        positionArr[offset3 + 2] = z;

                        offset3 += 3;
                    }
                }
            }
        },

        _updateStrokeVertices : function() {
            if (!this._verticesData.stroke) {
                this._verticesData.stroke = {
                    position : null
                }
            }
            var strokeData = this._verticesData.stroke;
            strokeData.dirty = true;

            var nVertices = 0;
            var nSubpaths = this.subpaths.size();
            var subpaths = this.subpaths.data();
            for (var s = 0; s < nSubpaths; s++) {
                var subpath = subpaths[s];
                if (!subpath._stroke) {
                    continue;
                }
                nVertices += subpath.strokeVerticesArray.length / 2;
            }

            if (!strokeData.position || strokeData.position.length !== nVertices * 3) {
                // Re allocate
                strokeData.position = new Float32Array(nVertices * 3);
            }
            var positionArr = strokeData.position;

            var offset3 = 0;

            var z = this.depth;

            var nSubpaths = this.subpaths.size();
            var subpaths = this.subpaths.data();

            for (var s = 0; s < nSubpaths; s++) {
                var subpath = subpaths[s];
                var vertices = subpath.strokeVerticesArray;
                if (!subpath._stroke) {
                    continue;
                }
                for (var i = 0; i < vertices.length / 2; i++) {
                    // Set position
                    positionArr[offset3] = vertices[i * 2];
                    positionArr[offset3 + 1] = vertices[i * 2 + 1];
                    // Add a offset to avoid z conflict
                    positionArr[offset3 + 2] = z + 0.002;

                    offset3 += 3;
                }
            }
        },

        // Methods provided for Path Primitive
        getFillVertices : function() {
            return this._verticesData.fill;
        },

        getFillVertexNumber : function() {
            return this._verticesData.fill.position.length / 3;
        },

        getStrokeVertices : function() {
            return this._verticesData.stroke;
        },

        getStrokeVertexNumber : function() {
            return this._verticesData.stroke.position.length / 3;
        },

        afterDraw : function() {
            this.transform._dirty = false;
            this._fillColorChanged = false;
            this._strokeColorChanged = false;

            if (this._fill) {
                this._verticesData.fill.dirty = false;
            }
            if (this._stroke) {
                this._verticesData.stroke.dirty = false;
            }
        },

        clone : function(ctx) {
            var path = new CanvasPath();

            if (!(this._fill || this._stroke)) {
                console.warn('Path must have fill or stroke');
                return path;
            }

            path._fill = this._fill;
            path._stroke = this._stroke;

            path.depth = ctx.requestDepthChannel();
            
            path.drawingStyle.copy(this.drawingStyle);
            path.transform.copy(this.transform);

            path._verticesData = {
                fill: qtekUtil.clone(this._verticesData.fill),
                stroke: qtekUtil.clone(this._verticesData.stroke)
            };

            if (path._verticesData.fill) {
                path._verticesData.fill.dirty = true;
            }
            if (path._verticesData.stroke) {
                path._verticesData.stroke.dirty = true;
            }

            return path;
        },

        toStatic : function() {
            var subpaths = this.subpaths.data();
            var nSubpaths = this.subpaths.size();

            for (var i = 0; i < nSubpaths; i++) {
                subpaths[i].toStatic();
            }

            this._isStatic = true;
        },

        _endSubpath : function() {
            // Use current subpath if it is valid
            if (this._subpath) {
                if (this._subpath.isValid()) {
                    this._subpath.end();
                } else {
                    this.subpaths.decrease();
                }
                this._subpath = null;
            }
        },

        _beginSubpath : function(x, y) {
            // Begin a new sub path
            var subpath = this.subpaths.increase();
            subpath.begin(x, y);
            return subpath;
        }
    };

    CanvasPath.eType = CanvasElement.register(CanvasPath, null, null);

    return CanvasPath;
});

;
define("qtek-2d/context/CanvasPointCloud", function(){});

define('qtek-2d/context/Geometry2D',['require','qtek/Geometry','qtek/StaticGeometry'],function(require) {

    var Geometry = require('qtek/Geometry');
    var StaticGeometry = require('qtek/StaticGeometry');

    var Geometry2D = Geometry.derive({

        _enabledAttributes : null,

        hint : Geometry.DYNAMIC_DRAW
    }, {

        dirty : function() {
            this._cache.dirtyAll();
        },

        getVertexNumber : StaticGeometry.prototype.getVertexNumber,

        getFaceNumber : StaticGeometry.prototype.getFaceNumber,

        isUseFace : StaticGeometry.prototype.isUseFace,

        getEnabledAttributes : StaticGeometry.prototype.getEnabledAttributes,

        getBufferChunks : StaticGeometry.prototype.getBufferChunks,

        _updateBuffer : StaticGeometry.prototype._updateBuffer
    });

    return Geometry2D;
});
define('qtek-2d/context/Primitive',['require','qtek/Renderable','./Geometry2D','qtek/Material','qtek/Shader'],function(require) {
    
    'use strict'
    
    var Renderable = require('qtek/Renderable');
    var Geometry2D = require('./Geometry2D');
    var Material = require('qtek/Material');
    var Shader = require('qtek/Shader');

    var Primitive = Renderable.derive({

        culling : false,

        mode : Renderable.TRIANGLES
    }, {

        updateElements : function() {},
        addElement : function() {},
        clearElements : function() {},

        render : Renderable.prototype.render
    });

    return Primitive;
});

define('qtek-2d/context/shader/path.essl',[],function () { return '@export buildin.2d.path.vertex\n\nattribute vec3 position;\nattribute vec4 color;\nattribute vec3 t0;\nattribute vec3 t1;\nattribute vec3 coord;\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nvarying vec4 v_Color;\nvarying vec3 v_klm;\n\nvoid main()\n{\n    mat3 localTransform = mat3(\n        t0.x, t1.x, 0.0,\n        t0.y, t1.y, 0.0,\n        t0.z, t1.z, 1.0\n    );\n    vec3 pos2d = vec3(position.xy, 1.0);\n    pos2d = localTransform * pos2d;\n    vec4 pos3d = vec4(pos2d.xy, position.z, 1.0);\n\n    v_Color = color;\n    v_klm = coord;\n    gl_Position = worldViewProjection * pos3d;\n}\n\n@end\n\n\n@export buildin.2d.path.fragment\n\nvarying vec4 v_Color;\nvarying vec3 v_klm;\n\n#ifdef ANTIALIASING\n    #extension GL_OES_standard_derivatives : enable\n#endif\n\nvoid main()\n{\n    #ifdef ANTIALIASING\n        // Gradients\n        vec3 px = dFdx(v_klm);\n        vec3 py = dFdy(v_klm);\n        // Chain rule\n        float k2 = v_klm.x * v_klm.x;\n        float c = k2 * v_klm.x - v_klm.y * v_klm.z;\n        float k23 = 3.0 * k2;\n        float cx = k23 * px.x - v_klm.z * px.y - v_klm.y * px.z;\n        float cy = k23 * py.x - v_klm.z * py.y - v_klm.y * py.z;\n        // Signed distance\n        float sd = c / sqrt(cx * cx + cy * cy);\n\n        float alpha = clamp(0.5 - sd, 0.0, 1.0);\n\n    #else\n        float alpha = step(v_klm.x * v_klm.x * v_klm.x, v_klm.y * v_klm.z);\n    #endif\n\n    gl_FragColor = v_Color;\n    gl_FragColor.a *= alpha;\n\n    if (gl_FragColor.a < 1e-3) {\n        discard;\n    }\n}\n\n@end';});

define('qtek-2d/context/PathPrimitive',['require','qtek/Geometry','qtek/Material','qtek/Shader','./Geometry2D','./CanvasPath','./CanvasElement','./Primitive','./shader/path.essl'],function(require) {
    
    

    var Geometry = require('qtek/Geometry');
    var Material = require('qtek/Material');
    var Shader = require('qtek/Shader');
    var Geometry2D = require('./Geometry2D');
    var CanvasPath = require('./CanvasPath');
    var CanvasElement = require('./CanvasElement');
    var Primitive = require('./Primitive');
    
    Shader.import(require('./shader/path.essl'));

    var pathShader = new Shader({
        vertex : Shader.source('buildin.2d.path.vertex'),
        fragment : Shader.source('buildin.2d.path.fragment')
    });
    pathShader.define('fragment', 'ANTIALIASING');

    var PathPrimitive = Primitive.derive(function() {
        return {
            geometry : new Geometry2D({
                attributes : {
                    position : new Geometry.Attribute('position', 'float', 3, null, false),
                    // Fill color
                    color : new Geometry.Attribute('position', 'float', 4, null, false),
                    // Transform
                    t0 : new Geometry.Attribute('t0', 'float', 3, null, false),
                    t1 : new Geometry.Attribute('t1', 'float', 3, null, false),
                    // Curve coords of texture space
                    coord : new Geometry.Attribute('coord', 'float', 3, null, false)
                }
            }),
            material : new Material({
                shader : pathShader,
                transparent : true,
                // TODO
                // depthTest should not enabled (Or self intersected path will not drawn properly)
                // But if depth test is disabled, depthMask will also be force disabled
                depthMask : true,
                depthTest : true
            }),
            _paths : [],

            _needsUpdateAll: false
        };
    }, {

        addElement : function(path) {
            this._paths.push(path);
            this._needsUpdateAll = true;
        },

        clearElements : function() {
            this._paths.length = 0;
        },

        updateElements : function() {
            var geo = this.geometry;

            var nVertices = 0;
            for (var i = 0; i < this._paths.length; i++) {
                var path = this._paths[i];
                if (path.hasFill()) {
                    nVertices += this._paths[i].getFillVertexNumber();
                }
                if (path.hasStroke()) {
                    nVertices += this._paths[i].getStrokeVertexNumber();
                }
            }

            var needsUpdateAll = this._needsUpdateAll;
            if (!geo.attributes.position.value || (geo.getVertexNumber() !== nVertices)) {
                // Re allocate
                geo.attributes.position.value = new Float32Array(nVertices * 3);
                geo.attributes.color.value = new Float32Array(nVertices * 4);
                geo.attributes.t0.value = new Float32Array(nVertices * 3);
                geo.attributes.t1.value = new Float32Array(nVertices * 3);
                geo.attributes.coord.value = new Float32Array(nVertices * 3);

                needsUpdateAll = true;
            }

            var offset3 = 0;
            var offset4 = 0;

            var t0Arr = geo.attributes.t0.value;
            var t1Arr = geo.attributes.t1.value;
            var colorArr = geo.attributes.color.value;
            var positionArr = geo.attributes.position.value;
            var coordArr = geo.attributes.coord.value;

            for (var i = 0; i < this._paths.length; i++) {
                var path = this._paths[i];
                var mat = path.transform._array;
                var z = path.depth;
                var alpha = path.drawingStyle.globalAlpha;

                var nFillVertices = 0;
                var nStrokeVertices = 0;
                // -------
                // Fill
                if (path.hasFill()) {
                    nFillVertices = path.getFillVertexNumber();
                    var data = path.getFillVertices();
                    if (data.dirty || needsUpdateAll) {
                        coordArr.set(data.coord, offset3);
                        positionArr.set(data.position, offset3);
                    }
                    // Update z
                    for (var k = offset3 + 2; k < nFillVertices * 3 + offset3; k += 3) {
                        positionArr[k] = z;
                    }

                    if (path._fillColorChanged || needsUpdateAll) {
                        var color = path.drawingStyle.fillStyle;
                        for (var k = 0; k < nFillVertices; k++) {
                            // Set fill style
                            colorArr[offset4++] = color[0];
                            colorArr[offset4++] = color[1];
                            colorArr[offset4++] = color[2];
                            colorArr[offset4++] = color[3] * alpha;
                        }
                    } else {
                        offset4 += nFillVertices * 4;
                    }

                    offset3 += nFillVertices * 3;
                }

                // -------
                // Stroke
                if (path.hasStroke()) {
                    nStrokeVertices = path.getStrokeVertexNumber();
                    var data = path.getStrokeVertices();
                    if (data.dirty || needsUpdateAll) {
                        positionArr.set(data.position, offset3);
                    }
                    if (needsUpdateAll) {
                        for (var k = offset3; k < offset3 + nStrokeVertices * 3;) {
                            coordArr[k++] = 0;
                            coordArr[k++] = 1;
                            coordArr[k++] = 1;
                        }
                    }
                    // Update z
                    for (var k = offset3 + 2; k < offset3 + nStrokeVertices * 3; k += 3) {
                        positionArr[k] = z + 0.002;
                    }

                    if (path._strokeColorChanged || needsUpdateAll) {
                        var color = path.drawingStyle.strokeStyle;
                        for (var k = 0; k < nStrokeVertices; k++) {
                            // Set fill style
                            colorArr[offset4++] = color[0];
                            colorArr[offset4++] = color[1];
                            colorArr[offset4++] = color[2];
                            colorArr[offset4++] = color[3] * alpha;
                        }
                    } else {
                        offset4 += nStrokeVertices * 4;
                    }
                }
                
                offset3 -= nFillVertices * 3;
                // -----
                // Transform
                if (path.transform._dirty || needsUpdateAll) {
                    for (var k = 0; k < nFillVertices + nStrokeVertices; k++) {
                        // Set t0
                        t0Arr[offset3] = mat[0];
                        t0Arr[offset3 + 1] = mat[2];
                        t0Arr[offset3 + 2] = mat[4];
                        // Set t1
                        t1Arr[offset3] = mat[1];
                        t1Arr[offset3 + 1] = mat[3];
                        t1Arr[offset3 + 2] = mat[5];

                        offset3 += 3;
                    }
                } else {
                    offset3 += (nFillVertices + nStrokeVertices) * 3;
                }
            }

            this._needsUpdateAll = false;

            geo.dirty();
        }
    });

    CanvasElement.setPrimitiveClass(CanvasPath.eType, PathPrimitive);

    return PathPrimitive;
});

define('qtek-2d/context/shader/image.essl',[],function () { return '@export buildin.2d.image.vertex\n\nattribute vec3 position;\nattribute vec2 texcoord;\nattribute vec3 t0;\nattribute vec3 t1;\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nvarying vec2 v_Uv;\n\nvoid main()\n{\n    mat3 localTransform = mat3(\n        t0.x, t1.x, 0.0,\n        t0.y, t1.y, 0.0,\n        t0.z, t1.z, 1.0\n    );\n    vec3 pos2d = vec3(position.xy, 1.0);\n    pos2d = localTransform * pos2d;\n    vec4 pos3d = vec4(pos2d.xy, position.z, 1.0);\n\n    gl_Position = worldViewProjection * pos3d;\n    v_Uv = texcoord;\n}\n\n@end\n\n\n@export buildin.2d.image.fragment\n\nuniform sampler2D sprite;\n\nvarying vec2 v_Uv;\n\nvoid main()\n{\n    gl_FragColor = texture2D(sprite, v_Uv);\n}\n\n@end';});

define('qtek-2d/context/ImagePrimitive',['require','qtek/Geometry','qtek/Material','qtek/Shader','./Geometry2D','./CanvasImage','./CanvasElement','./Primitive','glmatrix','./shader/image.essl'],function(require) {
    
    

    var Geometry = require('qtek/Geometry');
    var Material = require('qtek/Material');
    var Shader = require('qtek/Shader');
    var Geometry2D = require('./Geometry2D');
    var CanvasImage = require('./CanvasImage');
    var CanvasElement = require('./CanvasElement');
    var Primitive = require('./Primitive');

    var glMatrix = require('glmatrix');
    var vec2 = glMatrix.vec2;

    Shader.import(require('./shader/image.essl'));

    var imageShader = new Shader({
        vertex : Shader.source('buildin.2d.image.vertex'),
        fragment : Shader.source('buildin.2d.image.fragment')
    });
    imageShader.enableTexture('sprite');

    var ImagePrimitive = Primitive.derive(function() {
        return {
            geometry : new Geometry2D({
                attributes : {
                    position : new Geometry.Attribute('position', 'float', 3, null, false),
                    texcoord : new Geometry.Attribute('texcoord', 'float', 2, null, false),
                    t0 : new Geometry.Attribute('t0', 'float', 3, null, false),
                    t1 : new Geometry.Attribute('t1', 'float', 3, null, false)
                }
            }),
            material : new Material({
                shader : imageShader,
                transparent : true,
                depthMask : true,
                depthTest : true
            }),
            
            _images : [],

            _inDescendantOrder: false
        };
    }, {

        addElement : function(image) {
            this._images.push(image);
        },

        clearElements : function() {
            this._images.length = 0;
            this._inDescendantOrder = false;
        },

        updateElements : function(disableBlending) {
            if (this._images.length == 0) {
                return;
            }
            var geo = this.geometry;
            var nVertices = this._images.length * 6;

            if (!(geo.attributes.position.value) || (geo.getVertexNumber() !== nVertices)) {
                // Re allocate
                geo.attributes.position.value = new Float32Array(nVertices * 3);
                geo.attributes.texcoord.value = new Float32Array(nVertices * 2);
                geo.attributes.t0.value = new Float32Array(nVertices * 3);
                geo.attributes.t1.value = new Float32Array(nVertices * 3);
            }

            var texture = this._images[0].getTexture();
            this.material.set('sprite', texture);

            var offset3 = 0;
            var offset2 = 0;

            var t0Arr = geo.attributes.t0.value;
            var t1Arr = geo.attributes.t1.value;

            // Reverse images list from near to far
            // Simply do reverse not sort because the elements will be always add by painters in 
            // far to near order
            // 
            // TODO
            // If image is transparent and overlapped, the result will wrong, many pixels that should be
            // drawn will be discarded
            if (disableBlending && !this._inDescendantOrder) {
                for (var i = 0, len = this._images.length; i < Math.floor(len / 2); i++) {
                    var i2 = len - 1;
                    var tmp = this._images[i];
                    this._images[i] = this._images[i2];
                    this._images[i2] = tmp;
                }
                this._inDescendantOrder = true;
            }

            for (var i = 0; i < this._images.length; i++) {
                var image = this._images[i];
                var z = image.depth;
                var mat = image.transform._array;
                var data = image.getVertices();
                geo.attributes.position.value.set(data.position, offset3);
                geo.attributes.texcoord.value.set(data.texcoord, offset2);

                // Update z
                for (var k = offset3 + 2; k < 18 + offset3; k += 3) {
                    geo.attributes.position.value[k] = z;
                }

                for (var k = 0; k < 6; k++) {
                    // Set t0
                    t0Arr[offset3] = mat[0];
                    t0Arr[offset3 + 1] = mat[2];
                    t0Arr[offset3 + 2] = mat[4];
                    // Set t1
                    t1Arr[offset3] = mat[1];
                    t1Arr[offset3 + 1] = mat[3];
                    t1Arr[offset3 + 2] = mat[5];

                    offset3 += 3;
                    offset2 += 2;
                }
            }

            geo.dirty();
        },

        _sortFunc : function(a, b) {
            return b.depth - a.depth;
        }
    });

    CanvasElement.setPrimitiveClass(CanvasImage.eType, ImagePrimitive);

    return ImagePrimitive;
});
define('qtek-2d/context/tool/ImageAtlas',['require','../CanvasImage','qtek/Texture'],function(require) {

    var CanvasImage = require('../CanvasImage');
    var Texture = require('qtek/Texture');

    var BLOCK_SIZE = 1024;

    var windowsDevicePixelRatio = window.devicePixelRatio || 1.0; 

    var ImageAtlas = function() {

        this._canvas = document.createElement('canvas');
        this._ctx2d = this._canvas.getContext('2d');

        this._offsetX = 0;
        this._offsetY = 0;

        this._texture = null;

        // document.body.appendChild(this._canvas);
    }

    ImageAtlas.prototype.clear = function() {
        this._canvas.width = BLOCK_SIZE * windowsDevicePixelRatio;
        this._canvas.height = BLOCK_SIZE * windowsDevicePixelRatio;
        this._offsetX = this._offsetY = 0;
        this._nBlockSqrt = 1;
        this._ctx2d.clearRect(0, 0, this._canvas.width, this._canvas.height);

        this._ctx2d.scale(windowsDevicePixelRatio, windowsDevicePixelRatio);

        if (this._texture) {
            this._texture.dirty();
        }
    }

    var pxRegex = /([0-9]+)px/;
    ImageAtlas.prototype.addText = function(text, type, tx, ty, maxWidth, _ctx) {
        var ctx = this._ctx2d;
        
        ctx.fillStyle = _ctx.fillStyle;
        ctx.strokeStyle = _ctx.strokeStyle;
        ctx.font = _ctx.font;

        var sx = this._offsetX;
        var sy = this._offsetY;
        
        var width = ctx.measureText(text).width;
        if (typeof(maxWidth) != 'undefined') {
            width = Math.min(width, maxWidth);
        }
        // http://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
        // TODO Height!!!! rendering cn
        // var height = ctx.measureText('m').width;
        var height = Math.max(+pxRegex.exec(ctx.font)[1], ctx.measureText('m').width);
        var lineHeight = height * 1.5;

        if (width > this._canvas.width / windowsDevicePixelRatio) {
            console.warn('Text width no longer than ' + this._canvas.width);
        }

        if (sx + width > this._canvas.width / windowsDevicePixelRatio) {
            sx = 0;
            if (sy + lineHeight > this._canvas.height / windowsDevicePixelRatio) {
                return null;
            } else {
                sy += lineHeight;
            }
        }

        this._offsetY = sy;
        this._offsetX = sx + width;

        if (type == 'fill') {
            if (typeof(maxWidth) != 'undefined') {
                ctx.fillText(text, sx, sy + height, maxWidth);
            } else {
                ctx.fillText(text, sx, sy + height);
            }
        } else {
            if (typeof(maxWidth) != 'undefined') {
                ctx.strokeText(text, sx, sy + height, maxWidth);
            } else {
                ctx.strokeText(text, sx, sy + height);
            }
        }

        // TODO
        switch(_ctx.textAlign) {
            case "start":
                break;
            case "left":
                break;
            case "end":
            case "right":
                tx -= width;
                break;
            case "center":
                tx -= width / 2;
                break;
            default:
                break;
        }
        // TODO
        switch(_ctx.textBaseline) {
            case "alphabetic":
            case "ideographic":
            case "bottom":
                ty -= height;
                break;
            case "top":
            case "hanging":
                break;
            case "middle":
                ty -= height / 2;
                break;
            default:
                break;
        }

        var cImage = new CanvasImage(
            this._canvas, 
            sx * windowsDevicePixelRatio, sy * windowsDevicePixelRatio, width * windowsDevicePixelRatio, lineHeight * windowsDevicePixelRatio,
            tx, ty, width, lineHeight
        );

        if (cImage) {
            this._texture = cImage.getTexture();
            this._texture.minFilter = Texture.NEAREST;
            this._texture.magFilter = Texture.NEAREST;
            this._texture.useMipmap = false;
        }

        return cImage;
    }

    ImageAtlas.prototype.measureText = function(ctx, text) {
        var ctx = this._ctx2d;
        ctx.font = _ctx.font;

        return ctx.measureText(text);
    }

    ImageAtlas.prototype.addImage = function() {

    }

    ImageAtlas.prototype.getTexture = function() {
        return this._texture;
    }

    ImageAtlas.prototype.dispose = function(_gl) {
        this._texture.dispose(_gl);
    }

    return ImageAtlas;
});
define('qtek-2d/context/Painter',['require','qtek/core/Base','qtek/Shader','qtek/math/Matrix2d','qtek/math/Matrix4','./tool/CachedList','./CanvasElement','./PathPrimitive','./ImagePrimitive','./CanvasPath','./CanvasImage','./tool/ImageAtlas'],function(require) {
    
    'use strict'

    var Base = require('qtek/core/Base');
    var Shader = require('qtek/Shader');
    var Matrix2d = require('qtek/math/Matrix2d');
    var Matrix4 = require('qtek/math/Matrix4');

    var CachedList = require('./tool/CachedList');
    var CanvasElement = require('./CanvasElement');
    var PathPrimitive = require('./PathPrimitive');
    var ImagePrimitive = require('./ImagePrimitive');
    var CanvasPath  = require('./CanvasPath');
    var CanvasImage = require('./CanvasImage');
    var ImageAtlas = require('./tool/ImageAtlas');

    var Painter = Base.derive(function() {
        return {
            transform : new Matrix2d(),

            ctx : null,

            _elements : [],

            _primitives : [],

            _primitiveLists : [],

            _textAtlas : new CachedList(ImageAtlas, 2),

            _blending : true,

            _blendFunc : null
        }
    }, function() {
        
        var nFactory = CanvasElement.getClassNumber();

        for (var i = 0; i < nFactory; i++) {
            var Primitive = CanvasElement.getPrimitiveClass(i);
            if (Primitive) {
                this._primitiveLists.push(new CachedList(Primitive, 5));
            } else {
                this._primitiveLists.push(null);
            }
        } 

        this._disposePrimitive = this._disposePrimitive.bind(this);
        this._disposeImageAtlas = this._disposeImageAtlas.bind(this);
    }, {

        addElement : function(el) {
            el.depth = this.ctx.requestDepthChannel();
            this._elements.push(el);
        },

        getElements : function() {
            return this._elements;
        },

        draw : function() {
            var ctx = this.ctx;
            var _gl = ctx.renderer.gl

            if (this._blending) {
                _gl.enable(_gl.BLEND);
            } else {
                _gl.disable(_gl.BLEND);
            }

            for (var i = 0; i < this._primitives.length; i++) {
                Matrix4.fromMat2d(this._primitives[i].worldTransform, this.transform);

                if (this._blending && this._blendFunc) {
                    this._primitives[i].material.blend = this._blendFunc;
                } else {
                    this._primitives[i].material.blend = null;
                }
            }

            ctx.renderer.renderQueue(this._primitives, ctx.camera);

            // FRESH all elements after draw
            for (var i = 0; i < this._elements.length; i++) {
                this._elements[i].afterDraw();
            }
        },

        repaint : function() {
            for (var i = 0; i < this._primitives.length; i++) {
                this._primitives[i].updateElements();
            }

            this.draw();
        },

        enableBlending : function() {
            this._blending = true;
        },

        disableBlending : function() {
            this._blending = false;
        },

        setBlendFunc : function(func) {
            this._blendFunc = func;
        },

        begin : function() {

            this.beginTextAtlas();

            for (var i = 0; i < this._primitives.length; i++) {
                this._primitives[i].clearElements();
            }
            this._primitives.length = 0;
            this._elements.length = 0;
            for (var i = 0; i < this._primitiveLists.length; i++) {
                if (this._primitiveLists[i]) {
                    this._primitiveLists[i].clear(this._disposePrimitive);
                }
            }
        },

        end : function() {
            if (this._blending) {
                // this._elements.sort(this._eleDepthSortFunc);
                var hashKey = null;
                var primitive;
                for (var i = 0; i < this._elements.length; i++) {
                    var el = this._elements[i];
                    var elHashKey = el.getHashKey();
                    if (el.getHashKey() != hashKey) {
                        // Begin a new primitive
                        var list = this._primitiveLists[el.eType];
                        if (list) {
                            primitive = list.increase();
                            primitive.clearElements();   
                        }
                        if (primitive) {
                            this._primitives.push(primitive);
                        }

                        hashKey = elHashKey;
                    }
                    if (primitive) {
                        primitive.addElement(el);
                    }
                }
                for (var i = 0; i < this._primitives.length; i++) {
                    this._primitives[i].updateElements();
                }
            } else {
                // TODO
                for (var i = 0; i < this._primitiveLists.length; i++) {
                    if (this._primitiveLists[i]) {
                        var primitive = this._primitiveLists[i].increase();
                        primitive.clearElements();
                        this._primitives.push(primitive);
                    }
                }
                for (var i = 0; i < this._elements.length; i++) {
                    var el = this._elements[i];
                    var primitive = this._primitiveLists[el.eType].get(0);
                    primitive.addElement(el);
                }
                for (var i = 0; i < this._primitives.length; i++) {
                    this._primitives[i].updateElements(true);
                }
            }
        },

        beginTextAtlas : function() {
            this._textAtlas.clear(this._disposeImageAtlas);
        },

        getNewTextAtlas : function() {
            var textAtlas = this._textAtlas.increase();
            textAtlas.clear();

            return textAtlas;
        },

        endTextAtlas : function() {

        },

        dispose : function() {
            this.begin();
        },

        _disposePrimitive : function(primitive) {
            primitive.geometry.dispose(this.ctx.renderer.gl);
        },

        _disposeImageAtlas : function(imageAtlas) {
            imageAtlas.dispose(this.ctx.renderer.gl);
        },

        _eleDepthSortFunc : function(a, b) {
            // Sort in ascendant order
            // Draw from far to near
            return a.depth - b.depth;
        }
    });

    return Painter;
});

define('qtek-2d/context/shader/deferred/blend.essl',[],function () { return '@export buildin.2d.deferred.blend\n\nuniform sampler2D color1;\nuniform sampler2D depth1;\n\nuniform sampler2D color2;\nuniform sampler2D depth2;\n\nvarying vec2 v_Texcoord;\n\nfloat decodeFloat(const in vec4 colour)\n{\n    const vec4 bitShifts = vec4(1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0);\n    return dot(colour, bitShifts);\n}\n\nvoid main()\n{\n\n    vec4 c1 = texture2D(color1, v_Texcoord);\n    vec4 c2 = texture2D(color2, v_Texcoord);\n\n    #ifdef DEPTH_DECODE\n        float d1 = decodeFloat(texture2D(depth1, v_Texcoord));\n        float d2 = decodeFloat(texture2D(depth2, v_Texcoord));\n    #else\n        float d1 = texture2D(depth1, v_Texcoord).r;\n        float d2 = texture2D(depth2, v_Texcoord).r;\n    #endif\n\n    if (d1 > d2) {\n        gl_FragColor.rgb = c1.rgb * (1.0 - c2.a) + c2.rgb;\n    } else {\n        gl_FragColor.rgb = c2.rgb * (1.0 - c1.a) + c1.rgb;\n    }\n    gl_FragColor.a = c1.a + c2.a - c1.a *c2.a;\n\n    // TODO premultiplied alpha in renderer?\n    gl_FragColor.rgb /= gl_FragColor.a;\n}\n\n@end';});


define('qtek-2d/context/shader/deferred/depth.essl',[],function () { return '@export buildin.2d.deferred.depth.vertex\n\nattribute vec3 position;\nattribute vec3 t0;\nattribute vec3 t1;\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nvoid main()\n{\n    mat3 localTransform = mat3(\n        t0.x, t1.x, 0.0,\n        t0.y, t1.y, 0.0,\n        t0.z, t1.z, 1.0\n    );\n    vec3 pos2d = vec3(position.xy, 1.0);\n    pos2d = localTransform * pos2d;\n    vec4 pos3d = vec4(pos2d.xy, position.z, 1.0);\n\n    gl_Position = worldViewProjection * pos3d;\n}\n\n@end\n\n@export buildin.2d.deferred.depth.fragment\n\nvec4 encodeFloat(const in float depth)\n{\n    const vec4 bitShifts = vec4(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);\n\n    const vec4 bit_mask  = vec4(0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);\n    vec4 res = fract( depth * bitShifts );\n    res -= res.xxyz * bit_mask;\n\n    return res;\n}\n\nvoid main()\n{\n    float depth = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far)\n                    / (gl_DepthRange.far - gl_DepthRange.near);\n\n    gl_FragColor = encodeFloat(depth);\n}\n\n@end\n\n';});

// Deferred Painter only support path and image(text) rendering
define('qtek-2d/context/DeferredPainter',['require','qtek/core/Base','qtek/Shader','qtek/Material','qtek/compositor/Pass','qtek/FrameBuffer','qtek/core/glinfo','qtek/texture/Texture2D','qtek/math/Matrix2d','qtek/math/Matrix4','./tool/CachedList','./CanvasElement','./PathPrimitive','./ImagePrimitive','./CanvasPath','./CanvasImage','./tool/ImageAtlas','./shader/deferred/blend.essl','./shader/deferred/depth.essl'],function(require) {

    

    var Base = require('qtek/core/Base');
    var Shader = require('qtek/Shader');
    var Material = require('qtek/Material');
    var Pass = require('qtek/compositor/Pass');
    var FrameBuffer = require('qtek/FrameBuffer');
    var glinfo = require('qtek/core/glinfo');
    var Texture2D = require('qtek/texture/Texture2D');
    var Matrix2d = require('qtek/math/Matrix2d');
    var Matrix4 = require('qtek/math/Matrix4');

    var CachedList = require('./tool/CachedList');

    var CanvasElement = require('./CanvasElement');
    var PathPrimitive = require('./PathPrimitive');
    var ImagePrimitive = require('./ImagePrimitive');
    var CanvasPath  = require('./CanvasPath');
    var CanvasImage = require('./CanvasImage');
    var ImageAtlas = require('./tool/ImageAtlas');

    Shader.import(require('./shader/deferred/blend.essl'));
    Shader.import(require('./shader/deferred/depth.essl'));

    var depthShader = new Shader({
        vertex : Shader.source('buildin.2d.deferred.depth.vertex'),
        fragment : Shader.source('buildin.2d.deferred.depth.fragment')
    });

    var depthMaterial = new Material({
        shader: depthShader
    });

    var blendPass = new Pass({
        fragment : Shader.source('buildin.2d.deferred.blend')
    });

    var DeferredPainter = Base.derive(function() {
        return {
            transform : new Matrix2d(),

            ctx : null,

            _elements : [],

            _pathPrimitives : [],

            _imagePrimitives : [],

            _textAtlas : new CachedList(ImageAtlas, 2),

            _imagePrimitiveList: new CachedList(ImagePrimitive),

            _pathPrimitiveList: new CachedList(PathPrimitive, 2),

            _pathColorTexture : null,
            _pathDepthTexture : null,

            _imageColorTexture : null,
            _imageDepthTexture : null,

            frameBuffer : new FrameBuffer(),

            _blendFunc : null
        }
    }, {

        addElement : function(el) {
            el.depth = this.ctx.requestDepthChannel();
            this._elements.push(el);
        },

        getElements : function() {
            return this._elements;
        },

        draw : function() {
            var ctx = this.ctx;
            var _gl = ctx.renderer.gl

            _gl.depthMask(true);
            _gl.enable(_gl.BLEND);

            for (var i = 0; i < this._pathPrimitives.length; i++) {
                Matrix4.fromMat2d(this._pathPrimitives[i].worldTransform, this.transform);
                this._pathPrimitives[i].material.blend = this._blendFunc;
            }
            for (var i = 0; i < this._imagePrimitives.length; i++) {
                Matrix4.fromMat2d(this._imagePrimitives[i].worldTransform, this.transform);
                this._imagePrimitives[i].material.blend = this._blendFunc;
            }

            if (this._pathPrimitives.length == 0 || this._imagePrimitives.length == 0) {
                if (this._pathPrimitives.length > 0) {
                    ctx.renderer.renderQueue(this._pathPrimitives, ctx.camera);
                }
                if (this._imagePrimitives.length > 0) {
                    ctx.renderer.renderQueue(this._imagePrimitives, ctx.camera);
                }
            } else {
                var useDepthTexture = glinfo.getExtension(_gl, 'WEBGL_depth_texture');
                // var useDepthTexture = false;

                this._pathColorTexture = this._checkTexture(this._pathColorTexture, ctx);
                this._pathDepthTexture = this._checkTexture(this._pathDepthTexture, ctx);
                this._imageColorTexture = this._checkTexture(this._imageColorTexture, ctx);
                this._imageDepthTexture = this._checkTexture(this._imageDepthTexture, ctx);

                if (useDepthTexture) {
                    this._pathDepthTexture.format = _gl.DEPTH_COMPONENT;
                    this._pathDepthTexture.type = _gl.UNSIGNED_SHORT;
                    this._imageDepthTexture.format = _gl.DEPTH_COMPONENT;
                    this._imageDepthTexture.type = _gl.UNSIGNED_SHORT;
                }
                
                // Render path elements
                this.frameBuffer.attach(_gl, this._pathColorTexture);
                if (useDepthTexture) {
                    this.frameBuffer.attach(_gl, this._pathDepthTexture, _gl.DEPTH_ATTACHMENT);
                }
                this.frameBuffer.bind(ctx.renderer);

                _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
                ctx.renderer.renderQueue(this._pathPrimitives, ctx.camera);
                if (!useDepthTexture) {
                    this.frameBuffer.attach(_gl, this._pathDepthTexture);
                    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
                    ctx.renderer.renderQueue(this._pathPrimitives, ctx.camera, depthMaterial);
                }

                // Render image elemnts
                this.frameBuffer.attach(_gl, this._imageColorTexture);
                if (useDepthTexture) {
                    this.frameBuffer.attach(_gl, this._imageDepthTexture, _gl.DEPTH_ATTACHMENT);
                }
                _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
                ctx.renderer.renderQueue(this._imagePrimitives, ctx.camera);

                if (!useDepthTexture) {
                    this.frameBuffer.attach(_gl, this._imageDepthTexture);
                    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
                    ctx.renderer.renderQueue(this._imagePrimitives, ctx.camera, depthMaterial);
                }

                this.frameBuffer.unbind(ctx.renderer);

                _gl.depthMask(false);
                _gl.disable(_gl.DEPTH_TEST)
                blendPass.setUniform('color1', this._pathColorTexture);
                blendPass.setUniform('depth1', this._pathDepthTexture);
                blendPass.setUniform('color2', this._imageColorTexture);
                blendPass.setUniform('depth2', this._imageDepthTexture);
                blendPass.material.depthTest = false;
                blendPass.material.depthMask = false;
                blendPass.material.transparent = true;
                if (useDepthTexture) {
                    blendPass.material.shader.unDefine('fragment', 'DEPTH_DECODE')
                } else {
                    blendPass.material.shader.define('fragment', 'DEPTH_DECODE')
                }
                ctx.renderer.clear = 0;
                blendPass.render(ctx.renderer);
                ctx.renderer.clear = _gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT;
            }

            // FRESH all elements after draw
            for (var i = 0; i < this._elements.length; i++) {
                // TODO After draw is strangely slow
                this._elements[i].afterDraw();
            }
        },

        _checkTexture : function(texture, ctx) {
            if (
                !texture 
                || texture.width !== ctx.renderer.width
                || texture.height !== ctx.renderer.height
            ) {
                if (texture) {
                    texture.dispose(ctx.renderer.gl);
                }

                texture = new Texture2D({
                    width : ctx.renderer.width,
                    height : ctx.renderer.height,
                    minFilter : ctx.renderer.gl.NEAREST,
                    magFilter : ctx.renderer.gl.NEAREST
                });
            }
            return texture;
        },

        repaint : function() {
            for (var i = 0; i < this._pathPrimitives.length; i++) {
                this._pathPrimitives[i].updateElements();
            }
            for (var i = 0; i < this._imagePrimitives.length; i++) {
                this._imagePrimitives[i].updateElements();
            }

            this.draw();
        },

        setBlendFunc : function(func) {
            this._blendFunc = func;
        },

        begin : function() {
            
            this.beginTextAtlas();

            for (var i = 0; i < this._pathPrimitives.length; i++) {
                this._pathPrimitives[i].clearElements();
            }
            for (var i = 0; i < this._imagePrimitives.length; i++) {
                this._imagePrimitives[i].clearElements();
            }
            this._pathPrimitives.length = 0;
            this._elements.length = 0;

            this._imagePrimitiveList.clear(this._disposePrimitive);
            this._pathPrimitiveList.clear(this._disposePrimitive);
        },

        end : function() {
            // this._elements.sort(this._eleDepthSortFunc);

            var pathPrimitive;
            var imagePrimitive;
            var imageHashKey = null;
            for (var i = 0; i < this._elements.length; i++) {
                var el = this._elements[i];

                switch(el.eType) {
                    case CanvasImage.eType:
                        var key = el.getHashKey();
                        if (imageHashKey !== key) {
                            imageHashKey = key;
                            imagePrimitive = this._imagePrimitiveList.increase();
                            this._imagePrimitives.push(imagePrimitive);
                        }
                        imagePrimitive.addElement(el);
                        break;
                    case CanvasPath.eType:
                        if (!pathPrimitive) {
                            pathPrimitive = this._pathPrimitiveList.increase();
                            this._pathPrimitives.push(pathPrimitive);
                        }
                        pathPrimitive.addElement(el);
                        break;
                    default:
                        console.warn('Deferred painter only support CanvasImage and CanvasPath');
                }
            }

            for (var i = 0; i < this._pathPrimitives.length; i++) {
                this._pathPrimitives[i].updateElements();
            }
            for (var i = 0; i < this._imagePrimitives.length; i++) {
                this._imagePrimitives[i].updateElements();
            }
        },

        beginTextAtlas : function() {
            this._textAtlas.clear(this._disposeImageAtlas);
        },

        getNewTextAtlas : function() {
            var textAtlas = this._textAtlas.increase();
            textAtlas.clear();

            return textAtlas;
        },

        dispose : function() {
            this.begin();
        },

        _disposePrimitive : function(primitive) {
            primitive.geometry.dispose(this.ctx.renderer.gl);
        },

        _disposeImageAtlas : function(imageAtlas) {
            imageAtlas.dispose(this.ctx.renderer.gl);
        },

        _eleDepthSortFunc : function(a, b) {
            // Sort in ascendant order
            // Draw from far to near
            return a.depth - b.depth;
        }
    });

    return DeferredPainter;
});
define('qtek-2d/context/States',['require','glmatrix'],function (require) {
     
    var glMatrix = require('glmatrix');
    var mat2d = glMatrix.mat2d;

    var States = function() {

        this._matrix = mat2d.create();
    }

    States.prototype = {

        constructor : States,

        load : function(ctx) {

            ctx.strokeStyle = this.strokeStyle;

            ctx.fillStyle = this.fillStyle;

            ctx.globalAlpha = this.globalAlpha;

            ctx.lineWidth = this.lineWidth;

            ctx.font = this.font;

            ctx.textBaseline = this.textBaseline;

            ctx.textAlign = this.textAlign;

            mat2d.copy(ctx.currentTransform._array, this._matrix);
        },

        save : function(ctx) {

            this.strokeStyle = ctx.strokeStyle;

            this.fillStyle = ctx.fillStyle;

            this.globalAlpha = ctx.globalAlpha;

            this.lineWidth = ctx.lineWidth;

            this.font = ctx.font;

            this.textBaseline = ctx.textBaseline;

            this.textAlign = ctx.textAlign;

            mat2d.copy(this._matrix, ctx.currentTransform._array);
        }
    }

    return States;
});
define('qtek-2d/context/Context2D',['require','qtek/math/Matrix2d','glmatrix','qtek/core/Base','qtek/Renderer','qtek/camera/Orthographic','./Painter','./DeferredPainter','./CanvasPath','./CanvasImage','./States'],function(require) {
    
    'use strict'
    
    var Matrix2d = require('qtek/math/Matrix2d');
    var glMatrix = require('glmatrix');
    var vec2 = glMatrix.vec2;
    var mat2d = glMatrix.mat2d;

    var Base = require('qtek/core/Base');
    var Renderer = require('qtek/Renderer');
    var OrthoCamera = require('qtek/camera/Orthographic');

    var Painter = require('./Painter');
    var DeferredPainter = require('./DeferredPainter');

    // Canvas Element
    var CanvasPath = require('./CanvasPath');
    var CanvasImage = require('./CanvasImage');

    var States = require('./States');

    var tmpV2 = vec2.create();

    var Context2D = Base.derive({

        canvas : null,

        renderer : null,

        camera : null,

        depthChannelGap : 0.01,

        _path : null,

        _polygon : null,

        _painter : null,

        _textAtlas : null,

        _depth : 1
        
    }, function() {
        var width = this.canvas.width;
        var height = this.canvas.height;

        if (this.canvas && !this.renderer) {
            this.renderer = new Renderer({
                canvas : this.canvas,
                // TODO
                // devicePixelRatio : 1
            });
        }

        if (!this.camera) {
            this.camera = new OrthoCamera({
                left : -width / 2,
                right : width / 2,
                top : height / 2,
                bottom : -height / 2,
                far : 50,
                near : 0
            });
            this.camera.scale.y = -1;
            this.camera.position.x = width / 2;
            this.camera.position.y = height / 2;
            this.camera.position.z = this.camera.far;
            this.camera.update(true);
        }

        this.currentTransform = new Matrix2d();

        this._statesStack = [];

    }, {

        /******************
         * Styles
         *****************/
        strokeStyle : '#000000',

        fillStyle : '#000000',

        globalAlpha : 1,

        shadowOffsetX : 0,

        shadowOffsetY : 0,

        shadowBlur : 0,

        shadowColor : 0,
        
        /******************
         * Fonts
         *****************/
        font : '10px sans-serif',

        textAlign : 'start',

        textBaseline : 'alphabetic',

        /******************
         * Line styles
         *****************/
        lineWidth : 1,

        lineCap : '',

        lineJoin : '',

        save : function() {
            var states = new States();
            states.save(this);
            this._statesStack.push(states);
        },

        restore : function() {
            if (this._statesStack.length > 0) {
                var states = this._statesStack.pop();
                states.load(this);
            }
        },

        /******************
         * Transformation
         *****************/
        scale : function(x, y) {
            tmpV2[0] = x;
            tmpV2[1] = y;
            var m = this.currentTransform._array;
            mat2d.scale(m, m, tmpV2);
        },
        rotate : function(radius) {
            var m = this.currentTransform._array;
            mat2d.rotate(m, m, radius);
        },
        translate : function(x, y) {
            tmpV2[0] = x;
            tmpV2[1] = y;
            var m = this.currentTransform._array;
            mat2d.translate(m, m, tmpV2);
        },

        transform : function(aa, ab, ac, ad, atx, aty) {
            var m = this.currentTransform._array;
            var ba = m[0], bb = m[1], bc = m[2], bd = m[3],
                btx = m[4], bty = m[5];
            m[0] = aa*ba + ab*bc;
            m[1] = aa*bb + ab*bd;
            m[2] = ac*ba + ad*bc;
            m[3] = ac*bb + ad*bd;
            m[4] = ba*atx + bc*aty + btx;
            m[5] = bb*atx + bd*aty + bty;
        },

        setTransform : function(aa, ab, ac, ad, atx, aty) {
            var m = this.currentTransform._array;
            m[0] = aa;
            m[1] = ab;
            m[2] = ac;
            m[3] = ad;
            m[4] = atx;
            m[5] = aty;
        },

        /******************
         * Image drawing
         *****************/
        drawImage : function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
            if (!this._painter) {
                return;
            }
            // End previous path
            if (this._path) {
                this.endPath();
            }
            // drawImage(image, dx, dy)
            if (arguments.length == 3) {
                dx = sx;
                dy = sy;

                sx = 0;
                sy = 0;
                dw = sw = image.width;
                dh = sh = image.height;
            }
            // drawImage(image, dx, dy, dw, dh)
            else if(arguments.length == 5) {
                dx = sx;
                dy = sy;
                dw = sw;
                dh = sh;

                sx = 0;
                sy = 0;
                sw = image.height;
                sh = image.height;
            }

            var cImage = new CanvasImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
            cImage.end(this);

            this._painter.addElement(cImage);

            return cImage;
        },

        /******************
         * Gradient and pattern
         *****************/
        createLinearGradient : function() {},

        createRadialGradient : function() {},
        createPattern : function() {},

        /******************
         * Texts
         *****************/
        strokeText : function(text, x, y, maxWidth) {
            return this._drawText(text, 'stroke', x, y, maxWidth);
        },

        fillText : function(text, x, y, maxWidth) {
            return this._drawText(text, 'fill', x, y, maxWidth);
        },

        _drawText : function(text, type, x, y, maxWidth) {
            if (!this._painter) {
                return;
            }
            // End previous path
            if (this._path) {
                this.endPath();
            }

            if (!this._textAtlas) {
                this._textAtlas = this._painter.getNewTextAtlas();
            }
            var cImage = this._textAtlas.addText(text, type, x, y, maxWidth, this);
            if (!cImage) {
                this._textAtlas = this._painter.getNewTextAtlas();
                cImage = this._textAtlas.addText(text, type, x, y, maxWidth, this);
            }

            cImage.end(this);
            this._painter.addElement(cImage);

            return cImage;
        },

        measureText : function(text) {
            if (!this._textAtlas) {
                this._textAtlas = this._painter.getNewTextAtlas();
            }
            return this._textAtlas.measureText(text);
        },

        /******************
         * Rectangles
         *****************/
        clearRect : function() {},
        fillRect : function() {},
        strokeRect : function() {},

        /******************
         * Paths
         *****************/
        beginPath : function(path) {
            // End previous path
            if (this._path) {
                this.endPath();
            }
            if (!path) {
                path = new CanvasPath();
            }
            path.begin(this);
            this._path = path;

            return path;
        },
        closePath : function() {
            if (this._path) {
                this._path.close(this.lineWidth);
            }
        },
        fill : function() {
            if (this._path) {
                this._path.fill(this);
            }
        },
        stroke : function() {
            if (this._path) {
                this._path.stroke(this);
            }
        },
        clip : function() {
            console.warn('TODO')
        },
        moveTo : function(x, y) {
            if (this._path) {
                this._path.moveTo(x, y);
            }
        },
        lineTo : function(x, y) {
            if (this._path) {
                this._path.lineTo(x, y, this.lineWidth);
            }
        },
        quadraticCurveTo : function(cpx, cpy, x, y) {
            if (this._path) {
                this._path.quadraticCurveTo(cpx, cpy, x, y, this.lineWidth);
            }
        },
        bezierCurveTo : function(cp1x, cp1y, cp2x, cp2y, x, y) {
            if (this._path) {
                this._path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y, this.lineWidth);
            }
        },
        arc : function(x, y, radius, startAngle, endAngle, anticlockwise) {
            if (this._path) {
                this._path.arc(x, y, radius, startAngle, endAngle, anticlockwise, this.lineWidth);
            }
        },
        arcTo : function() {},
        rect : function(x, y, w, h) {
            if (this._path) {
                this._path.rect(x, y, w, h, this.lineWidth);
            }
        },
        isPointInPath : function() {},

        /******************
         * Image data
         *****************/
        createImageData : function() {},
        getImageData : function() {},
        putImageData : function() {},

        /******************
         * Extend methods
         *****************/
        beginDraw : function(painter, painterType) {
            if (!painter) {
                if (painterType == 'deferred') {
                    painter = new DeferredPainter();
                } else {
                    painter = new Painter();
                }
            }
            this.setPainter(painter);

            return painter;
        },

        setPainter : function(painter) {
            if (this._painter !== painter) {
                if (this._painter) {
                    this._painter.end();
                }
                painter.ctx = this;
                this._textAtlas = null;
                this._painter = painter;
                painter.begin();   
            }
        },

        addPath : function(path) {
            if (this._painter) {
                this._painter.addElement(path);
            }
        },
        addImage: function(image) {
            if (this._painter) {
                this._painter.addElement(image);
            }
        },
        clearColor : function(color) {
            var _gl = this.renderer.gl;
            if (color) {
                _gl.clearColor(color[0], color[1], color[2], color[3]);
            }
            _gl.clear(_gl.COLOR_BUFFER_BIT);
        },
        clearDepth : function() {
            var _gl = this.renderer.gl;
            _gl.clear(_gl.DEPTH_BUFFER_BIT);
            this._depth = 1;
        },
        clear : function(color) {
            var _gl = this.renderer.gl;
            if (color) {
                _gl.clearColor(color[0], color[1], color[2], color[3]);
            }
            _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
            this._depth = 1;
        },
        endDraw : function() {
            if (this._painter) {
                if (this._path) {
                    this.endPath();
                }
                this._painter.end();
                // Do thre draw ?
                this._painter.draw();
                this._painter = null;
            }
        },
        repaint : function(painter) {
            var els = painter.getElements();
            var lastEl = els[els.length - 1];
            if (lastEl) {
                this.setDepthChannel(lastEl.depth);
            }
            painter.repaint();
        },
        draw : function(painter) {
            var els = painter.getElements();
            var lastEl = els[els.length - 1];
            if (lastEl) {
                this.setDepthChannel(lastEl.depth);
            }
            painter.draw();
        },
        // Force to end current path
        endPath : function() {
            if (this._path) {
                this._path.end(this);
                if (this._painter) {
                    this._painter.addElement(this._path);
                }
                this._path = null;
            }
        },
        // Get current depth channel
        requestDepthChannel : function() {
            this.setDepthChannel(this._depth + this.depthChannelGap);
            return this._depth;
        },
        setDepthChannel : function(depth) {
            this._depth = depth;
            if (this._depth > this.camera.far) {
                this.camera.far *= 2;
                this.camera.position.z = this.camera.far;
                this.camera.update(true);
            }
        },
        identity : function() {
            mat2d.identity(this.currentTransform._array);
        },
        resize: function(width, height) {
            this.renderer.resize(width, height);
            width = this.renderer.width;
            height = this.renderer.height;

            this.camera.left = -width / 2;
            this.camera.right = width / 2;
            this.camera.top = height / 2;
            this.camera.bottom = -height / 2;

            this.camera.position.x = width / 2;
            this.camera.position.y = height / 2;

            this.camera.update(true);
        }
    });

    return Context2D;
});
;
define("qtek-2d/context/PointCloudPrimitive", function(){});

// Copyright 2011 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

define('qtek-2d/context/tool/SplayTree',['require'],function (require) {

    /**
     * Constructs a Splay tree node.
     *
     * @param {number} key Key.
     * @param {*} value Value.
     */
    SplayTree.Node = function(key, value) {
      this.key = key;
      this.value = value;
      this.left = null;
      this.right = null;
    };

    /**
     * Performs an ordered traversal of the subtree starting at
     * this SplayTree.Node.
     *
     * @param {function(SplayTree.Node)} f Visitor function.
     * @param {*} extra value want to used in the visitor
     * @private
     */
    SplayTree.Node.prototype.traverse = function(f, val) {
      var current = this;
      while (current) {
        var left = current.left;
        if (left) left.traverse(f, val);
        f(current, val);
        current = current.right;
      }
    };


    /**
     * Constructs a Splay tree.  A splay tree is a self-balancing binary
     * search tree with the additional property that recently accessed
     * elements are quick to access again. It performs basic operations
     * such as insertion, look-up and removal in O(log(n)) amortized time.
     *
     * @constructor
     */
    function SplayTree() {
    };


    /**
     * Pointer to the root node of the tree.
     *
     * @type {SplayTree.Node}
     * @private
     */
    SplayTree.prototype.root_ = null;


    /**
     * @return {boolean} Whether the tree is empty.
     */
    SplayTree.prototype.isEmpty = function() {
      return !this.root_;
    };


    /**
     * Inserts a node into the tree with the specified key and value if
     * the tree does not already contain a node with the specified key. If
     * the value is inserted, it becomes the root of the tree.
     *
     * @param {number} key Key to insert into the tree.
     * @param {*} value Value to insert into the tree.
     */
    SplayTree.prototype.insert = function(key, value) {
      if (this.isEmpty()) {
        this.root_ = new SplayTree.Node(key, value);
        return this.root_;
      }
      // Splay on the key to move the last node on the search path for
      // the key to the root of the tree.
      this.splay_(key);
      if (this.root_.key == key) {
        return;
      }
      var node = new SplayTree.Node(key, value);
      if (key > this.root_.key) {
        node.left = this.root_;
        node.right = this.root_.right;
        this.root_.right = null;
      } else {
        node.right = this.root_;
        node.left = this.root_.left;
        this.root_.left = null;
      }
      this.root_ = node;
      return node;
    };


    /**
     * Removes a node with the specified key from the tree if the tree
     * contains a node with this key. The removed node is returned. If the
     * key is not found, an exception is thrown.
     *
     * @param {number} key Key to find and remove from the tree.
     * @return {SplayTree.Node} The removed node.
     */
    SplayTree.prototype.remove = function(key) {
      if (this.isEmpty()) {
        throw Error('Key not found: ' + key);
      }
      this.splay_(key);
      if (this.root_.key != key) {
        throw Error('Key not found: ' + key);
      }
      var removed = this.root_;
      if (!this.root_.left) {
        this.root_ = this.root_.right;
      } else {
        var right = this.root_.right;
        this.root_ = this.root_.left;
        // Splay to make sure that the new root has an empty right child.
        this.splay_(key);
        // Insert the original right child as the right child of the new
        // root.
        this.root_.right = right;
      }
      return removed;
    };


    /**
     * Returns the node having the specified key or null if the tree doesn't contain
     * a node with the specified key.
     *
     * @param {number} key Key to find in the tree.
     * @return {SplayTree.Node} Node having the specified key.
     */
    SplayTree.prototype.find = function(key) {
      if (this.isEmpty()) {
        return null;
      }
      this.splay_(key);
      return this.root_.key == key ? this.root_ : null;
    };


    /**
     * @return {SplayTree.Node} Node having the maximum key value.
     */
    SplayTree.prototype.findMax = function(opt_startNode) {
      if (this.isEmpty()) {
        return null;
      }
      var current = opt_startNode || this.root_;
      while (current.right) {
        current = current.right;
      }
      return current;
    };


    /**
     * @return {SplayTree.Node} Node having the maximum key value that
     *     is less than the specified key value.
     */
    SplayTree.prototype.findGreatestLessThan = function(key) {
      if (this.isEmpty()) {
        return null;
      }
      // Splay on the key to move the node with the given key or the last
      // node on the search path to the top of the tree.
      this.splay_(key);
      // Now the result is either the root node or the greatest node in
      // the left subtree.
      if (this.root_.key < key) {
        return this.root_;
      } else if (this.root_.left) {
        return this.findMax(this.root_.left);
      } else {
        return null;
      }
    };


    /**
     * @return {Array<*>} An array containing all the keys of tree's nodes.
     */
    SplayTree.prototype.exportKeys = function() {
      var result = [];
      if (!this.isEmpty()) {
        this.root_.traverse(function(node) { result.push(node.key); });
      }
      return result;
    };


    /**
     * Perform the splay operation for the given key. Moves the node with
     * the given key to the top of the tree.  If no node has the given
     * key, the last node on the search path is moved to the top of the
     * tree. This is the simplified top-down splaying algorithm from:
     * "Self-adjusting Binary Search Trees" by Sleator and Tarjan
     *
     * @param {number} key Key to splay the tree on.
     * @private
     */
    // Create a dummy node.  The use of the dummy node is a bit
    // counter-intuitive: The right child of the dummy node will hold
    // the L tree of the algorithm.  The left child of the dummy node
    // will hold the R tree of the algorithm.  Using a dummy node, left
    // and right will always be nodes and we avoid special cases.
    SplayTree.prototype.splay_ = function(key) {
      if (this.isEmpty()) {
        return;
      }
      var dummy, left, right;
      dummy = left = right = new SplayTree.Node(null, null);
      var current = this.root_;
      while (true) {
        if (key < current.key) {
          if (!current.left) {
            break;
          }
          if (key < current.left.key) {
            // Rotate right.
            var tmp = current.left;
            current.left = tmp.right;
            tmp.right = current;
            current = tmp;
            if (!current.left) {
              break;
            }
          }
          // Link right.
          right.left = current;
          right = current;
          current = current.left;
        } else if (key > current.key) {
          if (!current.right) {
            break;
          }
          if (key > current.right.key) {
            // Rotate left.
            var tmp = current.right;
            current.right = tmp.left;
            tmp.left = current;
            current = tmp;
            if (!current.right) {
              break;
            }
          }
          // Link left.
          left.right = current;
          left = current;
          current = current.right;
        } else {
          break;
        }
      }
      // Assemble.
      left.right = current.left;
      right.left = current.right;
      current.left = dummy.right;
      current.right = dummy.left;
      this.root_ = current;
    };

    SplayTree.prototype.traverse = function(f, val) {
      if (this.root_) {
        this.root_.traverse(f, val);
      }
    }

    SplayTree.prototype.traverseBreadthFirst = function (f) {
      if (f(this.root_.value)) return;

      var stack = [this.root_];
      var length = 1;

      while (length > 0) {
        var new_stack = new Array(stack.length * 2);
        var new_length = 0;
        for (var i = 0; i < length; i++) {
          var n = stack[i];
          var l = n.left;
          var r = n.right;
          if (l) {
            if (f(l.value)) return;
            new_stack[new_length++] = l;
          }
          if (r) {
            if (f(r.value)) return;
            new_stack[new_length++] = r;
          }
        }
        stack = new_stack;
        length = new_length;
      }
    };

    SplayTree.prototype.clear = function() {
      this.root_ = null;
    }

    return SplayTree;
});
define('qtek-2d/shape/Circle',['require','../Node','qtek/math/Vector2'],function(require){

    var Node = require('../Node');
    var Vector2 = require("qtek/math/Vector2");

    var Circle = Node.derive(function() {
        return {
            center : new Vector2(),
            radius : 0   
        }

    }, {
        computeBoundingBox : function() {
            this.boundingBox = {
                min : new Vector2(this.center.x-this.radius, this.center.y-this.radius),
                max : new Vector2(this.center.x+this.radius, this.center.y+this.radius)
            }
        },
        draw : function(ctx) {

            ctx.beginPath();
            ctx.arc(this.center.x, this.center.y, this.radius, 0, 2*Math.PI, false);
            
            if (this.stroke) {
                ctx.stroke();
            }
            if (this.fill) {
                ctx.fill();
            }
        },
        intersect : function() {

            return vec2.len([this.center[0]-x, this.center[1]-y]) < this.radius;
        }
    } )

    return Circle;
});
/**
 *
 * @export{object}
 */
define('qtek-2d/util',['require','qtek/math/Vector2','glmatrix'],function(require) {
    
    var Vector2 = require("qtek/math/Vector2");
    var glMatrix = require("glmatrix");
    var vec2 = glMatrix.vec2;

    var tmp = new Vector2();

    var util =  {
        fixPos: function(pos) {
            pos.x += 0.5;
            pos.y += 0.5;
            return pos;
        },
        fixPosArray : function(poslist) {
            var len = poslist.length;
            for(var i = 0; i < len; i++) {
                this.fixPos(poslist[i]);
            }
            return poslist;
        },
        computeBoundingBox : function(points, min, max) {
            var left = points[0].x;
            var right = points[0].x;
            var top = points[0].y;
            var bottom = points[0].y;
            
            for (var i = 1; i < points.length; i++) {
                var p = points[i];
                if (p.x < left) {
                    left = p.x;
                }
                if (p.x > right) {
                    right = p.x;
                }
                if (p.y < top) {
                    top = p.y;
                }
                if (p.y > bottom) {
                    bottom = p.y;
                }
            }
            min.set(left, top);
            max.set(right, bottom);
        },

        // http://pomax.github.io/bezierinfo/#extremities
        computeCubeBezierBoundingBox : function(p0, p1, p2, p3, min, max) {
            var xDim = util._computeCubeBezierExtremitiesDim(p0.x, p1.x, p2.x, p3.x);
            var yDim = util._computeCubeBezierExtremitiesDim(p0.y, p1.y, p2.y, p3.y);

            xDim.push(p0.x, p3.x);
            yDim.push(p0.y, p3.y);

            var left = Math.min.apply(null, xDim);
            var right = Math.max.apply(null, xDim);
            var top = Math.min.apply(null, yDim);
            var bottom = Math.max.apply(null, yDim);

            min.set(left, top);
            max.set(right, bottom);
        },

        _computeCubeBezierExtremitiesDim : function(p0, p1, p2, p3) {
            var extremities = [];

            var b = 6 * p2 - 12 * p1 + 6 * p0;
            var a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2;
            var c = 3 * p1 - 3 * p0;

            var tmp = b * b - 4 * a * c;
            if (tmp > 0){
                var tmpSqrt = Math.sqrt(tmp);
                var t1 = (-b + tmpSqrt) / (2 * a);
                var t2 = (-b - tmpSqrt) / (2 * a);
                extremities.push(t1, t2);
            } else if(tmp == 0) {
                extremities.push(-b / (2 * a));
            }
            var result = [];
            for (var i = 0; i < extremities.length; i++) {
                var t = extremities[i];
                if (Math.abs(2 * a * t + b) > 0.0001 && t < 1 && t > 0) {
                    var ct = 1 - t;
                    var val = ct * ct * ct * p0 
                            + 3 * ct * ct * t * p1
                            + 3 * ct * t * t * p2
                            + t * t *t * p3;

                    result.push(val);
                }
            }

            return result;
        },

        // http://pomax.github.io/bezierinfo/#extremities
        computeQuadraticBezierBoundingBox : function(p0, p1, p2, min, max) {
            // Find extremities, where derivative in x dim or y dim is zero
            var tmp = (p0.x + p2.x - 2 * p1.x);
            // p1 is center of p0 and p2 in x dim
            if (tmp === 0) {
                var t1 = 0.5;
            } else {
                var t1 = (p0.x - p1.x) / tmp;
            }

            tmp = (p0.y + p2.y - 2 * p1.y);
            // p1 is center of p0 and p2 in y dim
            if (tmp === 0) {
                var t2 = 0.5;
            } else {
                var t2 = (p0.y - p1.y) / tmp;
            }

            t1 = Math.max(Math.min(t1, 1), 0);
            t2 = Math.max(Math.min(t2, 1), 0);

            var ct1 = 1-t1;
            var ct2 = 1-t2;

            var x1 = ct1 * ct1 * p0.x + 2 * ct1 * t1 * p1.x + t1 * t1 * p2.x;
            var y1 = ct1 * ct1 * p0.y + 2 * ct1 * t1 * p1.y + t1 * t1 * p2.y;

            var x2 = ct2 * ct2 * p0.x + 2 * ct2 * t2 * p1.x + t2 * t2 * p2.x;
            var y2 = ct2 * ct2 * p0.y + 2 * ct2 * t2 * p1.y + t2 * t2 * p2.y;

            return util.computeBoundingBox(
                        [p0.clone(), p2.clone(), new Vector2(x1, y1), new Vector2(x2, y2)],
                        min, max
                    );
        },
        // http://stackoverflow.com/questions/1336663/2d-bounding-box-of-a-sector
        computeArcBoundingBox : (function(){
            var start = new Vector2();
            var end = new Vector2();
            // At most 4 extremities
            var extremities = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];
            return function(center, radius, startAngle, endAngle, clockwise, min, max) {
                clockwise = clockwise ? 1 : -1;
                start
                    .set(Math.cos(startAngle), Math.sin(startAngle) * clockwise)
                    .scale(radius)
                    .add(center);
                end
                    .set(Math.cos(endAngle), Math.sin(endAngle) * clockwise)
                    .scale(radius)
                    .add(center);
                
                startAngle = startAngle % (Math.PI * 2);
                if (startAngle < 0) {
                    startAngle = startAngle + Math.PI * 2;
                }
                endAngle = endAngle % (Math.PI * 2);
                if (endAngle < 0) {
                    endAngle = endAngle + Math.PI * 2;
                }

                if (startAngle > endAngle) {
                    endAngle += Math.PI * 2;
                }
                var number = 0;
                for (var angle = 0; angle < endAngle; angle += Math.PI / 2) {
                    if (angle > startAngle) {
                        extremities[number++]
                            .set(Math.cos(angle), Math.sin(angle) * clockwise)
                            .scale(radius)
                            .add(center);
                    }
                }
                var points = extremities.slice(0, number)
                points.push(start, end);
                util.computeBoundingBox(points, min, max);
            }
        })()
    }

    return util;
} );
define('qtek-2d/shape/Rectangle',['require','../Node','../util','qtek/math/Vector2'],function(require){

    var Node = require('../Node');
    var util = require('../util');
    var Vector2 = require("qtek/math/Vector2");

    var Rectangle = Node.derive( function() {
        return {
            start : new Vector2(0, 0),
            size : new Vector2(0, 0)
        }
    }, {
        computeBoundingBox : function() {
            return {
                min : this.start.clone(),
                max : this.size.clone().add(this.start)
            }
        },
        draw : function(ctx) {

            var start = this.start;

            ctx.beginPath();
            ctx.rect(start.x, start.y, this.size.x, this.size.y);
            if (this.stroke){
                ctx.stroke();
            }
            if (this.fill){
                ctx.fill();
            }
        },
        intersect : function(x, y) {
            return this.intersectBoundingBox(x, y);
        }
    })

    return Rectangle;
});
define('qtek-2d/shape/Ellipse',['require','../Node','qtek/math/Vector2'],function(require){

    var Node = require('../Node');
    var Vector2 = require("qtek/math/Vector2");

    var Ellipse = Node.derive(function() {
        return {
            center : new Vector2(),
            radius : new Vector2()   
        }

    }, {
        computeBoundingBox : function() {
            this.boundingBox = {
                min : this.center.clone().sub(this.radius),
                max : this.center.clone().add(this.radius)
            }
        },
        draw : function(ctx) {
            ctx.save();
            ctx.translate(this.center.x, this.center.y);
            ctx.scale(1, this.radius.y / this.radius.x);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius.x, 0, 2*Math.PI, false);
            
            if (this.stroke) {
                ctx.stroke();
            }
            if (this.fill) {
                ctx.fill();
            }
            ctx.restore();
        },
        intersect : function() {

            return vec2.len([this.center[0]-x, this.center[1]-y]) < this.radius;
        }
    } )

    return Ellipse;
});
define('qtek-2d/shape/Line',['require','../Node','../util','qtek/math/Vector2'],function(require) {

    var Node = require('../Node');
    var util = require('../util');
    var Vector2 = require("qtek/math/Vector2");

    var Line = Node.derive(function() {
        return {
            start : new Vector2(),
            end : new Vector2(),
            width : 0   //virtual width of the line for intersect computation 
        }
    }, {
        computeBoundingBox : function() {

            this.boundingBox = util.computeBoundingBox(
                                    [this.start, this.end],
                                    this.boundingBox.min,
                                    this.boundingBox.max
                                );
            
            if (this.boundingBox.min.x == this.boundingBox.max.x) { //line is vertical
                this.boundingBox.min.x -= this.width/2;
                this.boundingBox.max.x += this.width/2;
            }
            if (this.boundingBox.min.y == this.boundingBox.max.y) { //line is horizontal
                this.boundingBox.min.y -= this.width/2;
                this.boundingBox.max.y += this.width/2;
            }
        },
        draw : function(ctx) {
            
            var start = this.start,
                end = this.end;

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

        },
        intersect : function() {
            var a = new Vector2();
            var ba = new Vector2();
            var bc = new Vector2();

            return function(x, y) {
                if (!this.intersectBoundingBox(x, y)) {
                    return false;
                }
                var b = this.start;
                var c = this.end;

                a.set(x, y);
                ba.copy(a).sub(b);
                bc.copy(c).sub(b);

                var bal = ba.length();
                var bcl = bc.length();

                var tmp = bal * ba.scale(1/bal).dot(bcl.scale(1/bcl));

                var distSquare = bal * bal -  tmp * tmp;
                return distSquare < this.width * this.width * 0.25;
            }
        }
    });

    return Line;
});
/**
 *
 * Inspired by path in paper.js
 */
define('qtek-2d/shape/Path',['require','../Node','../util','qtek/math/Vector2'],function(require) {

    var Node = require('../Node');
    var util = require('../util');
    var Vector2 = require("qtek/math/Vector2");

    var minTmp = new Vector2();
    var maxTmp = new Vector2();

    var Path = Node.derive(function() {
        return {
            segments : [],
            closePath : false
        }
    }, {
        computeBoundingBox : function() {
            var l = this.segments.length;
            var segs = this.segments;

            var min = this.boundingBox.min;
            var max = this.boundingBox.max;
            min.set(999999, 999999);
            max.set(-999999, -999999);
            
            for (var i = 1; i < l; i++) {
                if (segs[i-1].handleOut || segs[i].handleIn) {
                    var bb = util.computeCubeBezierBoundingBox(
                                segs[i-1].point,
                                segs[i-1].handleOut || segs[i-1].point,
                                segs[i].handleIn || segs[i].point,
                                segs[i].point,
                                minTmp, maxTmp
                            );
                    min.min(minTmp);
                    max.max(maxTmp);
                } else {
                    min.min(segs[i-1].point);
                    min.min(segs[i].point);

                    max.max(segs[i-1].point);
                    max.max(segs[i].point);
                }
            }
        },
        draw : function(ctx) {
            
            var l = this.segments.length;
            var segs = this.segments;
            
            ctx.beginPath();
            ctx.moveTo(segs[0].point.x, segs[0].point.y);
            for (var i = 1; i < l; i++) {
                if (segs[i-1].handleOut || segs[i].handleIn) {
                    var prevHandleOut = segs[i-1].handleOut || segs[i-1].point;
                    var handleIn = segs[i].handleIn || segs[i].point;
                    ctx.bezierCurveTo(prevHandleOut.x, prevHandleOut.y,
                            handleIn.x, handleIn.y, segs[i].point.x, segs[i].point.y);
                } else {
                    ctx.lineTo(segs[i].point.x, segs[i].point.y);
                }
            }
            if (this.closePath) {
                if (segs[l-1].handleOut || segs[0].handleIn) {
                    var prevHandleOut = segs[l-1].handleOut || segs[l-1].point;
                    var handleIn = segs[0].handleIn || segs[0].point;
                    ctx.bezierCurveTo(prevHandleOut.x, prevHandleOut.y,
                            handleIn.x, handleIn.y, segs[0].point.x, segs[0].point.y);
                } else {
                    ctx.lineTo(segs[0].point.x, segs[0].point.y);
                }
            }
            if (this.fill) {
                ctx.fill();
            }
            if (this.stroke) {
                ctx.stroke();
            }
        },
        smooth : function(degree) {

            var len = this.segments.length;
            var segs = this.segments;

            var v = new Vector2();
            for (var i = 0; i < len; i++) {
                var point = segs[i].point;
                var prevPoint = (i == 0) ? segs[len-1].point : segs[i-1].point;
                var nextPoint = (i == len-1) ? segs[0].point : segs[i+1].point;
                var degree = segs[i].smoothLevel || degree || 1;

                v.copy(nextPoint).sub(prevPoint).scale(0.25);

                //use degree to scale the handle length
                v.scale(degree);
                if (!segs[i].handleIn) {
                    segs[i].handleIn = point.clone().sub(v);
                } else {
                    segs[i].handleIn.copy(point).sub(v);
                }
                if (!segs[i].handleOut) {
                    segs[i].handleOut = point.clone().add(v);
                } else {
                    segs[i].handleOut.copy(point).add(v);
                }
            }
        },
        pushPoints : function(points) {
            for (var i = 0; i < points.length; i++) {
                this.segments.push({
                    point : points[i],
                    handleIn : null,
                    handleOut : null
                })
            }
        }
    })

    return Path;
});
define('qtek-2d/shape/Polygon',['require','../Node','../util','qtek/math/Vector2'],function(require) {

    var Node = require('../Node');
    var util = require('../util');
    var Vector2 = require("qtek/math/Vector2");

    var Polygon = Node.derive(function() {
        return {
            points : []
        }
    }, {
        computeBoundingBox : function() {
            this.boundingBox = util.computeBoundingBox(
                                    this.points,
                                    this.boundingBox.min,
                                    this.boundingBox.max
                                );
        },
        draw : function(ctx) {

            var points = this.points;

            ctx.beginPath();
            
            ctx.moveTo(points[0].x, points[0].y);
            for (var i =1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            if (this.stroke) {
                ctx.stroke();
            }
            if (this.fill) {
                ctx.fill();
            }
        },
        intersect : function(x, y) {
    
            if (!this.intersectBoundingBox(x, y)) {
                return false;
            }

            var len = this.points.length;
            var angle = 0;
            var points = this.points;
            var vec1 = new Vector2();
            var vec2 = new Vector2();
            for (var i =0; i < len; i++) {
                vec1.set(x, y).sub(points[i]).normalize().negate();
                var j = (i+1)%len;
                vec2.set(x, y).sub(points[j]).normalize().negate();
                var piece = Math.acos(vec1.dot(vec2));
                angle += piece;
            }
            return Math.length(angle - 2*Math.PI) < 0.001;
        }
    })

    return Polygon;
});
define('qtek-2d/shape/Text',['require','../Node','../util','qtek/math/Vector2'],function(require) {

    var Node = require('../Node');
    var util = require('../util');
    var Vector2 = require("qtek/math/Vector2");

    var Text = Node.derive( function() {
        return {
            text : '',
            start : new Vector2(),
            size : new Vector2()
        }
    }, {
        computeBoundingBox : function() {
            this.boundingBox = {
                min : this.start.clone(),
                max : this.start.clone().add(this.size)
            }
        },
        draw : function(ctx) {
            var start = this.start;
            if (this.fill) {
                this.size.length && this.size.x ?
                    ctx.fillText(this.text, start.x, start.y, this.size.x) :
                    ctx.fillText(this.text, start.x, start.y);
            }
            if (this.stroke) {
                this.size.length && this.size.x ?
                    ctx.strokeText(this.text, start.x, start.y, this.size.x) :
                    ctx.strokeText(this.text, start.x, start.y);
            }
        },
        resize : function(ctx) {
            if (! this.size.x || this.needResize) {
                this.size.x = ctx.measureText(this.text).width;
                this.size.y = ctx.measureText('m').width;
            }
        },
        intersect : function(x, y) {
            return this.intersectBoundingBox(x, y);
        }
    })

    return Text;
});
/**
 * Text Box
 * Support word wrap and word break
 * Drawing is based on the Text
 * @export{class} TextBox
 *
 * TODO: support word wrap of non-english text
 *      shift first line by (lineHeight-fontSize)/2
 */
define('qtek-2d/shape/TextBox',['require','../Node','qtek/math/Vector2','./Text','qtek/core/util'],function(require) {

    var Node = require('../Node');
    var Vector2 = require("qtek/math/Vector2");
    var Text = require('./Text');
    var util = require('qtek/core/util')

    var TextBox = Node.derive(function() {
        return {
            start           : new Vector2(),
            width           : 0,
            wordWrap        : false,
            wordBreak       : false,
            lineHeight      : 0,
            stroke          : false,
            // private prop, save Text instances
            _texts          : []
        }
    }, function() {
        // to verify if the text is changed
        this._oldText = "";
    }, {
        computeBoundingBox : function() {
            // TODO
        },
        draw : function(ctx) {
            if (this.text != this._oldText) {
                this._oldText = this.text;

                //set font for measureText
                if (this.font) {
                    ctx.font = this.font;
                }
                if (this.wordBreak) {
                    this._texts = this.computeWordBreak(ctx);
                }
                else if (this.wordWrap) {
                    this._texts = this.computeWordWrap(ctx);
                }
                else{
                    var txt = new Text({
                        text : this.text
                    })
                    this.extendCommonProperties(txt);
                    this._texts = [txt]
                }
            }

            ctx.save();
            ctx.textBaseline = 'top';
            for (var i = 0; i < this._texts.length; i++) {
                var _text = this._texts[i];
                _text.draw(ctx);
            }
            ctx.restore();
        },
        computeWordWrap : function(ctx) {
            if (! this.text) {
                return;
            }
            var words = this.text.split(' ');
            var len = words.length;
            var lineWidth = 0;
            var wordWidth;
            var wordText;
            var texts = [];
            var txt;

            var wordHeight = ctx.measureText("m").width;

            for(var i = 0; i < len; i++) {
                wordText = i == len-1 ? words[i] : words[i]+' ';
                wordWidth = ctx.measureText(wordText).width;
                if (lineWidth + wordWidth > this.width ||
                    ! txt) {    //first line
                    // create a new text line and put current word
                    // in the head of new line
                    txt = new Text({
                        text : wordText, //append last word
                        start : this.start.clone().add(new Vector2(0, this.lineHeight*(texts.length+1) - wordHeight))
                    })
                    this.extendCommonProperties(txt);
                    texts.push(txt);

                    lineWidth = wordWidth;
                }else{
                    lineWidth += wordWidth;
                    txt.text += wordText;
                }
            }
            return texts;
        },
        computeWordBreak : function(ctx) {
            if (! this.text) {
                return;
            }
            var len = this.text.length;
            var letterWidth;
            var letter;
            var lineWidth = ctx.measureText(this.text[0]).width;
            var texts = [];
            var txt;

            var wordHeight = ctx.measureText("m").width;

            for (var i = 0; i < len; i++) {
                letter = this.text[i];
                letterWidth = ctx.measureText(letter).width;
                if (lineWidth + letterWidth > this.width || 
                    ! txt) {    //first line
                    var txt = new Text({
                        text : letter,
                        start : this.start.clone().add(new Vector2(0, this.lineHeight*(texts.length+1) - wordHeight))
                    });
                    this.extendCommonProperties(txt);
                    texts.push(txt);
                    // clear prev line states
                    lineWidth = letterWidth;
                } else {
                    lineWidth += letterWidth;
                    txt.text += letter;
                }
            }
            return texts;
        },
        extendCommonProperties : function(txt) {
            var props = {};
            util.extend(txt, {
                fill : this.fill,
                stroke : this.stroke
            })
        },
        intersect : function(x, y) {
        }
    })

    return TextBox;
});
/**
 * 
 * @export{class} SVGPath
 */
define('qtek-2d/shape/SVGPath',['require','../Node','../util','qtek/math/Vector2'],function(require) {

    var Node = require("../Node");
    var util = require("../util");
    var Vector2 = require("qtek/math/Vector2");

    var availableCommands = {'m':1,'M':1,'z':1,'Z':1,'l':1,'L':1,'h':1,'H':1,'v':1,'V':1,'c':1,'C':1,'s':1,'S':1,'q':1,'Q':1,'t':1,'T':1,'a':1,'A':1}

    var SVGPath = Node.derive(function() {
        return {
            description : '',
            _ops : []
        }
    }, {
        draw : function(ctx) {
            if (!this._ops.length) {
                this.parse();
            }
            ctx.beginPath();
            for (var i = 0; i < this._ops.length; i++) {
                var op = this._ops[i];
                switch(op[0]) {
                    case 'm':
                        ctx.moveTo(op[1] || 0, op[2] || 0);
                        break;
                    case 'l':
                        ctx.lineTo(op[1] || 0, op[2] || 0);
                        break;
                    case 'c':
                        ctx.bezierCurveTo(op[1] || 0, op[2] || 0, op[3] || 0, op[4] || 0, op[5] || 0, op[6] || 0);
                        break;
                    case 'q':
                        ctx.quadraticCurveTo(op[1] || 0, op[2] || 0, op[3] || 0, op[4] || 0);
                        break;
                    case 'z':
                        ctx.closePath();
                        break;
                }
            }
            if (this.fill) {
                ctx.fill();
            }
            if (this.stroke) {
                ctx.stroke();
            }
        },

        computeBoundingBox : (function() {
            // Temp variables
            var current = new Vector2();
            var p1 = new Vector2();
            var p2 = new Vector2();
            var p3 = new Vector2();

            var minTmp = new Vector2();
            var maxTmp = new Vector2();

            return function() {
                if (!this._ops.length) {
                    this.parse();
                }
                var min = new Vector2(999999, 999999);
                var max = new Vector2(-999999, -999999);

                for (var i = 0; i < this._ops.length; i++) {
                    var op = this._ops[i];
                    switch(op[0]) {
                        case 'm':
                            current.set(op[1], op[2]);
                            break;
                        case 'l':
                            p1.set(op[1], op[2]);
                            current.copy(p1);
                            min.min(current).min(p1);
                            max.max(current).max(p1);
                            break;
                        case 'c':
                            p1.set(op[1], op[2]);
                            p2.set(op[3], op[4]);
                            p3.set(op[5], op[6]);
                            util.computeCubeBezierBoundingBox(current, p1, p2, p3, minTmp, maxTmp);
                            current.copy(p3);
                            min.min(minTmp);
                            max.max(maxTmp);
                            break;
                        case 'q':
                            p1.set(op[1], op[2]);
                            p2.set(op[3], op[4]);
                            var bb = util.computeQuadraticBezierBoundingBox(current, p1, p2, minTmp, maxTmp);
                            current.copy(p2);
                            min.min(minTmp);
                            min.max(maxTmp);
                            break;
                        case 'z':
                            break;
                    }
                }

                this.boundingBox = {
                    min : min,
                    max : max
                }
            }
        })(),

        parse : function(description) {
            // point x, y
            var x = 0;
            var y = 0;
            // control point 1(in cube bezier curve and quadratic bezier curve)
            var x1 = 0;
            var y1 = 0;
            // control point 2(in cube bezier curve)
            var x2 = 0;
            var y2 = 0;

            // pre process
            description = description || this.description;
            var d = description.replace(/\s*,\s*/g, ' ');
            d = d.replace(/(-)/g, ' $1');
            d = d.replace(/([mMzZlLhHvVcCsSqQtTaA])/g, ' $1 ');
            d = d.split(/\s+/);

            var command = "";
            // Save the previous command specially for shorthand/smooth curveto(s/S, t/T)
            var prevCommand = "";
            var offset = 0;
            var len = d.length;
            var next = d[0];

            while (offset <= len) {
                // Skip empty
                if(!next) {
                    next = d[++offset];
                    continue;
                }
                if (availableCommands[next]) {
                    prevCommand = command;
                    command = next;
                    offset++;
                }
                // http://www.w3.org/TR/SVG/paths.html
                switch (command) {
                    case "m":
                        x = pickValue() + x;
                        y = pickValue() + y;
                        this._ops.push(['m', x, y]);
                        break;
                    case "M":
                        x = pickValue();
                        y = pickValue();
                        this._ops.push(['m', x, y]);
                        break;
                    case "z":
                    case "Z":
                        next = d[offset];
                        this._ops.push(['z']);
                        break;
                    case "l":
                        x = pickValue() + x;
                        y = pickValue() + y;
                        this._ops.push(['l', x, y]);
                        break;
                    case "L":
                        x = pickValue();
                        y = pickValue();
                        this._ops.push(['l', x, y]);
                        break;
                    case "h":
                        x = pickValue() + x;
                        this._ops.push(['l', x, y]);
                        break;
                    case "H":
                        x = pickValue();
                        this._ops.push(['l', x, y]);
                        break;
                    case "v":
                        y = pickValue() + y;
                        this._ops.push(['l', x, y]);
                        break;
                    case "V":
                        y = pickValue();
                        this._ops.push(['l', x, y]);
                        break;
                    case "c":
                        x1 = pickValue() + x;
                        y1 = pickValue() + y;
                        x2 = pickValue() + x;
                        y2 = pickValue() + y;
                        x = pickValue() + x;
                        y = pickValue() + y;
                        this._ops.push(['c', x1, y1, x2, y2, x, y]);
                        break;
                    case "C":
                        x1 = pickValue();
                        y1 = pickValue();
                        x2 = pickValue();
                        y2 = pickValue();
                        x = pickValue();
                        y = pickValue();
                        this._ops.push(['c', x1, y1, x2, y2, x, y]);
                        break;
                    case "s":
                        if (prevCommand === "c" || prevCommand === "C" ||
                            prevCommand === "s" || prevCommand === "S") {
                            // Reflection of the second control point on the previous command
                            x1 = x * 2 - x2;
                            y1 = y * 2 - y2;
                        } else {
                            x1 = x;
                            y1 = y;
                        }
                        x2 = pickValue() + x;
                        y2 = pickValue() + y;
                        x = pickValue() + x;
                        y = pickValue() + y;
                        this._ops.push(['c', x1, y1, x2, y2, x, y]);
                        break;
                    case "S":
                        if (prevCommand === "c" || prevCommand === "C" ||
                            prevCommand === "s" || prevCommand === "S") {
                            // Reflection of the second control point on the previous command
                            x1 = x * 2 - x2; 
                            y1 = y * 2 - y2;
                        } else {
                            x1 = x;
                            y1 = y;
                        }
                        x2 = pickValue();
                        y2 = pickValue();
                        x = pickValue();
                        y = pickValue();
                        this._ops.push(['c', x1, y1, x2, y2, x, y]);
                        break;
                    case "q":
                        x1 = pickValue() + x;
                        y1 = pickValue() + y;
                        x = pickValue() + x;
                        y = pickValue() + y;
                        this._ops.push(['q', x1, y1, x, y]);
                        break;
                    case "Q":
                        x1 = pickValue();
                        y1 = pickValue();
                        x = pickValue();
                        y = pickValue();
                        this._ops.push(['q', x1, y1, x, y]);
                        break;
                    case "t":
                        if (prevCommand === "q" || prevCommand === "Q" ||
                            prevCommand === "t" || prevCommand === "T") {
                            // Reflection of the second control point on the previous command
                            x1 = x * 2 - x1; 
                            y1 = y * 2 - y1;
                        } else {
                            x1 = x;
                            y1 = y;
                        }
                        x = pickValue() + x;
                        y = pickValue() + y;
                        this._ops.push(['q', x1, y1, x, y]);
                        break;
                    case "T":
                        if (prevCommand === "q" || prevCommand === "Q" ||
                            prevCommand === "t" || prevCommand === "T") {
                            // Reflection of the second control point on the previous command
                            x1 = x * 2 - x1; 
                            y1 = y * 2 - y1;
                        } else {
                            x1 = x;
                            y1 = y;
                        }
                        x = pickValue();
                        y = pickValue();
                        this._ops.push(['q', x1, y1, x, y]);
                        break;
                    case "a":
                    case "A":
                        pickValue();
                        pickValue();
                        pickValue();
                        pickValue();
                        pickValue();
                        pickValue();
                        pickValue();
                        console.warn("Elliptical arc is not supported yet");
                        break;
                    default:
                        pick();
                        continue;
                }
            }
            
            function pick() {
                next = d[offset+1];
                return d[offset++];
            }

            var _val;
            function pickValue() {
                next = d[offset+1];
                _val = d[offset++];
                return parseFloat(_val);
            }
        }
    });

    return SVGPath;
});
/**
 * shapes : circle, line, polygon, rect, polyline, ellipse, path
 */
define('qtek-2d/loader/SVG',['require','qtek/core/Base','qtek/core/request','../Node','../shape/Circle','../shape/Rectangle','../shape/Ellipse','../shape/Line','../shape/Path','../shape/Polygon','../shape/TextBox','../shape/SVGPath','../LinearGradient','../RadialGradient','../Pattern','../Style','qtek/math/Vector2','qtek/core/util'],function(require) {

    var Base = require("qtek/core/Base");

    var request = require("qtek/core/request");

    var Node = require("../Node");
    var Circle = require("../shape/Circle");
    var Rectangle = require("../shape/Rectangle");
    var Ellipse = require("../shape/Ellipse");
    var Line = require("../shape/Line");
    var Path = require("../shape/Path");
    var Polygon = require("../shape/Polygon");
    var TextBox = require("../shape/TextBox");
    var SVGPath = require("../shape/SVGPath");
    var LinearGradient = require("../LinearGradient");
    var RadialGradient = require("../RadialGradient");
    var Pattern = require("../Pattern");
    var Style = require("../Style");
    var Vector2 = require("qtek/math/Vector2");

    var util = require('qtek/core/util');

    var Loader = Base.derive(function() {
        return {
            defs : {},
            root : null
        };
    }, {
        load : function(url) {

            var self = this;
            this.defs = {};

            request.get({
                url : url,
                onprogress : function(percent, loaded, total) {
                    self.trigger("progress", percent, loaded, total);
                },
                onerror : function(e) {
                    self.trigger("error", e);
                },
                responseType : "text",
                onload : function(xmlString) {
                    self.parse(xmlString);
                }
            })
        },
        parse : function(xml) {
            if (typeof(xml) === "string") {
                var parser = new DOMParser();
                var doc = parser.parseFromString(xml, 'text/xml');
                var svg = doc.firstChild;
                while (!(svg.nodeName.toLowerCase() == 'svg' && svg.nodeType == 1)) {
                    svg = svg.nextSibling;
                }
            } else {
                var svg = xml;
            }
            var root = new Node();
            this.root = root;
            // parse view port
            var viewBox = svg.getAttribute("viewBox") || '';
            var viewBoxArr = viewBox.split(/\s+/);

            var width = parseFloat(svg.getAttribute("width") || 0);
            var height = parseFloat(svg.getAttribute("height") || 0);

            var x = parseFloat(viewBoxArr[0] || 0);
            var y = parseFloat(viewBoxArr[1] || 0);
            var vWidth = parseFloat(viewBoxArr[2]);
            var vHeight = parseFloat(viewBoxArr[3]);

            root.position.set(x, y);

            var child = svg.firstChild;
            while (child) {
                this._parseNode(child, root);
                child = child.nextSibling;
            }
            
            this.trigger('success', root);

            return root;
        },

        _parseNode : function(xmlNode, parent) {
            var nodeName = xmlNode.nodeName.toLowerCase();

            if (nodeName === 'defs') {
                // define flag
                this._isDefine = true;
            }

            if (this._isDefine) {
                var parser = defineParsers[nodeName];
                if (parser) {
                    var def = parser.call(this, xmlNode);
                    var id = xmlNode.getAttribute("id");
                    if (id) {
                        this.defs[id] = def;
                    }
                }
            } else {
                var parser = nodeParsers[nodeName];
                if (parser) {
                    var node = parser.call(this, xmlNode, parent);
                    parent.add(node);
                }
            }

            var child = xmlNode.firstChild;
            while (child) {
                if (child.nodeType === 1){
                    this._parseNode(child, node);
                }
                child = child.nextSibling;
            }

            // Quit define
            if (nodeName === 'defs') {
                this._isDefine = false;
            }
        }
    });
    
    var nodeParsers = {
        "g" : function(xmlNode, parentNode) {
            var node = new Node();
            if (parentNode) {
                _inheritStyle(parentNode, node);
            }
            _parseAttributes(xmlNode, node, this.defs);
            return node;
        },
        "rect" : function(xmlNode, parentNode) {
            var rect = new Rectangle();
            if (parentNode) {
                _inheritStyle(parentNode, rect);
            }
            _parseAttributes(xmlNode, rect, this.defs);

            var x = parseFloat(xmlNode.getAttribute("x") || 0);
            var y = parseFloat(xmlNode.getAttribute("y") || 0);
            var width = parseFloat(xmlNode.getAttribute("width") || 0);
            var height = parseFloat(xmlNode.getAttribute("height") || 0);
            rect.start.set(x, y);
            rect.size.set(x, y);

            return rect;
        },
        "circle" : function(xmlNode, parentNode) {
            var circle = new Circle();
            if (parentNode) {
                _inheritStyle(parentNode, circle);
            }
            _parseAttributes(xmlNode, circle, this.defs);

            var cx = parseFloat(xmlNode.getAttribute("cx") || 0);
            var cy = parseFloat(xmlNode.getAttribute("cy") || 0);
            var r = parseFloat(xmlNode.getAttribute("r") || 0);
            circle.center.set(cx, cy);
            circle.radius = r;

            return circle;
        },
        'line' : function(xmlNode, parentNode){
            var line = new Line();
            if (parentNode) {
                _inheritStyle(parentNode, line);
            }
            _parseAttributes(xmlNode, line, this.defs);

            var x1 = parseFloat(xmlNode.getAttribute("x1") || 0);
            var y1 = parseFloat(xmlNode.getAttribute("y1") || 0);
            var x2 = parseFloat(xmlNode.getAttribute("x2") || 0);
            var y2 = parseFloat(xmlNode.getAttribute("y2") || 0);
            line.start.set(x1, y1);
            line.end.set(x2, y2);

            return line;
        },
        "ellipse" : function(xmlNode, parentNode) {
            var ellipse = new Ellipse();
            if (parentNode) {
                _inheritStyle(parentNode, ellipse);
            }
            _parseAttributes(xmlNode, ellipse, this.defs);

            var cx = parseFloat(xmlNode.getAttribute("cx") || 0);
            var cy = parseFloat(xmlNode.getAttribute("cy") || 0);
            var rx = parseFloat(xmlNode.getAttribute("rx") || 0);
            var ry = parseFloat(xmlNode.getAttribute("ry") || 0);

            ellipse.center.set(cx, cy);
            ellipse.radius.set(rx, ry);
            return ellipse;
        },
        'polygon' : function(xmlNode, parentNode) {
            var points = xmlNode.getAttribute("points");
            if (points) {
                points = _parsePoints(points);
            }
            var polygon = new Polygon({
                points : points
            });
            if (parentNode) {
                _inheritStyle(parentNode, polygon);
            }
            _parseAttributes(xmlNode, polygon, this.defs);

            return polygon;
        },
        'polyline' : function(xmlNode, parentNode) {
            var path = new Path();
            if (parentNode) {
                _inheritStyle(parentNode, path);
            }
            _parseAttributes(xmlNode, path, this.defs);

            var points = xmlNode.getAttribute("points");
            if (points) {
                points = _parsePoints(points);
                path.pushPoints(points);
            }

            return path;
        },
        'image' : function(xmlNode, parentNode) {

        },
        'text' : function(xmlNode, parentNode) {
            
        },
        "path" : function(xmlNode, parentNode) {
            var path = new SVGPath();
            if (parentNode) {
                _inheritStyle(parentNode, path);
            }
            _parseAttributes(xmlNode, path, this.defs);

            // TODO svg fill rule
            // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule

            var d = xmlNode.getAttribute("d") || "";
            path.description = d;

            return path;
        }
    }

    var defineParsers = {

        'lineargradient' : function(xmlNode) {
            var x1 = parseInt(xmlNode.getAttribute("x1") || 0);
            var y1 = parseInt(xmlNode.getAttribute("y1") || 0);
            var x2 = parseInt(xmlNode.getAttribute("x2") || 10);
            var y2 = parseInt(xmlNode.getAttribute("y2") || 0);

            var gradient = new LinearGradient();
            gradient.start.set(x1, y1);
            gradient.end.set(x2, y2);

            _parseGradientColorStops(xmlNode, gradient);

            return gradient;
        },

        'radialgradient' : function(xmlNode) {

        }
    }

    function _parseGradientColorStops(xmlNode, gradient){

        var stop = xmlNode.firstChild;

        while (stop) {
            if (stop.nodeType === 1) {
                var offset = stop.getAttribute("offset");
                if (offset.indexOf("%") > 0) {  // percentage
                    offset = parseInt(offset) / 100;
                } else if(offset) {    // number from 0 to 1
                    offset = parseFloat(offset);
                } else {
                    offset = 0;
                }

                var stopColor = stop.getAttribute("stop-color") || '#000000';

                gradient.addColorStop(offset, stopColor);
            }
            stop = stop.nextSibling;
        }
    }

    function _inheritStyle(parent, child) {
        child.stroke = parent.stroke;
        child.fill = parent.fill;
    }

    function _parsePoints(pointsString) {
        var list = pointsString.trim().replace(/,/g, " ").split(/\s+/);
        var points = [];

        for (var i = 0; i < list.length; i+=2) {
            var x = parseFloat(list[i]);
            var y = parseFloat(list[i+1]);
            points.push(new Vector2(x, y));
        }
        return points;
    }

    function _parseAttributes(xmlNode, node, defs) {
        _parseTransformAttribute(xmlNode, node);

        var styleList = {
            fill : xmlNode.getAttribute('fill'),
            stroke : xmlNode.getAttribute("stroke"),
            lineWidth : xmlNode.getAttribute("stroke-width"),
            opacity : xmlNode.getAttribute('opacity'),
            lineDash : xmlNode.getAttribute('stroke-dasharray'),
            lineDashOffset : xmlNode.getAttribute('stroke-dashoffset'),
            lineCap : xmlNode.getAttribute('stroke-linecap'),
            lineJoin : xmlNode.getAttribute('stroke-linjoin'),
            miterLimit : xmlNode.getAttribute("stroke-miterlimit")
        }

        util.extend(styleList, _parseStyleAttribute(xmlNode));

        node.style = new Style({
            fill : _getPaint(styleList.fill, defs),
            stroke : _getPaint(styleList.stroke, defs),
            lineWidth : parseFloat(styleList.lineWidth) || 1,
            opacity : parseFloat(styleList.opacity) || 1,
            lineDashOffset : styleList.lineDashOffset,
            lineCap : styleList.lineCap,
            lineJoin : styleList.lineJoin,
            miterLimit : parseFloat(styleList.miterLimit)
        });
        if (styleList.lineDash) {
            node.style.lineDash = styleList.lineDash.trim().split(/\s*,\s*/);
        }

        if (styleList.stroke && styleList.stroke !== "none") {
            // enable stroke
            node.stroke = true;
        }
    }


    var urlRegex = /url\(\s*#(.*?)\)/;
    function _getPaint(str, defs) {
        // if (str === 'none') {
        //     return;
        // }
        var urlMatch = urlRegex.exec(str);
        if (urlMatch) {
            var url = urlMatch[1].trim();
            var def = defs[url];
            return def;
        }
        return str;
    }

    var transformRegex = /(translate|scale|rotate|skewX|skewY|matrix)\(([\-\s0-9\.,]*)\)/g;

    function _parseTransformAttribute(xmlNode, node) {
        var transform = xmlNode.getAttribute("transform");
        if (transform) {
            var m = node.transform;
            m.identity();
            var transformOps = [];
            transform.replace(transformRegex, function(str, type, value){
                transformOps.push(type, value);
            })
            for(var i = transformOps.length-1; i > 0; i-=2){
                var value = transformOps[i];
                var type = transformOps[i-1];
                switch(type) {
                    case "translate":
                        value = value.trim().split(/\s+/);
                        m.translate(new Vector2(parseFloat(value[0]), parseFloat(value[1] || 0)));
                        break;
                    case "scale":
                        value = value.trim().split(/\s+/);
                        m.scale(new Vector2(parseFloat(value[0]), parseFloat(value[1] || value[0])));
                        break;
                    case "rotate":
                        value = value.trim().split(/\s*/);
                        m.rotate(parseFloat(value[0]));
                        break;
                    case "skew":
                        value = value.trim().split(/\s*/);
                        console.warn("Skew transform is not supported yet");
                        break;
                    case "matrix":
                        var value = value.trim().split(/\s*,\s*/);
                        var arr = m._array;
                        arr[0] = parseFloat(value[0]);
                        arr[1] = parseFloat(value[1]);
                        arr[2] = parseFloat(value[2]);
                        arr[3] = parseFloat(value[3]);
                        arr[4] = parseFloat(value[4]);
                        arr[5] = parseFloat(value[5]);
                        break;
                }
            }
        }
        node.autoUpdate = false;
    }

    var styleRegex = /(\S*?):(.*?);/g;
    function _parseStyleAttribute(xmlNode) {
        var style = xmlNode.getAttribute("style");

        if (style) {
            var styleList = {};
            style = style.replace(/\s*([;:])\s*/g, "$1");
            style.replace(styleRegex, function(str, key, val){
                styleList[key] = val;
            });

            return {
                fill : styleList['fill'],
                stroke : styleList['stroke'],
                lineWidth : styleList['stroke-width'],
                opacity : styleList['opacity'],
                lineDash : styleList['stroke-dasharray'],
                lineDashOffset : styleList['stroke-dashoffset'],
                lineCap : styleList['stroke-linecap'],
                lineJoin : styleList['stroke-linjoin'],
                miterLimit : styleList['stroke-miterlimit']
            }
        }
        return {};
    }

    function _parseCSSRules(doc) {

    }


    return Loader
});
;
define("qtek-2d/picking/Box", function(){});

define('qtek-2d/picking/Pixel',['require','qtek/core/Base'],function(require) {

    var Base = require('qtek/core/Base');

    var PixelPicking = Base.derive(function() {

        return {
            downSampleRatio : 1,
            width : 100,
            height : 100,

            lookupOffset : 1,

            _canvas : null,
            _context : null,
            _imageData : null,

            _lookupTable : [],
        }

    }, function(){
        this.init();
    }, {
        init : function() {
            var canvas = document.createElement("canvas");
            this._canvas = canvas;
            this._context = canvas.getContext("2d");

            this.resize(this.width, this.height);
        },
        setPrecision : function(ratio) {
            this._canvas.width = this.width * ratio;
            this._canvas.height = this.height * ratio;
            this.downSampleRatio = ratio;
        },
        resize : function(width, height) {
            this._canvas.width = width * this.downSampleRatio;
            this._canvas.height = height * this.downSampleRatio;
            this.width = width;
            this.height = height;
        },
        update : function(scene, camera) {
            var ctx = this._context;
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            ctx.save();
            ctx.scale(this.downSampleRatio, this.downSampleRatio);
            this._lookupTable.length = 0;
            if (camera) {
                var vm = camera.getViewMatrix()._array;
                ctx.transform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);   
            }
            this._renderNode(scene, ctx);
            ctx.restore();
            // Cache the image data
            // Get image data is slow
            // http://jsperf.com/getimagedata-multi-vs-once
            var imageData = ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
            this._imageData = imageData.data;
        },
        _renderNode : function(node, ctx) {
            ctx.save();
            node.updateTransform();
            var m = node.transform._array;
            ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            node.clip && ctx.clip();

            if (node.draw && node.enablePicking === true) {
                var lut = this._lookupTable;
                var rgb = packID(lut.length + this.lookupOffset);
                var color = 'rgb(' + rgb.join(',') + ')';
                this._lookupTable.push(node);
                
                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                node.draw(ctx, true);
            }
            var renderQueue = node.getSortedRenderQueue();
            for (var i = 0; i < renderQueue.length; i++) {
                var child = renderQueue[i];
                this._renderNode(child, ctx);
            }
            ctx.restore();
        },
        pick : function(x, y) {
            var ratio = this.downSampleRatio;
            var width = this._canvas.width;
            var height = this._canvas.height;
            x = Math.ceil(ratio * x);
            y = Math.ceil(ratio * y);

            // Box sampler, to avoid the problem of anti aliasing
            var ids = [
                this._sample(x, y),
                this._sample(x-1, y),
                this._sample(x+1, y),
                this._sample(x, y-1),
                this._sample(x, y+1),
            ];
            var count = {};
            var max = 0;
            var maxId;
            for (var i = 0; i < ids.length; i++) {
                var id = ids[i];
                if (!count[id]) {
                    count[id]  = 1;
                } else {
                    count[id] ++;
                }
                if (count[id] > max) {
                    max = count[id];
                    maxId = id;
                }
            }

            var id = maxId - this.lookupOffset;

            if (id && max >=2) {
                var el = this._lookupTable[id];
                return el;
            }
        },

        _sample : function(x, y) {
            x = Math.max(Math.min(x, this._canvas.width), 1);
            y = Math.max(Math.min(y, this._canvas.height), 1);
            var offset = ((y-1) * this._canvas.width + (x-1))*4;
            var data = this._imageData;
            var r = data[offset];
            var g = data[offset+1];
            var b = data[offset+2];

            return unpackID(r, g, b);
        }
    });


    function packID(id){
        var r = id >> 16;
        var g = (id - (r << 8)) >> 8;
        var b = id - (r << 16) - (g<<8);
        return [r, g, b];
    }

    function unpackID(r, g, b){
        return (r << 16) + (g<<8) + b;
    }

    return PixelPicking;
});
define('qtek-2d/shape/Image',['require','../Node','qtek/math/Vector2'],function(require) {

    var Node = require('../Node');
    var Vector2 = require("qtek/math/Vector2");

    var _imageCache = {};
    
    var QTImage = Node.derive(function() {
        return {
            image     : null,
            start   : new Vector2(),
            size    : null
        }
    }, {
        computeBoundingBox : function() {
            if (this.size){
                this.boundingBox = {
                    min : this.start.clone(),
                    max : this.start.clone().add(this.size)
                }   
            }
        },
        draw : function(ctx, isPicker) {
            if (this.image && ! isPicker) {
                this.size ? 
                    ctx.drawImage(this.image, this.start.x, this.start.y, this.size.x, this.size.y) :
                    ctx.drawImage(this.image, this.start.x, this.start.y);
            }
        },
        intersect : function(x, y) {
            return this.intersectBoundingBox(x, y);
        }
    });

    QTImage.load = function(src, callback){
        if (_imageCache[src]) {
            var img = _imageCache[src];
            if (img.constructor == Array) {
                img.push(callback);
            } else {
                callback(img);
            }
        } else {
            _imageCache[src] = [callback];
            var img = new Image();
            img.onload = function() {
                _imageCache[src].forEach(function(cb) {
                    cb(img);
                });
                _imageCache[src] = img;

                img.onload = null;
            }
            img.src = src;
        }
    }
    
    return QTImage;
});
/**
 * @export{class} RoundedRectangle
 */
define('qtek-2d/shape/RoundedRectangle',['require','../Node','../util','qtek/math/Vector2'],function(require) {

    var Node = require('../Node');
    var util = require('../util');
    var Vector2 = require("qtek/math/Vector2");

    var RoundedRectange = Node.derive(function() {
        return {
            start   : new Vector2(),
            size    : new Vector2(),
            radius  : 0
        }
    }, {
        computeBoundingBox : function() {
            this.boundingBox = {
                min : this.start.clone(),
                max : this.size.clone().add(this.start)
            }
        },
        draw : function(ctx) {

            if (this.radius.constructor == Number) {
                // topleft, topright, bottomright, bottomleft
                var radius = [this.radius, this.radius, this.radius, this.radius];
            } else if (this.radius.length == 2) {
                var radius = [this.radius[0], this.radius[1], this.radius[0], this.radius[1]];
            } else {
                var radius = this.radius;
            }

            var start = this.fixAA ? util.fixPos(this.start.clone()) : this.start;
            var size = this.size;
            var v1 = new Vector2().copy(start).add(new Vector2(radius[0], 0));   //left top
            var v2 = new Vector2().copy(start).add(new Vector2(size.x, 0));     //right top
            var v3 = new Vector2().copy(start).add(size);                        //right bottom
            var v4 = new Vector2().copy(start).add(new Vector2(0, size.y));     //left bottom
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            radius[1] ? 
                ctx.arcTo(v2.x, v2.y, v3.x, v3.y, radius[1]) :
                ctx.lineTo(v2.x, v2.y);
            radius[2] ?
                ctx.arcTo(v3.x, v3.y, v4.x, v4.y, radius[2]) :
                ctx.lineTo(v3.x, v3.y);
            radius[3] ?
                ctx.arcTo(v4.x, v4.y, start.x, start.y, radius[3]) :
                ctx.lineTo(v4.x, v4.y);
            radius[0] ? 
                ctx.arcTo(start.x, start.y, v2.x, v2.y, radius[0]) :
                ctx.lineTo(start.x, start.y);
            
            if (this.stroke) {
                ctx.stroke();
            }
            if (this.fill) {
                ctx.fill();
            }
        },
        intersect : function(x, y) {
            // TODO
            return false;
        }
    })

    return RoundedRectange;
});
