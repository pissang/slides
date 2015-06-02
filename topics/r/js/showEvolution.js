define(function (require) {

    var Rectangle = require('zrender/shape/Rectangle');
    var Circle = require('zrender/shape/Circle');
    var Line = require('zrender/shape/Line');
    var TextShape = require('zrender/shape/Text');
    var Group = require('zrender/Group');
    var zrender = require('zrender');

    var branches = [{
        name: 'echarts',
        events: [{
            time: '2013-06-30',
            value: 1,
            title: 'ECharts v1.0 发布',
        }, {
            time: '2014-06-30',
            value: 3,
            title: 'ECharts v2.0 发布',
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
            title: 'ECharts-m v1.0.0 发布',
            value: 1
        }]
    }, {
        name: 'ECharts-X',
        from: 'echarts',
        events: [{
            time: '2015-02-04',
            title: 'ECharts-x v0.1.0 发布',
            value: 1.5
        }]
    }];

    function init(dom) {
        var zr = zrender.init(dom);

        var startTime = Infinity;
        var endTime = Date.parse('2015-06-01');

        var eventList = [];

        var xPadding = 100;

        var height = dom.clientHeight;
        var width = dom.clientWidth - xPadding * 2;

        branches.forEach(function (branch) {
            branch.events.forEach(function (event) {
                eventList.push(event);
                event.timeStamp = Date.parse(event.time);

                startTime = Math.min(event.timeStamp, startTime);
            });

            branch.startTime = branch.events[0].timeStamp;
        });

        eventList.sort(function (a, b) {
            return a.timeStamp - b.timeStamp;
        });

        var group = new Group();

        var line = new Line({
            style: {
                xStart: xPadding,
                xEnd: width,
                yStart: height / 2,
                yEnd: height / 2,
                lineWidth: 2,
                color: 'white'
            },
            hoverable: false
        });
        group.addChild(line);

        var prevP = 0;
        eventList.forEach(function (event, idx) {
            var p = (event.timeStamp - startTime) / (endTime - startTime);
            if (prevP && p - prevP < 0.05) {
                p += 0.05;
            }
            prevP = p;

            var x = p * width + xPadding;
            var y = height / 2;

            var circle = new Circle({
                style: {
                    brushType: 'both',
                    x: 0,
                    y: 0,
                    r: 5,
                    lineWidth: 3,
                    strokeColor: '#C1232B',
                    color: 'white'
                },
                position: [x, y],
                hoverable: false,
                z: 1
            });
            group.addChild(circle);

            var textY;
            var textBaseline;
            if (idx % 2) {
                textY = y + 30 + Math.random() * 60;
                textBaseline = 'top';
            }
            else {
                textY = y - 30 - Math.random() * 60;
                textBaseline = 'bottom';
            }

            var line = new Line({
                style: {
                    xStart: x + 0.5,
                    yStart: y,
                    xEnd: x + 0.5,
                    yEnd: textY,
                    lineWidth: 1,
                    color: 'white'
                }
            });
            group.addChild(line);

            var text = new TextShape({
                style: {
                    text: event.time + '\n' + event.title,
                    color: 'white',
                    x: 0,
                    y: 0,
                    textAlign: 'center',
                    textBaseline: textBaseline,
                    textFont: '100 16px Helvetica Neue'
                },
                position: [x, textY],
                hoverable: false
            });
            group.addChild(text);
        });

        zr.addGroup(group);

        group.clipShape = new Rectangle({
            style: {
                width: 0,
                x: xPadding,
                y: 0,
                height: height
            }
        });

        zr.animation.animate(group.clipShape.style)
            .when(2000, {
                width: width
            })
            .during(function () {
                zr.refreshNextFrame();
            })
            .start();
    }

    function dispose() {

    }

    return {
        init: init,
        dispose: dispose
    };
});