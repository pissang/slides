define(function(require) {

    var zrender = require('zrender');
    var Rectangle = require('zrender/shape/Rectangle');
    var Star = require('zrender/shape/Star');
    var Circle = require('zrender/shape/Circle');
    var Sector = require('zrender/shape/Sector');
    var Heart = require('zrender/shape/Heart');
    var Circle = require('zrender/shape/Circle');
    var Rose = require('zrender/shape/Rose');
    var BezierCurve = require('zrender/shape/BezierCurve');

    var chord = require('./chord');
    var force = require('./force');
    var orbit = require('./orbit');
    var svg = require('./svg');
    var svg3d = require('./svg3d');
    var zrChromeBench = require('./zrChromeBench');
    var zrFirefoxBench = require('./zrFirefoxBench');
    var physics = require('./physics');

    $(".lang-html").each(function() {
        // Encode html
        // http://stackoverflow.com/questions/1219860/javascript-jquery-html-encoding
        this.innerHTML = $("<div />").text(this.innerHTML).html();
    });

    prettyPrint();

    function drawHierarchy(zr, layout, nodes) {
        var ShapeCtors = {
            'rectangle': Rectangle,
            'star': Star,
            'circle': Circle,
            'heart': Heart,
            'sector': Sector,
            'rose': Rose
        }

        var offset = zr.getWidth() / 2 - layout.node('Storage').x;

        layout.eachEdge(function(name, u, v, edge) {
            var source = layout.node(u);
            var target = layout.node(v);
            var curve = new BezierCurve({
                style: {
                    xStart: source.x + offset,
                    yStart: source.y,
                    xEnd: target.x + offset,
                    yEnd: target.y,
                    cpX1: source.x + offset,
                    cpY1: source.y + 100,
                    cpX2: target.x + offset,
                    cpY2: target.y - 100,
                    lineWidth: 2,
                    strokeColor: 'white'
                }
            });

            zr.addShape(curve);
        });

        layout.eachNode(function(name, layoutNode) {
            var node = nodes[name];
            var shape = new ShapeCtors[node.type]({
                style: {
                    radius: 10,
                    r: node.r,
                    r0: node.r0,
                    startAngle: node.startAngle,
                    endAngle: node.endAngle,
                    x: node.x || 0,
                    y: node.y || 0,
                    a: node.a,
                    b: node.b,
                    k: node.k,
                    n: node.n,

                    width: node.width,
                    height: node.height,
                    brushType: 'both',
                    strokeColor: 'white',
                    color: '#06B3DB',
                    lineWidth: 2,
                    text: node.type === 'rectangle' ? name : '',
                    textPosition: 'inside',
                    textAlign: 'center',
                    textColor: 'white',
                    textFont: '20px Arial'
                },
                position: [layoutNode.x + offset, layoutNode.y]
            });

            if (node.type == 'rectangle') {
                shape.style.x= -node.width / 2;
                shape.style.y= -node.height / 2;
            }

            zr.addShape(shape);
        });

        zr.render();
    }

    var actions = {

        drawHierarchy: {

            zr: null,

            enter: function (dom) {
                if (!actions.drawHierarchy.zr) {
                    actions.drawHierarchy.zr = zrender.init(dom);
                }
                var zr = actions.drawHierarchy.zr;

                var hw = zr.getWidth() / 2;
                var hh = zr.getHeight() / 2;

                var g = new dagre.Digraph();

                var nodes = {
                    'Storage': {type: 'rectangle', width: 200, height: 50},
                    'Group 1': {type: 'rectangle', width: 150, height: 50},
                    'Group 2': {type: 'rectangle', width: 150, height: 50},

                    'Circle': {type: 'circle', width: 100, height: 50, r: 30},
                    'Sector': {type: 'sector', width: 100, height: 50, r: 30, r0: 15, startAngle: 90, endAngle: 360},
                    'Heart': {type: 'heart', width: 100, height: 50, a: 30, y: -10, b: 40},
                    'Rose': {type: 'rose', width: 100, height: 50, r: [30], k: 7, n: 4}
                }
                for (var name in nodes) {
                    g.addNode(name, nodes[name]);
                }

                g.addEdge(null, 'Storage', 'Group 1');
                g.addEdge(null, 'Storage', 'Group 2');
                g.addEdge(null, 'Group 1', 'Circle');
                g.addEdge(null, 'Group 1', 'Sector');

                g.addEdge(null, 'Group 2', 'Heart');
                g.addEdge(null, 'Group 2', 'Rose');

                var layout = dagre.layout().rankSep(100).run(g);

                drawHierarchy(zr, layout, nodes);
            },
            leave: function () {
                if (actions.drawHierarchy.zr) {
                    actions.drawHierarchy.zr.dispose();
                    actions.drawHierarchy.zr = null;
                }
            }
        },

        drawChord: {
            enter: function(dom) {
                chord.init(dom);
            },
            leave: function() {
                chord.dispose();
            }
        },

        drawForce: {
            enter: function(dom) {
                force.init(dom);
            },
            leave: function() {
                force.dispose();
            }
        },

        orbitAnimation: {
            enter: function(dom) {
                orbit.init(dom);
            },
            leave: function() {
                orbit.dispose();
            }
        },

        drawSVG: {
            enter: function(dom) {
                svg.init(dom);
            },
            leave: function() {
                svg.dispose();
            }
        },

        drawSVG3D: {
            enter: function(dom) {
                svg3d.init(dom);
            },
            leave: function() {
                svg3d.dispose();
            }
        },

        zrChromeBench: {
            enter: function(dom) {
                zrChromeBench.init(dom);
            },
            leave: function() {
                zrChromeBench.dispose();
            }
        },

        zrFirefoxBench: {
            enter: function(dom) {
                zrFirefoxBench.init(dom);
            },
            leave: function() {
                zrFirefoxBench.dispose();
            }
        },

        showPhysics: {
            enter: function(dom) {
                physics.init(dom);
            },
            leave: function() {
                physics.dispose();
            }
        }
    }

    slides.init('Articles', {
        
        itemClass : 'item',

        actions : actions
    });
})