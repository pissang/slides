define(function (require) {

    var Polygon = require('zrender/shape/Polygon');
    var Circle = require('zrender/shape/Circle');
    var zrender = require('zrender');

    var branches = [{
        name: 'echarts',
        events: [{
            time: '2013-06-30',
            value: 1,
            title: 'v1.0 发布',
        }, {
            time: '2014-06-30',
            value: 3,
            title: 'v2.0 发布',
        }]
    }, {
        name: 'recharts',
        from: 'echarts',
        end: '2014-10-30',
        events: [{
            time: '2013-10-30',
            title: 'RECharts',
            value: 1
        }]
    }, {
        name: '图说',
        from: 'echarts',
        events: [{
            time: '2014-08-26',
            title: '图说 Beta',
            value: 1.5
        }, {
            time: '2014-12-01',
            title: '图说开放注册',
            value: 2
        }]
    }, {
        name: 'echarts-m',
        from: 'echarts',
        events: [{
            time: '2015-01-30',
            title: 'v1.0.0 发布',
            value: 1
        }]
    }, {
        name: 'ECharts-X',
        from: 'echarts',
        events: [{
            time: '2015-02-04',
            title: 'v0.1.0 发布',
            value: 1.5
        }]
    }];

    function init(dom) {
        var zr = zrender.init(dom);

        var startTime = Infinity;
        var endTime = Date.parse('2015-06-01');

        var eventList = [];

        var yPadding = 150;
        var xPadding = 50;

        var height = dom.clientHeight - yPadding * 2;
        var width = dom.clientWidth - xPadding * 2;

        var branchMap = {};

        branches.forEach(function (branch) {
            branch.events.forEach(function (event) {
                eventList.push(event);
                event.timeStamp = Date.parse(event.time);

                startTime = Math.min(event.timeStamp, startTime);

                event.branch = branch.name;
            });

            branch.events.sort(function (a, b) {
                return a.timeStamp - b.timeStamp;
            });

            branch.startTime = branch.events[0].timeStamp;

            branchMap[branch.name] = branch;

            branch.layout = {};
        });

        branches.sort(function (a, b) {
            return b.startTime - a.startTime;
        });
        var mainBranch = branches[branches.length - 1];

        // Put main branch
        mainBranch.layout.y = height / 2 + yPadding;
        // Layout other branches
        var branchMargin = height / (branches.length - 1);

        var positiveStack = branchMargin;
        var negativeStack = branchMargin;
        var sign = 1;
        branches.forEach(function (branch) {
            if (branch !== mainBranch) {
                if (sign === 1) {
                    branch.layout.y = mainBranch.layout.y + positiveStack;
                    positiveStack += branchMargin;
                }
                else {
                    branch.layout.y = mainBranch.layout.y - negativeStack;
                    negativeStack += branchMargin;
                }
                sign = - sign;
            }
        });

        function getEventX(timeStamp) {
            var p = (timeStamp - startTime) / (endTime - startTime);
            var x = p * width + xPadding;

            return x;
        }

        // Build polygon
        branches.forEach(function (branch) {
            var points = [];

            var events = branch.events;

            // Grow from branch effect
            if (branch.from) {
                var fromBranch = branchMap[branch.from];
                var x = getEventX(events[0].timeStamp);
                points.push([x, fromBranch.layout.y]);

                var nextEvent = events[1];
                var nextX = getEventX(
                    nextEvent ? nextEvent.timeStamp
                    : (branch.end ? Date.parse(branch.end) : endTime)
                );

                // Break point
                var breakX = (x + nextX) / 2;
                // TODO height
                points.push([breakX, branch.layout.y - 10]);

                events = events.slice(1);
            }

            events.forEach(function (event) {
                var x = getEventX(event.timeStamp);
                points.push([x, branch.layout.y - 10]);
            });

            var endX = getEventX(branch.end ? Date.parse(branch.end) : endTime);
            points.push([endX, branch.layout.y - 10]);

            var len = points.length;
            for (var i = len - 1; i >= 0; i--) {
                if (branch.from && i === 0) {
                    points.push(points[i].slice());
                }
                else {
                    points.push([points[i][0], branch.layout.y * 2 - points[i][1]]);
                }
            }
            var polygon = new Polygon({
                hoverable: false,
                style: {
                    smooth: 0.2,
                    pointList: points
                }
            });
            zr.addShape(polygon);
        });
    }

    function dispose() {

    }

    return {
        init: init,
        dispose: dispose
    };
});