define(function (require) {

    var Base = require('zrender/shape/Base');
    var PathProxy = require('zrender/shape/util/PathProxy');
    var zrUtil = require('zrender/tool/util');
    var area = require('zrender/tool/area');

    function RibbonShape(options) {
        this.brushTypeOnly = 'stroke';

        Base.call(this, options);

        this._pathProxy = new PathProxy();
    }

    RibbonShape.prototype = {
        
        type : 'arc',
        
        buildPath : function (ctx, style) {
            var path = this._pathProxy;
            path.begin(ctx);

            var cx = style.x;
            var cy = style.y;
            var r = style.r;
            var startAngle = style.startAngle;
            var endAngle = style.endAngle;
            var anticlockwise = style.anticlockwise;

            path.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
        },
        
        getRect : function (style) {
            if (style.__rect) {
                return style.__rect;
            }
            if (!this._pathProxy.isEmpty()) {
                this.buildPath(null, style);
            }
            return this._pathProxy.fastBoundingRect();
        },

        isCover : function (x, y) {
            var rect = this.getRect(this.style);
            if (x >= rect.x
                && x <= (rect.x + rect.width)
                && y >= rect.y
                && y <= (rect.y + rect.height)
            ) {
                return area.isInsidePath(
                    this._pathProxy.pathCommands, 0, 'fill', x, y
                );
            }
        }
    };

    zrUtil.inherits(RibbonShape, Base);
    
    return RibbonShape;
});