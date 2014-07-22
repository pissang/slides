 (function(factory){
    // AMD
    if(typeof define !== "undefined" && define["amd"]){
        define( ["exports"], factory);
    // No module loader
    } else {
        window.qtek = window.qtek || {};
        factory(window.qtek['2d'] = {});
    }

})(function(_exports){

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };
    
    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());
define('qtek/core/mixin/derive',['require'],function(require) {

    

    /**
     * Extend a sub class from base class
     * @param {object|Function} makeDefaultOpt default option of this sub class, method of the sub can use this.xxx to access this option
     * @param {Function} [initialize] Initialize after the sub class is instantiated
     * @param {Object} [proto] Prototype methods/properties of the sub class
     * @memberOf qtek.core.mixin.derive.
     * @return {Function}
     */
    function derive(makeDefaultOpt, initialize/*optional*/, proto/*optional*/) {

        if (typeof initialize == "object") {
            proto = initialize;
            initialize = null;
        }

        var _super = this;

        var propList;
        if (!(makeDefaultOpt instanceof Function)) {
            // Optimize the property iterate if it have been fixed
            propList = [];
            for (var propName in makeDefaultOpt) {
                if (makeDefaultOpt.hasOwnProperty(propName)) {
                    propList.push(propName);
                }
            }
        }

        var sub = function(options) {

            // call super constructor
            _super.apply(this, arguments);

            if (makeDefaultOpt instanceof Function) {
                // Invoke makeDefaultOpt each time if it is a function, So we can make sure each 
                // property in the object will not be shared by mutiple instances
                extend(this, makeDefaultOpt.call(this));
            } else {
                extendWithPropList(this, makeDefaultOpt, propList);
            }
            
            if (this.constructor === sub) {
                // Initialize function will be called in the order of inherit
                var base = sub;
                var initializers = sub.__initializers__;
                for (var i = 0; i < initializers.length; i++) {
                    initializers[i].apply(this, arguments);
                }
            }
        };
        // save super constructor
        sub.__super__ = _super;
        // Initialize function will be called after all the super constructor is called
        if (!_super.__initializers__) {
            sub.__initializers__ = [];
        } else {
            sub.__initializers__ = _super.__initializers__.slice();
        }
        if (initialize) {
            sub.__initializers__.push(initialize);
        }

        var Ctor = function() {};
        Ctor.prototype = _super.prototype;
        sub.prototype = new Ctor();
        sub.prototype.constructor = sub;
        extend(sub.prototype, proto);
        
        // extend the derive method as a static method;
        sub.derive = _super.derive;

        return sub;
    }

    function extend(target, source) {
        if (!source) {
            return;
        }
        for (var name in source) {
            if (source.hasOwnProperty(name)) {
                target[name] = source[name];
            }
        }
    }

    function extendWithPropList(target, source, propList) {
        for (var i = 0; i < propList.length; i++) {
            var propName = propList[i];
            target[propName] = source[propName];
        }   
    }

    /**
     * @alias qtek.core.mixin.derive
     * @mixin
     */
    return {
        derive : derive
    }
});
define('qtek/core/mixin/notifier',[],function() {

    function Handler(action, context) {
        this.action = action;
        this.context = context;
    }
    /**
     * @mixin
     * @alias qtek.core.mixin.notifier
     */
    var notifier = {
        /**
         * Trigger event
         * @param  {string} name
         */
        trigger : function(name) {
            if (! this.hasOwnProperty('__handlers__')) {
                return;
            }
            if (!this.__handlers__.hasOwnProperty(name)) {
                return;
            }

            var hdls = this.__handlers__[name];
            var l = hdls.length, i = -1, args = arguments;
            // Optimize advise from backbone
            switch (args.length) {
                case 1: 
                    while (++i < l)
                        hdls[i].action.call(hdls[i].context);
                    return;
                case 2:
                    while (++i < l)
                        hdls[i].action.call(hdls[i].context, args[1]);
                    return;
                case 3:
                    while (++i < l)
                        hdls[i].action.call(hdls[i].context, args[1], args[2]);
                    return;
                case 4:
                    while (++i < l)
                        hdls[i].action.call(hdls[i].context, args[1], args[2], args[3]);
                    return;
                case 5:
                    while (++i < l)
                        hdls[i].action.call(hdls[i].context, args[1], args[2], args[3], args[4]);
                    return;
                default:
                    while (++i < l)
                        hdls[i].action.apply(hdls[i].context, Array.prototype.slice.call(args, 1));
                    return;
            }
        },
        /**
         * Register event handler
         * @param  {string} name
         * @param  {Function} action
         * @param  {Object} [context]
         * @chainable
         */
        on : function(name, action, context) {
            if (!name || !action) {
                return;
            }
            var handlers = this.__handlers__ || (this.__handlers__={});
            if (! handlers[name]) {
                handlers[name] = [];
            } else {
                if (this.has(name, action)) {
                    return;
                }   
            }
            var handler = new Handler(action, context || this);
            handlers[name].push(handler);

            return this;
        },

        /**
         * Register event, event will only be triggered once and then removed
         * @param  {string} name
         * @param  {Function} action
         * @param  {Object} [context]
         * @chainable
         */
        once : function(name, action, context) {
            if (!name || !action) {
                return;
            }
            var self = this;
            function wrapper() {
                self.off(name, wrapper);
                action.apply(this, arguments);
            }
            return this.on(name, wrapper, context);
        },

        /**
         * Alias of once('before' + name)
         * @param  {string} name
         * @param  {Function} action
         * @param  {Object} [context]
         * @chainable
         */
        before : function(name, action, context) {
            if (!name || !action) {
                return;
            }
            name = 'before' + name;
            return this.on(name, action, context);
        },

        /**
         * Alias of once('after' + name)
         * @param  {string} name
         * @param  {Function} action
         * @param  {Object} [context]
         * @chainable
         */
        after : function(name, action, context) {
            if (!name || !action) {
                return;
            }
            name = 'after' + name;
            return this.on(name, action, context);
        },

        /**
         * Alias of on('success')
         * @param  {Function} action
         * @param  {Object} [context]
         * @chainable
         */
        success : function(action, context) {
            return this.once('success', action, context);
        },

        /**
         * Alias of on('error')
         * @param  {Function} action
         * @param  {Object} [context]
         * @chainable
         */
        error : function(action, context) {
            return this.once('error', action, context);
        },

        /**
         * Alias of on('success')
         * @param  {Function} action
         * @param  {Object} [context]
         * @chainable
         */
        off : function(name, action) {
            
            var handlers = this.__handlers__ || (this.__handlers__={});

            if (!action) {
                handlers[name] = [];
                return;
            }
            if (handlers[name]) {
                var hdls = handlers[name];
                var retains = [];
                for (var i = 0; i < hdls.length; i++) {
                    if (action && hdls[i].action !== action) {
                        retains.push(hdls[i]);
                    }
                }
                handlers[name] = retains;
            } 

            return this;
        },

        /**
         * If registered the event handler
         * @param  {string}  name
         * @param  {Function}  action
         * @return {boolean}
         */
        has : function(name, action) {
            var handlers = this.__handlers__;

            if (! handlers ||
                ! handlers[name]) {
                return false;
            }
            var hdls = handlers[name];
            for (var i = 0; i < hdls.length; i++) {
                if (hdls[i].action === action) {
                    return true;
                }
            }
        }
    }
    
    return notifier;
});
define('qtek/core/util',['require'],function(require){
    
    var guid = 0;

    /**
     * Util functions
     * @namespace qtek.core.util
     */
	var util = {

        /**
         * Generate GUID
         * @return {number}
         * @memberOf qtek.core.util
         */
		genGUID : function() {
			return ++guid;
		},
        /**
         * Relative path to absolute path
         * @param  {string} path
         * @param  {string} basePath
         * @return {string}
         * @memberOf qtek.core.util
         */
        relative2absolute : function(path, basePath) {
            if (!basePath || path.match(/^\//)) {
                return path;
            }
            var pathParts = path.split('/');
            var basePathParts = basePath.split('/');

            var item = pathParts[0];
            while(item === '.' || item === '..') {
                if (item === '..') {
                    basePathParts.pop();
                }
                pathParts.shift();
                item = pathParts[0];
            }
            return basePathParts.join('/') + '/' + pathParts.join('/');
        },

        /**
         * Extend target with source
         * @param  {Object} target
         * @param  {Object} source
         * @return {Object}
         * @memberOf qtek.core.util
         */
        extend : function(target, source) {
            if (source) {
                for (var name in source) {
                    if (source.hasOwnProperty(name)) {
                        target[name] = source[name];
                    }
                }
            }
            return target;
        },

        /**
         * Extend properties to target if not exist.
         * @param  {Object} target
         * @param  {Object} source
         * @return {Object}
         * @memberOf qtek.core.util
         */
        defaults : function(target, source) {
            if (source) {
                for (var propName in source) {
                    if (target[propName] === undefined) {
                        target[propName] = source[propName];
                    }
                }
            }
            return target;
        },
        /**
         * Extend properties with a given property list to avoid for..in.. iteration.
         * @param  {Object} target
         * @param  {Object} source
         * @param  {Array.<string>} propList
         * @return {Object}
         * @memberOf qtek.core.util
         */
        extendWithPropList : function(target, source, propList) {
            if (source) {
                for (var i = 0; i < propList.length; i++) {
                    var propName = propList[i];
                    target[propName] = source[propName];
                }
            }
            return target;
        },
        /**
         * Extend properties to target if not exist. With a given property list avoid for..in.. iteration.
         * @param  {Object} target
         * @param  {Object} source
         * @param  {Array.<string>} propList
         * @return {Object}
         * @memberOf qtek.core.util
         */
        defaultsWithPropList : function(target, source, propList) {
            if (source) {
                for (var i = 0; i < propList.length; i++) {
                    var propName = propList[i];
                    if (target[propName] === undefined) {
                        target[propName] = source[propName];
                    }
                }
            }
            return target;
        },
        /**
         * @param  {Object|Array} obj
         * @param  {Function} iterator
         * @param  {Object} [context]
         * @memberOf qtek.core.util
         */
        each : function(obj, iterator, context) {
            if (!(obj && iterator)) {
                return;
            }
            if (obj.forEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === + obj.length) {
                for (var i = 0, len = obj.length; i < len; i++) {
                    iterator.call(context, obj[i], i, obj);
                }
            } else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        iterator.call(context, obj[key], key, obj);
                    }
                }
            }
        },

        /**
         * Is object ?
         * @param  {}  obj
         * @return {boolean}
         * @memberOf qtek.core.util
         */
        isObject : function(obj) {
            return obj === Object(obj);
        },

        /**
         * Is array ?
         * @param  {}  obj
         * @return {boolean}
         * @memberOf qtek.core.util
         */
        isArray : function(obj) {
            return obj instanceof Array;
        },

        /**
         * Is array like, which have a length property
         * @param  {}  obj
         * @return {boolean}
         * @memberOf qtek.core.util
         */
        isArrayLike : function(obj) {
            if (!obj) {
                return false;
            } else {
                return obj.length === + obj.length;
            }
        },

        /**
         * @param  {} obj
         * @return {}
         * @memberOf qtek.core.util
         */
        clone : function(obj) {
            if (!util.isObject(obj)) {
                return obj;
            } else if (util.isArray(obj)) {
                return obj.slice();
            } else if (util.isArrayLike(obj)) { // is typed array
                var ret = new obj.constructor(obj.length);
                for (var i = 0; i < obj.length; i++) {
                    ret[i] = obj[i];
                }
                return ret;
            } else {
                return util.extend({}, obj);
            }
        }
	}

    return util;
});
define('qtek/core/Base',['require','./mixin/derive','./mixin/notifier','./util'],function(require){

    var deriveMixin = require("./mixin/derive");
    var notifierMixin = require("./mixin/notifier");
    var util = require("./util");

    /**
     * Base class of all objects
     * @constructor
     * @alias qtek.core.Base
     * @mixes qtek.core.mixin.notifier
     */
    var Base = function(){
        /**
         * @type {number}
         */
        this.__GUID__ = util.genGUID();
    }

    Base.__initializers__ = [
        function(opts) {
            util.extend(this, opts)
        }
    ];
    
    util.extend(Base, deriveMixin);
    util.extend(Base.prototype, notifierMixin);

    return Base;
});
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
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.2.0
 */

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


(function(_global) {
  

  var shim = {};
  if (typeof(exports) === 'undefined') {
    if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      shim.exports = {};
      define('glmatrix',[],function() {
        return shim.exports;
      });
    } else {
      // gl-matrix lives in a browser, define its namespaces in global
      shim.exports = typeof(window) !== 'undefined' ? window : _global;
    }
  }
  else {
    // gl-matrix lives in commonjs, define its namespaces in exports
    shim.exports = exports;
  }

  (function(exports) {
    /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

if(!GLMAT_RANDOM) {
    var GLMAT_RANDOM = Math.random;
}

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

/**
 * Sets the type of array used when creating new vectors and matricies
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}

if(typeof(exports) !== 'undefined') {
    exports.glMatrix = glMatrix;
}

var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */

var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec2 = vec2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */

var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
vec3.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
vec3.random = function (out, scale) {
    scale = scale || 1.0;

    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    var z = (GLMAT_RANDOM() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
};

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat3 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec3 = vec3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */

var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
vec4.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */
vec4.random = function (out, scale) {
    scale = scale || 1.0;

    //TODO: This is a pretty awful way of doing this. Find something better.
    out[0] = GLMAT_RANDOM();
    out[1] = GLMAT_RANDOM();
    out[2] = GLMAT_RANDOM();
    out[3] = GLMAT_RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec4 = vec4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x2 Matrix
 * @name mat2
 */

var mat2 = {};

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a1 * b2;
    out[1] = a0 * b1 + a1 * b3;
    out[2] = a2 * b0 + a3 * b2;
    out[3] = a2 * b1 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a1 * s;
    out[1] = a0 * -s + a1 * c;
    out[2] = a2 *  c + a3 * s;
    out[3] = a2 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v1;
    out[2] = a2 * v0;
    out[3] = a3 * v1;
    return out;
};

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2 = mat2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx,ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0
 *  c, d, 0
 *  tx,ty,1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

var mat2d = {};

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5],
        ba = b[0], bb = b[1], bc = b[2], bd = b[3],
        btx = b[4], bty = b[5];

    out[0] = aa*ba + ab*bc;
    out[1] = aa*bb + ab*bd;
    out[2] = ac*ba + ad*bc;
    out[3] = ac*bb + ad*bd;
    out[4] = ba*atx + bc*aty + btx;
    out[5] = bb*atx + bd*aty + bty;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;


/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var aa = a[0],
        ab = a[1],
        ac = a[2],
        ad = a[3],
        atx = a[4],
        aty = a[5],
        st = Math.sin(rad),
        ct = Math.cos(rad);

    out[0] = aa*ct + ab*st;
    out[1] = -aa*st + ab*ct;
    out[2] = ac*ct + ad*st;
    out[3] = -ac*st + ct*ad;
    out[4] = ct*atx + st*aty;
    out[5] = ct*aty - st*atx;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var vx = v[0], vy = v[1];
    out[0] = a[0] * vx;
    out[1] = a[1] * vy;
    out[2] = a[2] * vx;
    out[3] = a[3] * vy;
    out[4] = a[4] * vx;
    out[5] = a[5] * vy;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4] + v[0];
    out[5] = a[5] + v[1];
    return out;
};

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2d = mat2d;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3x3 Matrix
 * @name mat3
 */

var mat3 = {};

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat3 = mat3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4x4 Matrix
 * @name mat4
 */

var mat4 = {};

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        a30, a31, a32, a33;

        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
        a30 = a[12]; a31 = a[13]; a32 = a[14]; a33 = a[15];
    
    out[0] = a00 + a03*x;
    out[1] = a01 + a03*y;
    out[2] = a02 + a03*z;
    out[3] = a03;

    out[4] = a10 + a13*x;
    out[5] = a11 + a13*y;
    out[6] = a12 + a13*z;
    out[7] = a13;

    out[8] = a20 + a23*x;
    out[9] = a21 + a23*y;
    out[10] = a22 + a23*z;
    out[11] = a23;
    out[12] = a30 + a33*x;
    out[13] = a31 + a33*y;
    out[14] = a32 + a33*z;
    out[15] = a33;

    return out;
};
/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Rotates a mat4 by the given angle
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
        Math.abs(eyey - centery) < GLMAT_EPSILON &&
        Math.abs(eyez - centerz) < GLMAT_EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat4 = mat4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class Quaternion
 * @name quat
 */

var quat = {};

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
quat.rotationTo = (function() {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1,0,0);
    var yUnitVec3 = vec3.fromValues(0,1,0);

    return function(out, a, b) {
        var dot = vec3.dot(a, b);
        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001)
                vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            quat.setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        } else if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        } else {
            vec3.cross(tmpvec3, a, b);
            out[0] = tmpvec3[0];
            out[1] = tmpvec3[1];
            out[2] = tmpvec3[2];
            out[3] = 1 + dot;
            return quat.normalize(out, out);
        }
    };
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
quat.setAxes = (function() {
    var matr = mat3.create();

    return function(out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return quat.normalize(out, quat.fromMat3(out, matr));
    };
})();

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
};

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = function(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        out[0] = (m[7]-m[5])*fRoot;
        out[1] = (m[2]-m[6])*fRoot;
        out[2] = (m[3]-m[1])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = (i+1)%3;
        var k = (i+2)%3;
        
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[k*3+j] - m[j*3+k]) * fRoot;
        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
    }
    
    return out;
};

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.quat = quat;
}
;













  })(shim.exports);
})(this);

define('qtek/math/Vector2',['require','glmatrix'],function(require) {

    

    var glMatrix = require("glmatrix");
    var vec2 = glMatrix.vec2;

    /**
     * @constructor
     * @alias qtek.math.Vector2
     * @param {number} x
     * @param {number} y
     */
    var Vector2 = function(x, y) {
        
        x = x || 0;
        y = y || 0;

        /**
         * Storage of Vector2, read and write of x, y will change the values in _array
         * All methods also operate on the _array instead of x, y components
         * @type {Float32Array}
         */
        this._array = vec2.fromValues(x, y);

        /**
         * Dirty flag is used by the Node to determine
         * if the matrix is updated to latest
         * @type {boolean}
         */
        this._dirty = true;
    }

    Vector2.prototype = {

        constructor : Vector2,

        /**
         * @name x
         * @type {number}
         * @memberOf qtek.math.Vector2
         * @instance
         */
        get x() {
            return this._array[0];
        },
        set x(value) {
            this._array[0] = value;
            this._dirty = true;
        },

        /**
         * @name y
         * @type {number}
         * @memberOf qtek.math.Vector2
         * @instance
         */
        get y() {
            return this._array[1];
        },

        set y(value) {
            this._array[1] = value;
            this._dirty = true;
        },

        /**
         * Add b to self
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        add : function(b) {
            vec2.add(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set x and y components
         * @param  {number}  x
         * @param  {number}  y
         * @return {qtek.math.Vector2}
         */
        set : function(x, y) {
            this._array[0] = x;
            this._array[1] = y;
            this._dirty = true;
            return this;
        },

        /**
         * Set x and y components from array
         * @param  {Float32Array|number[]} arr
         * @return {qtek.math.Vector2}
         */
        setArray : function(arr) {
            this._array[0] = arr[0];
            this._array[1] = arr[1];

            this._dirty = true;
            return this;
        },

        /**
         * Clone a new Vector2
         * @return {qtek.math.Vector2}
         */
        clone : function() {
            return new Vector2(this.x, this.y);
        },

        /**
         * Copy x, y from b
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        copy : function(b) {
            vec2.copy(this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Cross product of self and b, written to a Vector3 out
         * @param  {qtek.math.Vector3} out
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        cross : function(out, b) {
            vec2.cross(out._array, this._array, b._array);
            out._dirty = true;
            return this;
        },

        /**
         * Alias for distance
         * @param  {qtek.math.Vector2} b
         * @return {number}
         */
        dist : function(b) {
            return vec2.dist(this._array, b._array);
        },

        /**
         * Distance between self and b
         * @param  {qtek.math.Vector2} b
         * @return {number}
         */
        distance : function(b) {
            return vec2.distance(this._array, b._array);
        },

        /**
         * Alias for divide
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        div : function(b) {
            vec2.div(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Divide self by b
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        divide : function(b) {
            vec2.divide(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Dot product of self and b
         * @param  {qtek.math.Vector2} b
         * @return {number}
         */
        dot : function(b) {
            return vec2.dot(this._array, b._array);
        },

        /**
         * Alias of length
         * @return {number}
         */
        len : function() {
            return vec2.len(this._array);
        },

        /**
         * Calculate the length
         * @return {number}
         */
        length : function() {
            return vec2.length(this._array);
        },
        
        /**
         * Linear interpolation between a and b
         * @param  {qtek.math.Vector2} a
         * @param  {qtek.math.Vector2} b
         * @param  {number}  t
         * @return {qtek.math.Vector2}
         */
        lerp : function(a, b, t) {
            vec2.lerp(this._array, a._array, b._array, t);
            this._dirty = true;
            return this;
        },

        /**
         * Minimum of self and b
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        min : function(b) {
            vec2.min(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Maximum of self and b
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        max : function(b) {
            vec2.max(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for multiply
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        mul : function(b) {
            vec2.mul(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Mutiply self and b
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        multiply : function(b) {
            vec2.multiply(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Negate self
         * @return {qtek.math.Vector2}
         */
        negate : function() {
            vec2.negate(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Normalize self
         * @return {qtek.math.Vector2}
         */
        normalize : function() {
            vec2.normalize(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Generate random x, y components with a given scale
         * @param  {number} scale
         * @return {qtek.math.Vector2}
         */
        random : function(scale) {
            vec2.random(this._array, scale);
            this._dirty = true;
            return this;
        },

        /**
         * Scale self
         * @param  {number}  scale
         * @return {qtek.math.Vector2}
         */
        scale : function(s) {
            vec2.scale(this._array, this._array, s);
            this._dirty = true;
            return this;
        },

        /**
         * Scale b and add to self
         * @param  {qtek.math.Vector2} b
         * @param  {number}  scale
         * @return {qtek.math.Vector2}
         */
        scaleAndAdd : function(b, s) {
            vec2.scaleAndAdd(this._array, this._array, b._array, s);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for squaredDistance
         * @param  {qtek.math.Vector2} b
         * @return {number}
         */
        sqrDist : function(b) {
            return vec2.sqrDist(this._array, b._array);
        },

        /**
         * Squared distance between self and b
         * @param  {qtek.math.Vector2} b
         * @return {number}
         */
        squaredDistance : function(b) {
            return vec2.squaredDistance(this._array, b._array);
        },

        /**
         * Alias for squaredLength
         * @return {number}
         */
        sqrLen : function() {
            return vec2.sqrLen(this._array);
        },

        /**
         * Squared length of self
         * @return {number}
         */
        squaredLength : function() {
            return vec2.squaredLength(this._array);
        },

        /**
         * Alias for subtract
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        sub : function(b) {
            vec2.sub(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Subtract b from self
         * @param  {qtek.math.Vector2} b
         * @return {qtek.math.Vector2}
         */
        subtract : function(b) {
            vec2.subtract(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transform self with a Matrix2 m
         * @param  {qtek.math.Matrix2} m
         * @return {qtek.math.Vector2}
         */
        transformMat2 : function(m) {
            vec2.transformMat2(this._array, this._array, m._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transform self with a Matrix2d m
         * @param  {qtek.math.Matrix2d} m
         * @return {qtek.math.Vector2}
         */
        transformMat2d : function(m) {
            vec2.transformMat2d(this._array, this._array, m._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transform self with a Matrix3 m
         * @param  {qtek.math.Matrix3} m
         * @return {qtek.math.Vector2}
         */
        transformMat3 : function(m) {
            vec2.transformMat3(this._array, this._array, m._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transform self with a Matrix4 m
         * @param  {qtek.math.Matrix4} m
         * @return {qtek.math.Vector2}
         */
        transformMat4 : function(m) {
            vec2.transformMat4(this._array, this._array, m._array);
            this._dirty = true;
            return this;
        },

        toString : function() {
            return "[" + Array.prototype.join.call(this._array, ",") + "]";
        },
    }

    // Supply methods that are not in place
    
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.add = function(out, a, b) {
        vec2.add(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector2} out
     * @param  {number}  x
     * @param  {number}  y
     * @return {qtek.math.Vector2}  
     */
    Vector2.set = function(out, x, y) {
        vec2.set(out._array, x, y);
        out._dirty = true;
        return out
    }

    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.copy = function(out, b) {
        vec2.copy(out._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.cross = function(out, a, b) {
        vec2.cross(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {number}
     */
    Vector2.dist = function(a, b) {
        return vec2.distance(a._array, b._array);
    }
    /**
     * @method
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {number}
     */
    Vector2.distance = Vector2.dist;
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.div = function(out, a, b) {
        vec2.divide(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @method
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.divide = Vector2.div;
    /**
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {number}
     */
    Vector2.dot = function(a, b) {
        return vec2.dot(a._array, b._array);
    }

    /**
     * @param  {qtek.math.Vector2} a
     * @return {number}
     */
    Vector2.len = function(b) {
        return vec2.length(b._array);
    }

    // Vector2.length = Vector2.len;
    
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @param  {number}  t
     * @return {qtek.math.Vector2}
     */
    Vector2.lerp = function(out, a, b, t) {
        vec2.lerp(out._array, a._array, b._array, t);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.min = function(out, a, b) {
        vec2.min(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.max = function(out, a, b) {
        vec2.max(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.mul = function(out, a, b) {
        vec2.multiply(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @method
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.multiply = Vector2.mul;
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @return {qtek.math.Vector2}
     */
    Vector2.negate = function(out, a) {
        vec2.negate(out._array, a._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @return {qtek.math.Vector2}
     */
    Vector2.normalize = function(out, a) {
        vec2.normalize(out._array, a._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {number}  scale
     * @return {qtek.math.Vector2}
     */
    Vector2.random = function(out, scale) {
        vec2.random(out._array, scale);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {number}  scale
     * @return {qtek.math.Vector2}
     */
    Vector2.scale = function(out, a, scale) {
        vec2.scale(out._array, a._array, scale);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @param  {number}  scale
     * @return {qtek.math.Vector2}
     */
    Vector2.scaleAndAdd = function(out, a, b, scale) {
        vec2.scale(out._array, a._array, b._array, scale);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {number}
     */
    Vector2.sqrDist = function(a, b) {
        return vec2.sqrDist(a._array, b._array);
    }
    /**
     * @method
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {number}
     */
    Vector2.squaredDistance = Vector2.sqrDist;
    
    /**
     * @param  {qtek.math.Vector2} a
     * @return {number}
     */
    Vector2.sqrLen = function(a) {
        return vec2.sqrLen(a._array);
    }
    /**
     * @method
     * @param  {qtek.math.Vector2} a
     * @return {number}
     */
    Vector2.squaredLength = Vector2.sqrLen;

    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.sub = function(out, a, b) {
        vec2.subtract(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @method
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Vector2} b
     * @return {qtek.math.Vector2}
     */
    Vector2.subtract = Vector2.sub;
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Matrix2} m
     * @return {qtek.math.Vector2}
     */
    Vector2.transformMat2 = function(out, a, m) {
        vec2.transformMat2(out._array, a._array, m._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2}  out
     * @param  {qtek.math.Vector2}  a
     * @param  {qtek.math.Matrix2d} m
     * @return {qtek.math.Vector2}
     */
    Vector2.transformMat2d = function(out, a, m) {
        vec2.transformMat2d(out._array, a._array, m._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {Matrix3} m
     * @return {qtek.math.Vector2}
     */
    Vector2.transformMat3 = function(out, a, m) {
        vec2.transformMat3(out._array, a._array, m._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector2} out
     * @param  {qtek.math.Vector2} a
     * @param  {qtek.math.Matrix4} m
     * @return {qtek.math.Vector2}
     */
    Vector2.transformMat4 = function(out, a, m) {
        vec2.transformMat4(out._array, a._array, m._array);
        out._dirty = true;
        return out;
    }

    return Vector2;

});
define('qtek/core/Cache',[],function() {

    var Cache = function() {

        this._contextId = 0;

        this._caches = [];

        this._context = {};
    }

    Cache.prototype = {

        use : function(contextId, documentSchema) {

            if (! this._caches[contextId]) {
                this._caches[contextId] = {};

                if (documentSchema) {
                    this._caches[contextId] = documentSchema();
                }
            }
            this._contextId = contextId;

            this._context = this._caches[contextId];
        },

        put : function(key, value) {
            this._context[key] = value;
        },

        get : function(key) {
            return this._context[key];
        },

        dirty : function(field) {
            field = field || "";
            var key = "__dirty__" + field;
            this.put(key, true)
        },
        
        dirtyAll : function(field) {
            field = field || "";
            var key = "__dirty__" + field;
            for (var i = 0; i < this._caches.length; i++) {
                if (this._caches[i]) {
                    this._caches[i][key] = true;
                }
            }
        },

        fresh : function(field) {
            field = field || "";
            var key = "__dirty__" + field;
            this.put(key, false);
        },

        freshAll : function(field) {
            field = field || "";
            var key = "__dirty__" + field;
            for (var i = 0; i < this._caches.length; i++) {
                if (this._caches[i]) {
                    this._caches[i][key] = false;
                }
            }
        },

        isDirty : function(field) {
            field = field || "";
            var key = "__dirty__" + field;
            return  !this._context.hasOwnProperty(key)
                    || this._context[key] === true
        },

        deleteContext : function(contextId) {
            delete this._caches[contextId];
            this._context = {};
        },

        'delete' : function(key) {
            delete this._context[key];
        },

        clearAll : function() {
            this._caches = {};
        },

        getContext : function() {
            return this._context;
        },

        miss : function(key) {
            return ! this._context.hasOwnProperty(key);
        }
    }

    Cache.prototype.constructor = Cache;

    return Cache;

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
define('qtek/math/Matrix2d',['require','glmatrix'],function(require) {

    

    var glMatrix = require("glmatrix");
    var mat2d = glMatrix.mat2d;

    function makeProperty(n) {
        return {
            configurable : false,
            set : function(value) {
                this._array[n] = value;
                this._dirty = true;
            },
            get : function() {
                return this._array[n];
            }
        }
    }

    /**
     * @constructor
     * @alias qtek.math.Matrix2d
     */
    var Matrix2d = function() {
        /**
         * Storage of Matrix2d
         * @type {Float32Array}
         */
        this._array = mat2d.create();

        /**
         * @type {boolean}
         */
        this._dirty = true;
    };

    Matrix2d.prototype = {

        constructor : Matrix2d,

        /**
         * Clone a new Matrix2d
         * @return {qtek.math.Matrix2d}
         */
        clone : function() {
            return (new Matrix2d()).copy(this);
        },

        /**
         * Copy from b
         * @param  {qtek.math.Matrix2d} b
         * @return {qtek.math.Matrix2d}
         */
        copy : function(b) {
            mat2d.copy(this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Calculate matrix determinant
         * @return {number}
         */
        determinant : function() {
            return mat2d.determinant(this._array);
        },

        /**
         * Set to a identity matrix
         * @return {qtek.math.Matrix2d}
         */
        identity : function() {
            mat2d.identity(this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Invert self
         * @return {qtek.math.Matrix2d}
         */
        invert : function() {
            mat2d.invert(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for mutiply
         * @param  {qtek.math.Matrix2d} b
         * @return {qtek.math.Matrix2d}
         */
        mul : function(b) {
            mat2d.mul(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for multiplyLeft
         * @param  {qtek.math.Matrix2d} a
         * @return {qtek.math.Matrix2d}
         */
        mulLeft : function(b) {
            mat2d.mul(this._array, b._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Multiply self and b
         * @param  {qtek.math.Matrix2d} b
         * @return {qtek.math.Matrix2d}
         */
        multiply : function(b) {
            mat2d.multiply(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Multiply a and self, a is on the left
         * @param  {qtek.math.Matrix2d} a
         * @return {qtek.math.Matrix2d}
         */
        multiplyLeft : function(b) {
            mat2d.multiply(this._array, b._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian
         * @param  {number}   rad
         * @return {qtek.math.Matrix2d}
         */
        rotate : function(rad) {
            mat2d.rotate(this._array, this._array, rad);
            this._dirty = true;
            return this;
        },

        /**
         * Scale self by s
         * @param  {qtek.math.Vector2}  s
         * @return {qtek.math.Matrix2d}
         */
        scale : function(s) {
            mat2d.scale(this._array, this._array, s._array);
            this._dirty = true;
            return this;
        },

        /**
         * Translate self by v
         * @param  {qtek.math.Vector2}  v
         * @return {qtek.math.Matrix2d}
         */
        translate : function(v) {
            mat2d.translate(this._array, this._array, v._array);
            this._dirty = true;
            return this;
        },
        toString : function() {
            return "[" + Array.prototype.join.call(this._array, ",") + "]";
        }
    }

    /**
     * @param  {qtek.math.Matrix2d} out
     * @param  {qtek.math.Matrix2d} a
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.copy = function(out, a) {
        mat2d.copy(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix2d} a
     * @return {number}
     */
    Matrix2d.determinant = function(a) {
        return mat2d.determinant(a._array);
    }

    /**
     * @param  {qtek.math.Matrix2d} out
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.identity = function(out) {
        mat2d.identity(out._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix2d} out
     * @param  {qtek.math.Matrix2d} a
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.invert = function(out, a) {
        mat2d.invert(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix2d} out
     * @param  {qtek.math.Matrix2d} a
     * @param  {qtek.math.Matrix2d} b
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.mul = function(out, a, b) {
        mat2d.mul(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @method
     * @param  {qtek.math.Matrix2d} out
     * @param  {qtek.math.Matrix2d} a
     * @param  {qtek.math.Matrix2d} b
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.multiply = Matrix2d.mul;

    /**
     * @param  {qtek.math.Matrix2d} out
     * @param  {qtek.math.Matrix2d} a
     * @param  {number}   rad
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.rotate = function(out, a, rad) {
        mat2d.rotate(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix2d} out
     * @param  {qtek.math.Matrix2d} a
     * @param  {qtek.math.Vector2}  v
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.scale = function(out, a, v) {
        mat2d.scale(out._array, a._array, v._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix2d} out
     * @param  {qtek.math.Matrix2d} a
     * @param  {qtek.math.Vector2}  v
     * @return {qtek.math.Matrix2d}
     */
    Matrix2d.translate = function(out, a, v) {
        mat2d.translate(out._array, a._array, v._array);
        out._dirty = true;
        return out;
    }

    return Matrix2d;
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
/**
 * @namespace qtek.core.glenum
 * @see http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14
 */
define('qtek/core/glenum',[],function() {

return {
    /* ClearBufferMask */
    DEPTH_BUFFER_BIT               : 0x00000100,
    STENCIL_BUFFER_BIT             : 0x00000400,
    COLOR_BUFFER_BIT               : 0x00004000,
    
    /* BeginMode */
    POINTS                         : 0x0000,
    LINES                          : 0x0001,
    LINE_LOOP                      : 0x0002,
    LINE_STRIP                     : 0x0003,
    TRIANGLES                      : 0x0004,
    TRIANGLE_STRIP                 : 0x0005,
    TRIANGLE_FAN                   : 0x0006,
    
    /* AlphaFunction (not supported in ES20) */
    /*      NEVER */
    /*      LESS */
    /*      EQUAL */
    /*      LEQUAL */
    /*      GREATER */
    /*      NOTEQUAL */
    /*      GEQUAL */
    /*      ALWAYS */
    
    /* BlendingFactorDest */
    ZERO                           : 0,
    ONE                            : 1,
    SRC_COLOR                      : 0x0300,
    ONE_MINUS_SRC_COLOR            : 0x0301,
    SRC_ALPHA                      : 0x0302,
    ONE_MINUS_SRC_ALPHA            : 0x0303,
    DST_ALPHA                      : 0x0304,
    ONE_MINUS_DST_ALPHA            : 0x0305,
    
    /* BlendingFactorSrc */
    /*      ZERO */
    /*      ONE */
    DST_COLOR                      : 0x0306,
    ONE_MINUS_DST_COLOR            : 0x0307,
    SRC_ALPHA_SATURATE             : 0x0308,
    /*      SRC_ALPHA */
    /*      ONE_MINUS_SRC_ALPHA */
    /*      DST_ALPHA */
    /*      ONE_MINUS_DST_ALPHA */
    
    /* BlendEquationSeparate */
    FUNC_ADD                       : 0x8006,
    BLEND_EQUATION                 : 0x8009,
    BLEND_EQUATION_RGB             : 0x8009, /* same as BLEND_EQUATION */
    BLEND_EQUATION_ALPHA           : 0x883D,
    
    /* BlendSubtract */
    FUNC_SUBTRACT                  : 0x800A,
    FUNC_REVERSE_SUBTRACT          : 0x800B,
    
    /* Separate Blend Functions */
    BLEND_DST_RGB                  : 0x80C8,
    BLEND_SRC_RGB                  : 0x80C9,
    BLEND_DST_ALPHA                : 0x80CA,
    BLEND_SRC_ALPHA                : 0x80CB,
    CONSTANT_COLOR                 : 0x8001,
    ONE_MINUS_CONSTANT_COLOR       : 0x8002,
    CONSTANT_ALPHA                 : 0x8003,
    ONE_MINUS_CONSTANT_ALPHA       : 0x8004,
    BLEND_COLOR                    : 0x8005,
    
    /* Buffer Objects */
    ARRAY_BUFFER                   : 0x8892,
    ELEMENT_ARRAY_BUFFER           : 0x8893,
    ARRAY_BUFFER_BINDING           : 0x8894,
    ELEMENT_ARRAY_BUFFER_BINDING   : 0x8895,
    
    STREAM_DRAW                    : 0x88E0,
    STATIC_DRAW                    : 0x88E4,
    DYNAMIC_DRAW                   : 0x88E8,
    
    BUFFER_SIZE                    : 0x8764,
    BUFFER_USAGE                   : 0x8765,
    
    CURRENT_VERTEX_ATTRIB          : 0x8626,
    
    /* CullFaceMode */
    FRONT                          : 0x0404,
    BACK                           : 0x0405,
    FRONT_AND_BACK                 : 0x0408,
    
    /* DepthFunction */
    /*      NEVER */
    /*      LESS */
    /*      EQUAL */
    /*      LEQUAL */
    /*      GREATER */
    /*      NOTEQUAL */
    /*      GEQUAL */
    /*      ALWAYS */
    
    /* EnableCap */
    /* TEXTURE_2D */
    CULL_FACE                      : 0x0B44,
    BLEND                          : 0x0BE2,
    DITHER                         : 0x0BD0,
    STENCIL_TEST                   : 0x0B90,
    DEPTH_TEST                     : 0x0B71,
    SCISSOR_TEST                   : 0x0C11,
    POLYGON_OFFSET_FILL            : 0x8037,
    SAMPLE_ALPHA_TO_COVERAGE       : 0x809E,
    SAMPLE_COVERAGE                : 0x80A0,
    
    /* ErrorCode */
    NO_ERROR                       : 0,
    INVALID_ENUM                   : 0x0500,
    INVALID_VALUE                  : 0x0501,
    INVALID_OPERATION              : 0x0502,
    OUT_OF_MEMORY                  : 0x0505,
    
    /* FrontFaceDirection */
    CW                             : 0x0900,
    CCW                            : 0x0901,
    
    /* GetPName */
    LINE_WIDTH                     : 0x0B21,
    ALIASED_POINT_SIZE_RANGE       : 0x846D,
    ALIASED_LINE_WIDTH_RANGE       : 0x846E,
    CULL_FACE_MODE                 : 0x0B45,
    FRONT_FACE                     : 0x0B46,
    DEPTH_RANGE                    : 0x0B70,
    DEPTH_WRITEMASK                : 0x0B72,
    DEPTH_CLEAR_VALUE              : 0x0B73,
    DEPTH_FUNC                     : 0x0B74,
    STENCIL_CLEAR_VALUE            : 0x0B91,
    STENCIL_FUNC                   : 0x0B92,
    STENCIL_FAIL                   : 0x0B94,
    STENCIL_PASS_DEPTH_FAIL        : 0x0B95,
    STENCIL_PASS_DEPTH_PASS        : 0x0B96,
    STENCIL_REF                    : 0x0B97,
    STENCIL_VALUE_MASK             : 0x0B93,
    STENCIL_WRITEMASK              : 0x0B98,
    STENCIL_BACK_FUNC              : 0x8800,
    STENCIL_BACK_FAIL              : 0x8801,
    STENCIL_BACK_PASS_DEPTH_FAIL   : 0x8802,
    STENCIL_BACK_PASS_DEPTH_PASS   : 0x8803,
    STENCIL_BACK_REF               : 0x8CA3,
    STENCIL_BACK_VALUE_MASK        : 0x8CA4,
    STENCIL_BACK_WRITEMASK         : 0x8CA5,
    VIEWPORT                       : 0x0BA2,
    SCISSOR_BOX                    : 0x0C10,
    /*      SCISSOR_TEST */
    COLOR_CLEAR_VALUE              : 0x0C22,
    COLOR_WRITEMASK                : 0x0C23,
    UNPACK_ALIGNMENT               : 0x0CF5,
    PACK_ALIGNMENT                 : 0x0D05,
    MAX_TEXTURE_SIZE               : 0x0D33,
    MAX_VIEWPORT_DIMS              : 0x0D3A,
    SUBPIXEL_BITS                  : 0x0D50,
    RED_BITS                       : 0x0D52,
    GREEN_BITS                     : 0x0D53,
    BLUE_BITS                      : 0x0D54,
    ALPHA_BITS                     : 0x0D55,
    DEPTH_BITS                     : 0x0D56,
    STENCIL_BITS                   : 0x0D57,
    POLYGON_OFFSET_UNITS           : 0x2A00,
    /*      POLYGON_OFFSET_FILL */
    POLYGON_OFFSET_FACTOR          : 0x8038,
    TEXTURE_BINDING_2D             : 0x8069,
    SAMPLE_BUFFERS                 : 0x80A8,
    SAMPLES                        : 0x80A9,
    SAMPLE_COVERAGE_VALUE          : 0x80AA,
    SAMPLE_COVERAGE_INVERT         : 0x80AB,
    
    /* GetTextureParameter */
    /*      TEXTURE_MAG_FILTER */
    /*      TEXTURE_MIN_FILTER */
    /*      TEXTURE_WRAP_S */
    /*      TEXTURE_WRAP_T */
    
    COMPRESSED_TEXTURE_FORMATS     : 0x86A3,
    
    /* HintMode */
    DONT_CARE                      : 0x1100,
    FASTEST                        : 0x1101,
    NICEST                         : 0x1102,
    
    /* HintTarget */
    GENERATE_MIPMAP_HINT            : 0x8192,
    
    /* DataType */
    BYTE                           : 0x1400,
    UNSIGNED_BYTE                  : 0x1401,
    SHORT                          : 0x1402,
    UNSIGNED_SHORT                 : 0x1403,
    INT                            : 0x1404,
    UNSIGNED_INT                   : 0x1405,
    FLOAT                          : 0x1406,
    
    /* PixelFormat */
    DEPTH_COMPONENT                : 0x1902,
    ALPHA                          : 0x1906,
    RGB                            : 0x1907,
    RGBA                           : 0x1908,
    LUMINANCE                      : 0x1909,
    LUMINANCE_ALPHA                : 0x190A,
    
    /* PixelType */
    /*      UNSIGNED_BYTE */
    UNSIGNED_SHORT_4_4_4_4         : 0x8033,
    UNSIGNED_SHORT_5_5_5_1         : 0x8034,
    UNSIGNED_SHORT_5_6_5           : 0x8363,
    
    /* Shaders */
    FRAGMENT_SHADER                  : 0x8B30,
    VERTEX_SHADER                    : 0x8B31,
    MAX_VERTEX_ATTRIBS               : 0x8869,
    MAX_VERTEX_UNIFORM_VECTORS       : 0x8DFB,
    MAX_VARYING_VECTORS              : 0x8DFC,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS : 0x8B4D,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS   : 0x8B4C,
    MAX_TEXTURE_IMAGE_UNITS          : 0x8872,
    MAX_FRAGMENT_UNIFORM_VECTORS     : 0x8DFD,
    SHADER_TYPE                      : 0x8B4F,
    DELETE_STATUS                    : 0x8B80,
    LINK_STATUS                      : 0x8B82,
    VALIDATE_STATUS                  : 0x8B83,
    ATTACHED_SHADERS                 : 0x8B85,
    ACTIVE_UNIFORMS                  : 0x8B86,
    ACTIVE_ATTRIBUTES                : 0x8B89,
    SHADING_LANGUAGE_VERSION         : 0x8B8C,
    CURRENT_PROGRAM                  : 0x8B8D,
    
    /* StencilFunction */
    NEVER                          : 0x0200,
    LESS                           : 0x0201,
    EQUAL                          : 0x0202,
    LEQUAL                         : 0x0203,
    GREATER                        : 0x0204,
    NOTEQUAL                       : 0x0205,
    GEQUAL                         : 0x0206,
    ALWAYS                         : 0x0207,
    
    /* StencilOp */
    /*      ZERO */
    KEEP                           : 0x1E00,
    REPLACE                        : 0x1E01,
    INCR                           : 0x1E02,
    DECR                           : 0x1E03,
    INVERT                         : 0x150A,
    INCR_WRAP                      : 0x8507,
    DECR_WRAP                      : 0x8508,
    
    /* StringName */
    VENDOR                         : 0x1F00,
    RENDERER                       : 0x1F01,
    VERSION                        : 0x1F02,
    
    /* TextureMagFilter */
    NEAREST                        : 0x2600,
    LINEAR                         : 0x2601,
    
    /* TextureMinFilter */
    /*      NEAREST */
    /*      LINEAR */
    NEAREST_MIPMAP_NEAREST         : 0x2700,
    LINEAR_MIPMAP_NEAREST          : 0x2701,
    NEAREST_MIPMAP_LINEAR          : 0x2702,
    LINEAR_MIPMAP_LINEAR           : 0x2703,
    
    /* TextureParameterName */
    TEXTURE_MAG_FILTER             : 0x2800,
    TEXTURE_MIN_FILTER             : 0x2801,
    TEXTURE_WRAP_S                 : 0x2802,
    TEXTURE_WRAP_T                 : 0x2803,
    
    /* TextureTarget */
    TEXTURE_2D                     : 0x0DE1,
    TEXTURE                        : 0x1702,
    
    TEXTURE_CUBE_MAP               : 0x8513,
    TEXTURE_BINDING_CUBE_MAP       : 0x8514,
    TEXTURE_CUBE_MAP_POSITIVE_X    : 0x8515,
    TEXTURE_CUBE_MAP_NEGATIVE_X    : 0x8516,
    TEXTURE_CUBE_MAP_POSITIVE_Y    : 0x8517,
    TEXTURE_CUBE_MAP_NEGATIVE_Y    : 0x8518,
    TEXTURE_CUBE_MAP_POSITIVE_Z    : 0x8519,
    TEXTURE_CUBE_MAP_NEGATIVE_Z    : 0x851A,
    MAX_CUBE_MAP_TEXTURE_SIZE      : 0x851C,
    
    /* TextureUnit */
    TEXTURE0                       : 0x84C0,
    TEXTURE1                       : 0x84C1,
    TEXTURE2                       : 0x84C2,
    TEXTURE3                       : 0x84C3,
    TEXTURE4                       : 0x84C4,
    TEXTURE5                       : 0x84C5,
    TEXTURE6                       : 0x84C6,
    TEXTURE7                       : 0x84C7,
    TEXTURE8                       : 0x84C8,
    TEXTURE9                       : 0x84C9,
    TEXTURE10                      : 0x84CA,
    TEXTURE11                      : 0x84CB,
    TEXTURE12                      : 0x84CC,
    TEXTURE13                      : 0x84CD,
    TEXTURE14                      : 0x84CE,
    TEXTURE15                      : 0x84CF,
    TEXTURE16                      : 0x84D0,
    TEXTURE17                      : 0x84D1,
    TEXTURE18                      : 0x84D2,
    TEXTURE19                      : 0x84D3,
    TEXTURE20                      : 0x84D4,
    TEXTURE21                      : 0x84D5,
    TEXTURE22                      : 0x84D6,
    TEXTURE23                      : 0x84D7,
    TEXTURE24                      : 0x84D8,
    TEXTURE25                      : 0x84D9,
    TEXTURE26                      : 0x84DA,
    TEXTURE27                      : 0x84DB,
    TEXTURE28                      : 0x84DC,
    TEXTURE29                      : 0x84DD,
    TEXTURE30                      : 0x84DE,
    TEXTURE31                      : 0x84DF,
    ACTIVE_TEXTURE                 : 0x84E0,
    
    /* TextureWrapMode */
    REPEAT                         : 0x2901,
    CLAMP_TO_EDGE                  : 0x812F,
    MIRRORED_REPEAT                : 0x8370,
    
    /* Uniform Types */
    FLOAT_VEC2                     : 0x8B50,
    FLOAT_VEC3                     : 0x8B51,
    FLOAT_VEC4                     : 0x8B52,
    INT_VEC2                       : 0x8B53,
    INT_VEC3                       : 0x8B54,
    INT_VEC4                       : 0x8B55,
    BOOL                           : 0x8B56,
    BOOL_VEC2                      : 0x8B57,
    BOOL_VEC3                      : 0x8B58,
    BOOL_VEC4                      : 0x8B59,
    FLOAT_MAT2                     : 0x8B5A,
    FLOAT_MAT3                     : 0x8B5B,
    FLOAT_MAT4                     : 0x8B5C,
    SAMPLER_2D                     : 0x8B5E,
    SAMPLER_CUBE                   : 0x8B60,
    
    /* Vertex Arrays */
    VERTEX_ATTRIB_ARRAY_ENABLED        : 0x8622,
    VERTEX_ATTRIB_ARRAY_SIZE           : 0x8623,
    VERTEX_ATTRIB_ARRAY_STRIDE         : 0x8624,
    VERTEX_ATTRIB_ARRAY_TYPE           : 0x8625,
    VERTEX_ATTRIB_ARRAY_NORMALIZED     : 0x886A,
    VERTEX_ATTRIB_ARRAY_POINTER        : 0x8645,
    VERTEX_ATTRIB_ARRAY_BUFFER_BINDING : 0x889F,
    
    /* Shader Source */
    COMPILE_STATUS                 : 0x8B81,
    
    /* Shader Precision-Specified Types */
    LOW_FLOAT                      : 0x8DF0,
    MEDIUM_FLOAT                   : 0x8DF1,
    HIGH_FLOAT                     : 0x8DF2,
    LOW_INT                        : 0x8DF3,
    MEDIUM_INT                     : 0x8DF4,
    HIGH_INT                       : 0x8DF5,
    
    /* Framebuffer Object. */
    FRAMEBUFFER                    : 0x8D40,
    RENDERBUFFER                   : 0x8D41,
    
    RGBA4                          : 0x8056,
    RGB5_A1                        : 0x8057,
    RGB565                         : 0x8D62,
    DEPTH_COMPONENT16              : 0x81A5,
    STENCIL_INDEX                  : 0x1901,
    STENCIL_INDEX8                 : 0x8D48,
    DEPTH_STENCIL                  : 0x84F9,
    
    RENDERBUFFER_WIDTH             : 0x8D42,
    RENDERBUFFER_HEIGHT            : 0x8D43,
    RENDERBUFFER_INTERNAL_FORMAT   : 0x8D44,
    RENDERBUFFER_RED_SIZE          : 0x8D50,
    RENDERBUFFER_GREEN_SIZE        : 0x8D51,
    RENDERBUFFER_BLUE_SIZE         : 0x8D52,
    RENDERBUFFER_ALPHA_SIZE        : 0x8D53,
    RENDERBUFFER_DEPTH_SIZE        : 0x8D54,
    RENDERBUFFER_STENCIL_SIZE      : 0x8D55,
    
    FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE           : 0x8CD0,
    FRAMEBUFFER_ATTACHMENT_OBJECT_NAME           : 0x8CD1,
    FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL         : 0x8CD2,
    FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE : 0x8CD3,
    
    COLOR_ATTACHMENT0              : 0x8CE0,
    DEPTH_ATTACHMENT               : 0x8D00,
    STENCIL_ATTACHMENT             : 0x8D20,
    DEPTH_STENCIL_ATTACHMENT       : 0x821A,
    
    NONE                           : 0,
    
    FRAMEBUFFER_COMPLETE                      : 0x8CD5,
    FRAMEBUFFER_INCOMPLETE_ATTACHMENT         : 0x8CD6,
    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT : 0x8CD7,
    FRAMEBUFFER_INCOMPLETE_DIMENSIONS         : 0x8CD9,
    FRAMEBUFFER_UNSUPPORTED                   : 0x8CDD,
    
    FRAMEBUFFER_BINDING            : 0x8CA6,
    RENDERBUFFER_BINDING           : 0x8CA7,
    MAX_RENDERBUFFER_SIZE          : 0x84E8,
    
    INVALID_FRAMEBUFFER_OPERATION  : 0x0506,
    
    /* WebGL-specific enums */
    UNPACK_FLIP_Y_WEBGL            : 0x9240,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL : 0x9241,
    CONTEXT_LOST_WEBGL             : 0x9242,
    UNPACK_COLORSPACE_CONVERSION_WEBGL : 0x9243,
    BROWSER_DEFAULT_WEBGL          : 0x9244,
}
});
/**
 * Base class for all textures like compressed texture, texture2d, texturecube
 * TODO mapping
 */
define('qtek/Texture',['require','./core/Base','./core/util','./core/glenum','./core/Cache'],function(require) {

    var Base = require("./core/Base");
    var util = require("./core/util");
    var glenum = require("./core/glenum");
    var Cache = require("./core/Cache");

    /**
     * @constructor qtek.Texture
     * @extends qtek.core.Base
     */
    var Texture = Base.derive(
    /** @lends qtek.Texture# */
    {
        /**
         * Texture width, only needed when the texture is used as a render target
         * @type {number}
         */
        width : 512,
        /**
         * Texture height, only needed when the texture is used as a render target
         * @type {number}
         */
        height : 512,
        /**
         * Texel data type
         * @type {number}
         */
        type : glenum.UNSIGNED_BYTE,
        /**
         * Format of texel data
         * @type {number}
         */
        format : glenum.RGBA,
        /**
         * @type {number}
         */
        wrapS : glenum.CLAMP_TO_EDGE,
        /**
         * @type {number}
         */
        wrapT : glenum.CLAMP_TO_EDGE,
        /**
         * @type {number}
         */
        minFilter : glenum.LINEAR_MIPMAP_LINEAR,
        /**
         * @type {number}
         */
        magFilter : glenum.LINEAR,
        /**
         * @type {boolean}
         */
        useMipmap : true,

        /**
         * Anisotropic filtering, enabled if value is larger than 1
         * @see http://blog.tojicode.com/2012/03/anisotropic-filtering-in-webgl.html
         * @type {number}
         */
        anisotropic : 1,
        // pixelStorei parameters
        // http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml
        /**
         * @type {boolean}
         */
        flipY : true,
        /**
         * @type {number}
         */
        unpackAlignment : 4,
        /**
         * @type {boolean}
         */
        premultiplyAlpha : false,

        /**
         * Dynamic option for texture like video
         * @type {boolean}
         */
        dynamic : false,

        NPOT : false
    }, function() {
        this._cache = new Cache();
    },
    /** @lends qtek.Texture.prototype */
    {

        getWebGLTexture : function(_gl) {

            this._cache.use(_gl.__GLID__);

            if (this._cache.miss("webgl_texture")) {
                // In a new gl context, create new texture and set dirty true
                this._cache.put("webgl_texture", _gl.createTexture());
            }
            if (this.dynamic) {
                this.update(_gl);
            }
            else if (this._cache.isDirty()) {
                this.update(_gl);
                this._cache.fresh();
            }

            return this._cache.get("webgl_texture");
        },

        bind : function() {},
        unbind : function() {},
        
        /**
         * Mark texture is dirty and update in the next frame
         */
        dirty : function() {
            this._cache.dirtyAll();
        },

        update : function(_gl) {},

        // Update the common parameters of texture
        beforeUpdate : function(_gl) {
            _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
            _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
            _gl.pixelStorei(_gl.UNPACK_ALIGNMENT, this.unpackAlignment);

            this.fallBack();
        },

        fallBack : function() {

            // Use of none-power of two texture
            // http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
            
            var isPowerOfTwo = this.isPowerOfTwo();

            if (this.format === glenum.DEPTH_COMPONENT) {
                this.useMipmap = false;
            }

            if (! isPowerOfTwo || ! this.useMipmap) {
                // none-power of two flag
                this.NPOT = true;
                // Save the original value for restore
                this._minFilterOriginal = this.minFilter;
                this._magFilterOriginal = this.magFilter;
                this._wrapSOriginal = this.wrapS;
                this._wrapTOriginal = this.wrapT;

                if (this.minFilter == glenum.NEAREST_MIPMAP_NEAREST ||
                    this.minFilter == glenum.NEAREST_MIPMAP_LINEAR) {
                    this.minFilter = glenum.NEAREST;
                } else if (
                    this.minFilter == glenum.LINEAR_MIPMAP_LINEAR ||
                    this.minFilter == glenum.LINEAR_MIPMAP_NEAREST
                ) {
                    this.minFilter = glenum.LINEAR
                }

                this.wrapS = glenum.CLAMP_TO_EDGE;
                this.wrapT = glenum.CLAMP_TO_EDGE;
            } else {
                if (this._minFilterOriginal) {
                    this.minFilter = this._minFilterOriginal;
                }
                if (this._magFilterOriginal) {
                    this.magFilter = this._magFilterOriginal;
                }
                if (this._wrapSOriginal) {
                    this.wrapS = this._wrapSOriginal;
                }
                if (this._wrapTOriginal) {
                    this.wrapT = this._wrapTOriginal;
                }
            }

        },

        nextHighestPowerOfTwo : function(x) {
            --x;
            for (var i = 1; i < 32; i <<= 1) {
                x = x | x >> i;
            }
            return x + 1;
        },
        /**
         * @param  {WebGLRenderingContext} _gl
         */
        dispose : function(_gl) {
            this._cache.use(_gl.__GLID__);
            if (this._cache.get("webgl_texture")){
                _gl.deleteTexture(this._cache.get("webgl_texture"));
            }
            this._cache.deleteContext(_gl.__GLID__);
        },
        /**
         * Test if image of texture is valid and loaded.
         * @return {boolean}
         */
        isRenderable : function() {},
        
        isPowerOfTwo : function() {}
    });
    
    /* DataType */
    Texture.BYTE = glenum.BYTE;
    Texture.UNSIGNED_BYTE = glenum.UNSIGNED_BYTE;
    Texture.SHORT = glenum.SHORT;
    Texture.UNSIGNED_SHORT = glenum.UNSIGNED_SHORT;
    Texture.INT = glenum.INT;
    Texture.UNSIGNED_INT = glenum.UNSIGNED_INT;
    Texture.FLOAT = glenum.FLOAT;
    Texture.HALF_FLOAT = 36193;
    
    /* PixelFormat */
    Texture.DEPTH_COMPONENT = glenum.DEPTH_COMPONENT;
    Texture.ALPHA = glenum.ALPHA;
    Texture.RGB = glenum.RGB;
    Texture.RGBA = glenum.RGBA;
    Texture.LUMINANCE = glenum.LUMINANCE;
    Texture.LUMINANCE_ALPHA = glenum.LUMINANCE_ALPHA;

    /* Compressed Texture */
    Texture.COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
    Texture.COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
    Texture.COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
    Texture.COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

    /* TextureMagFilter */
    Texture.NEAREST = glenum.NEAREST;
    Texture.LINEAR = glenum.LINEAR;
    
    /* TextureMinFilter */
    /*      NEAREST */
    /*      LINEAR */
    Texture.NEAREST_MIPMAP_NEAREST = glenum.NEAREST_MIPMAP_NEAREST;
    Texture.LINEAR_MIPMAP_NEAREST = glenum.LINEAR_MIPMAP_NEAREST;
    Texture.NEAREST_MIPMAP_LINEAR = glenum.NEAREST_MIPMAP_LINEAR;
    Texture.LINEAR_MIPMAP_LINEAR = glenum.LINEAR_MIPMAP_LINEAR;
    
    /* TextureParameterName */
    Texture.TEXTURE_MAG_FILTER = glenum.TEXTURE_MAG_FILTER;
    Texture.TEXTURE_MIN_FILTER = glenum.TEXTURE_MIN_FILTER;

    /* TextureWrapMode */
    Texture.REPEAT = glenum.REPEAT;
    Texture.CLAMP_TO_EDGE = glenum.CLAMP_TO_EDGE;
    Texture.MIRRORED_REPEAT = glenum.MIRRORED_REPEAT;


    return Texture;
});
/**
 * @namespace qtek.core.glinfo
 * @see http://www.khronos.org/registry/webgl/extensions/
 */
define('qtek/core/glinfo',[],function() {
    var EXTENSION_LIST = [
        "OES_texture_float",
        "OES_texture_half_float",
        "OES_texture_float_linear",
        "OES_texture_half_float_linear",
        "OES_standard_derivatives",
        "OES_vertex_array_object",
        "OES_element_index_uint",
        "WEBGL_compressed_texture_s3tc",
        'WEBGL_depth_texture',
        "EXT_texture_filter_anisotropic",
        "WEBGL_draw_buffers"
    ];

    var extensions = {};

    var glinfo = {
        /**
         * Initialize all extensions in context
         * @param  {WebGLRenderingContext} _gl
         * @memberOf qtek.core.glinfo
         */
        initialize : function(_gl) {

            if (extensions[_gl.__GLID__]) {
                return;
            }
            extensions[_gl.__GLID__] = {};
            // Get webgl extension
            for (var i = 0; i < EXTENSION_LIST.length; i++) {
                var extName = EXTENSION_LIST[i];

                this._createExtension(_gl, extName);
            }
        },

        /**
         * Get extension
         * @param  {WebGLRenderingContext} _gl
         * @param {string} name - Extension name, vendorless
         * @return {WebGLExtension}
         * @memberOf qtek.core.glinfo
         */
        getExtension : function(_gl, name) {
            var glid = _gl.__GLID__;
            if (extensions[glid]) {
                if (typeof(extensions[glid][name]) == 'undefined') {
                    this._createExtension(_gl, name);
                }
                return extensions[glid][name];
            }
        },
        /**
         * Dispose context
         * @param  {WebGLRenderingContext} _gl
         * @memberOf qtek.core.glinfo
         */
        dispose: function(_gl) {
            delete extensions[_gl.__GLID__];
        },

        _createExtension : function(_gl, name) {
            var ext = _gl.getExtension(name);
            if (!ext) {
                ext = _gl.getExtension('MOZ_' + name);
            }
            if (!ext) {
                ext = _gl.getExtension('WEBKIT_' + name);
            }

            extensions[_gl.__GLID__][name] = ext;
        }
    }

    return glinfo;
});
define('qtek/texture/Texture2D',['require','../Texture','../core/glinfo','../core/glenum'],function(require) {

    var Texture = require('../Texture');
    var glinfo = require('../core/glinfo');
    var glenum = require('../core/glenum');

    /**
     * @constructor qtek.texture.Texture2D
     * @extends qtek.Texture
     *
     * @example
     *     ...
     *     var mat = new qtek.Material({
     *         shader: qtek.shader.library.get('buildin.phong', 'diffuseMap')
     *     });
     *     var diffuseMap = new qtek.texture.Texture2D();
     *     diffuseMap.load('assets/textures/diffuse.jpg');
     *     mat.set('diffuseMap', diffuseMap);
     *     ...
     *     diffuseMap.success(function() {
     *         // Wait for the diffuse texture loaded
     *         animation.on('frame', function(frameTime) {
     *             renderer.render(scene, camera);
     *         });
     *     });
     */
    var Texture2D = Texture.derive(function() {
        return /** @lends qtek.texture.Texture2D# */ {
            /**
             * @type {HTMLImageElement|HTMLCanvasElemnet}
             */
            image : null,
            /**
             * @type {Uint8Array}
             */
            pixels : null,
            /**
             * @type {Array.<Uint8Array>}
             */
            mipmaps : []
        }
    }, {
        update : function(_gl) {

            _gl.bindTexture(_gl.TEXTURE_2D, this._cache.get("webgl_texture"));
            
            this.beforeUpdate( _gl);

            var glFormat = this.format;
            var glType = this.type;

            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, this.wrapS);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, this.wrapT);

            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, this.magFilter);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, this.minFilter);
            
            var anisotropicExt = glinfo.getExtension(_gl, "EXT_texture_filter_anisotropic");
            if (anisotropicExt && this.anisotropic > 1) {
                _gl.texParameterf(_gl.TEXTURE_2D, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic);
            }

            // Fallback to float type if browser don't have half float extension
            if (glType === 36193) {
                var halfFloatExt = glinfo.getExtension(_gl, 'OES_texture_half_float');
                if (!halfFloatExt) {
                    glType = glenum.FLOAT;
                }
            }

            if (this.image) {
                _gl.texImage2D(_gl.TEXTURE_2D, 0, glFormat, glFormat, glType, this.image);
            }
            // Can be used as a blank texture when writing render to texture(RTT)
            else {
                if (
                    glFormat <= Texture.COMPRESSED_RGBA_S3TC_DXT5_EXT 
                    && glFormat >= Texture.COMPRESSED_RGB_S3TC_DXT1_EXT
                ) {
                    _gl.compressedTexImage2D(_gl.TEXTURE_2D, 0, glFormat, this.width, this.height, 0, this.pixels);
                } else {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, glFormat, this.width, this.height, 0, glFormat, glType, this.pixels);
                }
            }
            if (this.useMipmap) {
                if (this.mipmaps.length) {
                    if (this.image) {
                        for (var i = 0; i < this.mipmaps.length; i++) {
                            if (this.mipmaps[i]) {
                                _gl.texImage2D(_gl.TEXTURE_2D, i, glFormat, glFormat, glType, this.mipmaps[i]);
                            }
                        }
                    } else if (this.pixels) {
                        var width = this.width;
                        var height = this.height;
                        for (var i = 0; i < this.mipmaps.length; i++) {
                            if (this.mipmaps[i]) {
                                if (
                                    glFormat <= Texture.COMPRESSED_RGBA_S3TC_DXT5_EXT
                                    && glFormat >= Texture.COMPRESSED_RGB_S3TC_DXT1_EXT
                                ) {
                                    _gl.compressedTexImage2D(_gl.TEXTURE_2D, 0, glFormat, width, height, 0, this.mipmaps[i]);
                                } else {
                                    _gl.texImage2D(_gl.TEXTURE_2D, i, glFormat, width, height, 0, glFormat, glType, this.mipmaps[i]);
                                }
                            }
                            width /= 2;
                            height /= 2;
                        }
                    }
                } else if (!this.NPOT && !this.mipmaps.length) {
                    _gl.generateMipmap(_gl.TEXTURE_2D);
                }
            }
            
            _gl.bindTexture(_gl.TEXTURE_2D, null);

        },
        /**
         * @param  {WebGLRenderingContext} _gl
         * @memberOf qtek.texture.Texture2D.prototype
         */
        generateMipmap : function(_gl) {
            _gl.bindTexture(_gl.TEXTURE_2D, this._cache.get("webgl_texture"));
            _gl.generateMipmap(_gl.TEXTURE_2D);    
        },
        isPowerOfTwo : function() {
            if (this.image) {
                var width = this.image.width;
                var height = this.image.height;   
            } else {
                var width = this.width;
                var height = this.height;
            }
            return (width & (width-1)) === 0
                    && (height & (height-1)) === 0;
        },

        isRenderable : function() {
            if (this.image) {
                return this.image.nodeName === "CANVAS" ||
                        this.image.complete;
            } else {
                return this.width && this.height;
            }
        },
        bind : function(_gl) {
            _gl.bindTexture(_gl.TEXTURE_2D, this.getWebGLTexture(_gl));
        },
        unbind : function(_gl) {
            _gl.bindTexture(_gl.TEXTURE_2D, null);
        },
        load : function(src) {
            var image = new Image();
            var self = this;
            image.onload = function() {
                self.dirty();
                self.trigger("success", self);
                image.onload = null;
            }
            image.onerror = function() {
                self.trigger('error', self);
                image.onerror = null;
            }

            image.src = src;
            this.image = image;

            return this;
        }
    });

    return Texture2D;
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
define('qtek/core/LinkedList',['require'],function(require) {
    
    /**
     * Simple double linked list. Compared with array, it has O(1) remove operation.
     * @constructor
     * @alias qtek.core.LinkedList
     */
    var LinkedList = function() {

        /**
         * @type {qtek.core.LinkedList.Entry}
         */
        this.head = null;

        /**
         * @type {qtek.core.LinkedList.Entry}
         */
        this.tail = null;

        this._length = 0;
    }

    /**
     * Insert a new value at the tail
     * @param  {} val
     * @return {qtek.core.LinkedList.Entry}
     */
    LinkedList.prototype.insert = function(val) {
        var entry = new LinkedList.Entry(val);
        this.insertEntry(entry);
        return entry;
    }

    /**
     * Insert a new value at idx
     * @param {number} idx
     * @param  {} val
     * @return {qtek.core.LinkedList.Entry}
     */
    LinkedList.prototype.insertAt = function(idx, val) {
        if (idx < 0) {
            return;
        }
        var next = this.head;
        var cursor = 0;
        while (next && cursor != idx) {
            next = next.next;
            cursor++;
        }
        if (next) {
            var entry = new LinkedList.Entry(val);
            var prev = next.prev;
            prev.next = entry;
            entry.prev = prev;
            entry.next = next;
            next.prev = entry;
        } else {
            this.insert(val);
        }
    }

    /**
     * Insert an entry at the tail
     * @param  {qtek.core.LinkedList.Entry} entry
     */
    LinkedList.prototype.insertEntry = function(entry) {
        if (!this.head) {
            this.head = this.tail = entry;
        } else {
            this.tail.next = entry;
            entry.prev = this.tail;
            this.tail = entry;
        }
        this._length++;
    }

    /**
     * Remove entry.
     * @param  {qtek.core.LinkedList.Entry} entry
     */
    LinkedList.prototype.remove = function(entry) {
        var prev = entry.prev;
        var next = entry.next;
        if (prev) {
            prev.next = next;
        } else {
            // Is head
            this.head = next;
        }
        if (next) {
            next.prev = prev;
        } else {
            // Is tail
            this.tail = prev;
        }
        entry.next = entry.prev = null;
        this._length--;
    }

    /**
     * Remove entry at index.
     * @param  {number} idx
     * @return {}
     */
    LinkedList.prototype.removeAt = function(idx) {
        if (idx < 0) {
            return;
        }
        var curr = this.head;
        var cursor = 0;
        while (curr && cursor != idx) {
            curr = curr.next;
            cursor++;
        }
        if (curr) {
            this.remove(curr);
            return curr.value;
        }
    }
    /**
     * Get head value
     * @return {}
     */
    LinkedList.prototype.getHead = function() {
        if (this.head) {
            return this.head.value;
        }
    }
    /**
     * Get tail value
     * @return {}
     */
    LinkedList.prototype.getTail = function() {
        if (this.tail) {
            return this.tail.value;
        }
    }
    /**
     * Get value at idx 
     * @param {number} idx
     * @return {}
     */
    LinkedList.prototype.getAt = function(idx) {
        if (idx < 0) {
            return;
        }
        var curr = this.head;
        var cursor = 0;
        while (curr && cursor != idx) {
            curr = curr.next;
            cursor++;
        }
        return curr.value;
    }

    /**
     * @param  {} value
     * @return {number}
     */
    LinkedList.prototype.indexOf = function(value) {
        var curr = this.head;
        var cursor = 0;
        while (curr) {
            if (curr.value === value) {
                return cursor;
            }
            curr = curr.next;
            cursor++;
        }
    }

    /**
     * @return {number}
     */
    LinkedList.prototype.length = function() {
        return this._length;
    }

    /**
     * If list is empty
     */
    LinkedList.prototype.isEmpty = function() {
        return this._length == 0;
    }

    /**
     * @param  {Function} cb
     * @param  {} context
     */
    LinkedList.prototype.forEach = function(cb, context) {
        var curr = this.head;
        var idx = 0;
        var haveContext = typeof(context) != 'undefined';
        while (curr) {
            if (haveContext) {
                cb.call(context, curr.value, idx);
            } else {
                cb(curr.value, idx);
            }
            curr = curr.next;
            idx++;
        }
    }

    /**
     * Clear the list
     */
    LinkedList.prototype.clear = function() {
        this.tail = this.head = null;
        this._length = 0;
    }

    /**
     * @constructor
     * @param {} val
     */
    LinkedList.Entry = function(val) {
        /**
         * @type {}
         */
        this.value = val;
        
        /**
         * @type {qtek.core.LinkedList.Entry}
         */
        this.next = null;

        /**
         * @type {qtek.core.LinkedList.Entry}
         */
        this.prev = null;
    }

    return LinkedList;
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

define('qtek/math/Vector3',['require','glmatrix'],function(require) {
    
    

    var glMatrix = require("glmatrix");
    var vec3 = glMatrix.vec3;

    /**
     * @constructor
     * @alias qtek.math.Vector3
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    var Vector3 = function(x, y, z) {
        
        x = x || 0;
        y = y || 0;
        z = z || 0;

        /**
         * Storage of Vector3, read and write of x, y, z will change the values in _array
         * All methods also operate on the _array instead of x, y, z components
         * @type {Float32Array}
         */
        this._array = vec3.fromValues(x, y, z);

        /**
         * Dirty flag is used by the Node to determine
         * if the matrix is updated to latest
         * @type {boolean}
         */
        this._dirty = true;
    }

    Vector3.prototype= {

        constructor : Vector3,

        /**
         * @name x
         * @type {number}
         * @memberOf qtek.math.Vector3
         * @instance
         */
        get x() {
            return this._array[0];
        },

        set x(value) {
            this._array[0] = value;
            this._dirty = true;
        },

        /**
         * @name y
         * @type {number}
         * @memberOf qtek.math.Vector3
         * @instance
         */
        get y() {
            return this._array[1];
        },

        set y(value) {
            this._array[1] = value;
            this._dirty = true;
        },

        /**
         * @name z
         * @type {number}
         * @memberOf qtek.math.Vector3
         * @instance
         */
        get z() {
            return this._array[2];
        },

        set z(value) {
            this._array[2] = value;
            this._dirty = true;
        },

        /**
         * Add b to self
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        add : function(b) {
            vec3.add(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set x, y and z components
         * @param  {number}  x
         * @param  {number}  y
         * @param  {number}  z
         * @return {qtek.math.Vector3}
         */
        set : function(x, y, z) {
            this._array[0] = x;
            this._array[1] = y;
            this._array[2] = z;
            this._dirty = true;
            return this;
        },

        /**
         * Set x, y and z components from array
         * @param  {Float32Array|number[]} arr
         * @return {qtek.math.Vector3}
         */
        setArray : function(arr) {
            this._array[0] = arr[0];
            this._array[1] = arr[1];
            this._array[2] = arr[2];

            this._dirty = true;
            return this;
        },

        /**
         * Clone a new Vector3
         * @return {qtek.math.Vector3}
         */
        clone : function() {
            return new Vector3( this.x, this.y, this.z );
        },

        /**
         * Copy from b
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        copy : function(b) {
            vec3.copy(this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Cross product of self and b, written to a Vector3 out
         * @param  {qtek.math.Vector3} out
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        cross : function(out, b) {
            vec3.cross(out._array, this._array, b._array);
            out._dirty = true;
            return this;
        },

        /**
         * Alias for distance
         * @param  {qtek.math.Vector3} b
         * @return {number}
         */
        dist : function(b) {
            return vec3.dist(this._array, b._array);
        },

        /**
         * Distance between self and b
         * @param  {qtek.math.Vector3} b
         * @return {number}
         */
        distance : function(b) {
            return vec3.distance(this._array, b._array);
        },

        /**
         * Alias for divide
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        div : function(b) {
            vec3.div(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Divide self by b
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        divide : function(b) {
            vec3.divide(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Dot product of self and b
         * @param  {qtek.math.Vector3} b
         * @return {number}
         */
        dot : function(b) {
            return vec3.dot(this._array, b._array);
        },

        /**
         * Alias of length
         * @return {number}
         */
        len : function() {
            return vec3.len(this._array);
        },

        /**
         * Calculate the length
         * @return {number}
         */
        length : function() {
            return vec3.length(this._array);
        },
        /**
         * Linear interpolation between a and b
         * @param  {qtek.math.Vector3} a
         * @param  {qtek.math.Vector3} b
         * @param  {number}  t
         * @return {qtek.math.Vector3}
         */
        lerp : function(a, b, t) {
            vec3.lerp(this._array, a._array, b._array, t);
            this._dirty = true;
            return this;
        },

        /**
         * Minimum of self and b
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        min : function(b) {
            vec2.min(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Maximum of self and b
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        max : function(b) {
            vec2.max(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for multiply
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        mul : function(b) {
            vec3.mul(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Mutiply self and b
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        multiply : function(b) {
            vec3.multiply(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Negate self
         * @return {qtek.math.Vector3}
         */
        negate : function() {
            vec3.negate(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Normalize self
         * @return {qtek.math.Vector3}
         */
        normalize : function() {
            vec3.normalize(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Generate random x, y, z components with a given scale
         * @param  {number} scale
         * @return {qtek.math.Vector3}
         */
        random : function(scale) {
            vec3.random(this._array, scale);
            this._dirty = true;
            return this;
        },

        /**
         * Scale self
         * @param  {number}  scale
         * @return {qtek.math.Vector3}
         */
        scale : function(s) {
            vec3.scale(this._array, this._array, s);
            this._dirty = true;
            return this;
        },

        /**
         * Scale b and add to self
         * @param  {qtek.math.Vector3} b
         * @param  {number}  scale
         * @return {qtek.math.Vector3}
         */
        scaleAndAdd : function(b, s) {
            vec3.scaleAndAdd(this._array, this._array, b._array, s);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for squaredDistance
         * @param  {qtek.math.Vector3} b
         * @return {number}
         */
        sqrDist : function(b) {
            return vec3.sqrDist(this._array, b._array);
        },

        /**
         * Squared distance between self and b
         * @param  {qtek.math.Vector3} b
         * @return {number}
         */
        squaredDistance : function(b) {
            return vec3.squaredDistance(this._array, b._array);
        },

        /**
         * Alias for squaredLength
         * @return {number}
         */
        sqrLen : function() {
            return vec3.sqrLen(this._array);
        },

        /**
         * Squared length of self
         * @return {number}
         */
        squaredLength : function() {
            return vec3.squaredLength(this._array);
        },

        /**
         * Alias for subtract
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        sub : function(b) {
            vec3.sub(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Subtract b from self
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Vector3}
         */
        subtract : function(b) {
            vec3.subtract(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transform self with a Matrix3 m
         * @param  {qtek.math.Matrix3} m
         * @return {qtek.math.Vector3}
         */
        transformMat3 : function(m) {
            vec3.transformMat3(this._array, this._array, m._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transform self with a Matrix4 m
         * @param  {qtek.math.Matrix4} m
         * @return {qtek.math.Vector3}
         */
        transformMat4 : function(m) {
            vec3.transformMat4(this._array, this._array, m._array);
            this._dirty = true;
            return this;
        },
        /**
         * Transform self with a Quaternion q
         * @param  {qtek.math.Quaternion} q
         * @return {qtek.math.Vector3}
         */
        transformQuat : function(q) {
            vec3.transformQuat(this._array, this._array, q._array);
            this._dirty = true;
            return this;
        },

        /**
         * Trasnform self into projection space with m
         * @param  {qtek.math.Matrix4} m
         * @return {qtek.math.Vector3}
         */
        applyProjection : function(m) {
            var v = this._array;
            m = m._array;

            // Perspective projection
            if (m[15] === 0) {
                var w = -1 / v[2];
                v[0] = m[0] * v[0] * w;
                v[1] = m[5] * v[1] * w;
                v[2] = (m[10] * v[2] + m[14]) * w;
            } else {
                v[0] = m[0] * v[0] + m[12];
                v[1] = m[5] * v[1] + m[13];
                v[2] = m[10] * v[2] + m[14];
            }
            this._dirty = true;

            return this;
        },
        
        setEulerFromQuaternion : function(q) {
            // var sqx = q.x * q.x;
            // var sqy = q.y * q.y;
            // var sqz = q.z * q.z;
            // var sqw = q.w * q.w;
            // this.x = Math.atan2( 2 * ( q.y * q.z + q.x * q.w ), ( -sqx - sqy + sqz + sqw ) );
            // this.y = Math.asin( -2 * ( q.x * q.z - q.y * q.w ) );
            // this.z = Math.atan2( 2 * ( q.x * q.y + q.z * q.w ), ( sqx - sqy - sqz + sqw ) );

            // return this;
        },

        toString : function() {
            return "[" + Array.prototype.join.call(this._array, ",") + "]";
        },
    }

    // Supply methods that are not in place
    
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.add = function(out, a, b) {
        vec3.add(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {number}  x
     * @param  {number}  y
     * @param  {number}  z
     * @return {qtek.math.Vector3}  
     */
    Vector3.set = function(out, x, y, z) {
        vec3.set(out._array, x, y, z);
        out._dirty = true;
    }

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.copy = function(out, b) {
        vec3.copy(out._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.cross = function(out, a, b) {
        vec3.cross(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {number}
     */
    Vector3.dist = function(a, b) {
        return vec3.distance(a._array, b._array);
    }

    /**
     * @method
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {number}
     */
    Vector3.distance = Vector3.dist;

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.div = function(out, a, b) {
        vec3.divide(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @method
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.divide = Vector3.div;

    /**
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {number}
     */
    Vector3.dot = function(a, b) {
        return vec3.dot(a._array, b._array);
    }

    /**
     * @param  {qtek.math.Vector3} a
     * @return {number}
     */
    Vector3.len = function(b) {
        return vec3.length(b._array);
    }

    // Vector3.length = Vector3.len;

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @param  {number}  t
     * @return {qtek.math.Vector3}
     */
    Vector3.lerp = function(out, a, b, t) {
        vec3.lerp(out._array, a._array, b._array, t);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.min = function(out, a, b) {
        vec3.min(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.max = function(out, a, b) {
        vec3.max(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.mul = function(out, a, b) {
        vec3.multiply(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @method
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.multiply = Vector3.mul;
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @return {qtek.math.Vector3}
     */
    Vector3.negate = function(out, a) {
        vec3.negate(out._array, a._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @return {qtek.math.Vector3}
     */
    Vector3.normalize = function(out, a) {
        vec3.normalize(out._array, a._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {number}  scale
     * @return {qtek.math.Vector3}
     */
    Vector3.random = function(out, scale) {
        vec3.random(out._array, scale);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {number}  scale
     * @return {qtek.math.Vector3}
     */
    Vector3.scale = function(out, a, scale) {
        vec3.scale(out._array, a._array, scale);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @param  {number}  scale
     * @return {qtek.math.Vector3}
     */
    Vector3.scaleAndAdd = function(out, a, b, scale) {
        vec3.scaleAndAdd(out._array, a._array, b._array, scale);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {number}
     */
    Vector3.sqrDist = function(a, b) {
        return vec3.sqrDist(a._array, b._array);
    }
    /**
     * @method
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {number}
     */
    Vector3.squaredDistance = Vector3.sqrDist;
    /**
     * @param  {qtek.math.Vector3} a
     * @return {number}
     */
    Vector3.sqrLen = function(a) {
        return vec3.sqrLen(a._array);
    }
    /**
     * @method
     * @param  {qtek.math.Vector3} a
     * @return {number}
     */
    Vector3.squaredLength = Vector3.sqrLen;

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.sub = function(out, a, b) {
        vec3.subtract(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }
    /**
     * @method
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Vector3} b
     * @return {qtek.math.Vector3}
     */
    Vector3.subtract = Vector3.sub;

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {Matrix3} m
     * @return {qtek.math.Vector3}
     */
    Vector3.transformMat3 = function(out, a, m) {
        vec3.transformMat3(out._array, a._array, m._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Matrix4} m
     * @return {qtek.math.Vector3}
     */
    Vector3.transformMat4 = function(out, a, m) {
        vec3.transformMat4(out._array, a._array, m._array);
        out._dirty = true;
        return out;
    }
    /**
     * @param  {qtek.math.Vector3} out
     * @param  {qtek.math.Vector3} a
     * @param  {qtek.math.Quaternion} q
     * @return {qtek.math.Vector3}
     */
    Vector3.transformQuat = function(out, a, q) {
        vec3.transformQuat(out._array, a._array, m._array);
        out._dirty = true;
        return out;
    }
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.POSITIVE_X = new Vector3(1, 0, 0);
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.NEGATIVE_X = new Vector3(-1, 0, 0);
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.POSITIVE_Y = new Vector3(0, 1, 0);
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.NEGATIVE_Y = new Vector3(0, -1, 0);
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.POSITIVE_Z = new Vector3(0, 0, 1);
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.NEGATIVE_Z = new Vector3(0, 0, -1);
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.UP = new Vector3(0, 1, 0);
    /**
     * @type {qtek.math.Vector3}
     */
    Vector3.ZERO = new Vector3(0, 0, 0);

    return Vector3;
} );
define('qtek/math/Quaternion',['require','glmatrix'],function(require) {

    

    var glMatrix = require("glmatrix");
    var quat = glMatrix.quat;

    /**
     * @constructor
     * @alias qtek.math.Quaternion
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} w
     */
    var Quaternion = function(x, y, z, w) {

        x = x || 0;
        y = y || 0;
        z = z || 0;
        w = w === undefined ? 1 : w;

        /**
         * Storage of Quaternion, read and write of x, y, z, w will change the values in _array
         * All methods also operate on the _array instead of x, y, z, w components
         * @type {Float32Array}
         */
        this._array = quat.fromValues(x, y, z, w);

        /**
         * Dirty flag is used by the Node to determine
         * if the matrix is updated to latest
         * @type {boolean}
         */
        this._dirty = true;
    }

    Quaternion.prototype = {

        constructor : Quaternion,

        /**
         * @name x
         * @type {number}
         * @memberOf qtek.math.Quaternion
         * @instance
         */
        get x() {
            return this._array[0];
        },

        set x(value) {
            this._array[0] = value;
            this._dirty = true;
        },

        /**
         * @name y
         * @type {number}
         * @memberOf qtek.math.Quaternion
         * @instance
         */
        get y() {
            return this._array[1];
        },

        set y(value) {
            this._array[1] = value;
            this._dirty = true;
        },

        /**
         * @name z
         * @type {number}
         * @memberOf qtek.math.Quaternion
         * @instance
         */
        get z() {
            return this._array[2];
        },

        set z(value) {
            this._array[2] = value;
            this._dirty = true;
        },

        /**
         * @name w
         * @type {number}
         * @memberOf qtek.math.Quaternion
         * @instance
         */
        get w() {
            return this._array[3];
        },

        set w(value) {
            this._array[3] = value;
            this._dirty = true;
        },

        /**
         * Add b to self
         * @param  {qtek.math.Quaternion} b
         * @return {qtek.math.Quaternion}
         */
        add : function(b) {
            quat.add( this._array, this._array, b._array );
            this._dirty = true;
            return this;
        },

        /**
         * Calculate the w component from x, y, z component
         * @return {qtek.math.Quaternion}
         */
        calculateW : function() {
            quat.calculateW(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set x, y and z components
         * @param  {number}  x
         * @param  {number}  y
         * @param  {number}  z
         * @param  {number}  w
         * @return {qtek.math.Quaternion}
         */
        set : function(x, y, z, w) {
            this._array[0] = x;
            this._array[1] = y;
            this._array[2] = z;
            this._array[3] = w;
            this._dirty = true;
            return this;
        },

        /**
         * Set x, y, z and w components from array
         * @param  {Float32Array|number[]} arr
         * @return {qtek.math.Quaternion}
         */
        setArray : function(arr) {
            this._array[0] = arr[0];
            this._array[1] = arr[1];
            this._array[2] = arr[2];
            this._array[3] = arr[3];

            this._dirty = true;
            return this;
        },

        /**
         * Clone a new Quaternion
         * @return {qtek.math.Quaternion}
         */
        clone : function() {
            return new Quaternion( this.x, this.y, this.z, this.w );
        },

        /**
         * Calculates the conjugate of self If the quaternion is normalized, 
         * this function is faster than invert and produces the same result.
         * 
         * @return {qtek.math.Quaternion}
         */
        conjugate : function() {
            quat.conjugate(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Copy from b
         * @param  {qtek.math.Quaternion} b
         * @return {qtek.math.Quaternion}
         */
        copy : function(b) {
            quat.copy(this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Dot product of self and b
         * @param  {qtek.math.Quaternion} b
         * @return {number}
         */
        dot : function(b) {
            return quat.dot(this._array, b._array);
        },

        /**
         * Set from the given 3x3 rotation matrix
         * @param  {qtek.math.Matrix3} m
         * @return {qtek.math.Quaternion}
         */
        fromMat3 : function(m) {
            quat.fromMat3(this._array, m._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set from the given 4x4 rotation matrix
         * The 4th column and 4th row will be droped
         * @param  {qtek.math.Matrix4} m
         * @return {qtek.math.Quaternion}
         */
        fromMat4 : (function() {
            var mat3 = glMatrix.mat3;
            var m3 = mat3.create();
            return function(m) {
                mat3.fromMat4(m3, m._array);
                // TODO Not like mat4, mat3 in glmatrix seems to be row-based
                mat3.transpose(m3, m3);
                quat.fromMat3(this._array, m3);
                this._dirty = true;
                return this;
            }
        })(),

        /**
         * Set to identity quaternion
         * @return {qtek.math.Quaternion}
         */
        identity : function() {
            quat.identity(this._array);
            this._dirty = true;
            return this;
        },
        /**
         * Invert self
         * @return {qtek.math.Quaternion}
         */
        invert : function() {
            quat.invert(this._array, this._array);
            this._dirty = true;
            return this;
        },
        /**
         * Alias of length
         * @return {number}
         */
        len : function() {
            return quat.len(this._array);
        },

        /**
         * Calculate the length
         * @return {number}
         */
        length : function() {
            return quat.length(this._array);
        },

        /**
         * Linear interpolation between a and b
         * @param  {qtek.math.Quaternion} a
         * @param  {qtek.math.Quaternion} b
         * @param  {number}  t
         * @return {qtek.math.Quaternion}
         */
        lerp : function(a, b, t) {
            quat.lerp(this._array, a._array, b._array, t);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for multiply
         * @param  {qtek.math.Quaternion} b
         * @return {qtek.math.Quaternion}
         */
        mul : function(b) {
            quat.mul(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for multiplyLeft
         * @param  {qtek.math.Quaternion} a
         * @return {qtek.math.Quaternion}
         */
        mulLeft : function(a) {
            quat.multiply(this._array, a._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Mutiply self and b
         * @param  {qtek.math.Quaternion} b
         * @return {qtek.math.Quaternion}
         */
        multiply : function(b) {
            quat.multiply(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Mutiply a and self
         * Quaternion mutiply is not commutative, so the result of mutiplyLeft is different with multiply.
         * @param  {qtek.math.Quaternion} a
         * @return {qtek.math.Quaternion}
         */
        multiplyLeft : function(a) {
            quat.multiply(this._array, a._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Normalize self
         * @return {qtek.math.Quaternion}
         */
        normalize : function() {
            quat.normalize(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian about X axis
         * @param {number} rad
         * @return {qtek.math.Quaternion}
         */
        rotateX : function(rad) {
            quat.rotateX(this._array, this._array, rad); 
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian about Y axis
         * @param {number} rad
         * @return {qtek.math.Quaternion}
         */
        rotateY : function(rad) {
            quat.rotateY(this._array, this._array, rad);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian about Z axis
         * @param {number} rad
         * @return {qtek.math.Quaternion}
         */
        rotateZ : function(rad) {
            quat.rotateZ(this._array, this._array, rad);
            this._dirty = true;
            return this;
        },

        /**
         * Sets self to represent the shortest rotation from Vector3 a to Vector3 b.
         * a and b needs to be normalized
         * @param  {qtek.math.Vector3} a
         * @param  {qtek.math.Vector3} b
         * @return {qtek.math.Quaternion}
         */
        rotationTo : function(a, b) {
            quat.rotationTo(this._array, a._array, b._array);
            this._dirty = true;
            return this;
        },
        /**
         * Sets self with values corresponding to the given axes
         * @param {qtek.math.Vector3} view
         * @param {qtek.math.Vector3} right
         * @param {qtek.math.Vector3} up
         * @return {qtek.math.Quaternion}
         */
        setAxes : function(view, right, up) {
            quat.setAxes(this._array, view._array, right._array, up._array);
            this._dirty = true;
            return this;
        },

        /**
         * Sets self with a rotation axis and rotation angle
         * @param {qtek.math.Vector3} axis
         * @param {number} rad
         * @return {qtek.math.Quaternion}
         */
        setAxisAngle : function(axis, rad) {
            quat.setAxisAngle(this._array, axis._array, rad);
            this._dirty = true;
            return this;
        },
        /**
         * Perform spherical linear interpolation between a and b
         * @param  {qtek.math.Quaternion} a
         * @param  {qtek.math.Quaternion} b
         * @param  {number} t
         * @return {qtek.math.Quaternion}
         */
        slerp : function(a, b, t) {
            quat.slerp(this._array, a._array, b._array, t);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for squaredLength
         * @return {number}
         */
        sqrLen : function() {
            return quat.sqrLen(this._array);
        },

        /**
         * Squared length of self
         * @return {number}
         */
        squaredLength : function() {
            return quat.squaredLength(this._array);
        },

        // Set quaternion from euler angle
        setFromEuler : function(v) {
            
        },

        toString : function() {
            return "[" + Array.prototype.join.call(this._array, ",") + "]";
        }
    }

    // Supply methods that are not in place
    
    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {qtek.math.Quaternion} b
     * @return {qtek.math.Quaternion}
     */
    Quaternion.add = function(out, a, b) {
        quat.add(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {number}     x
     * @param  {number}     y
     * @param  {number}     z
     * @param  {number}     w
     * @return {qtek.math.Quaternion}
     */
    Quaternion.set = function(out, x, y, z, w) {
        quat.set(out._array, x, y, z, w);
        out._dirty = true;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} b
     * @return {qtek.math.Quaternion}
     */
    Quaternion.copy = function(out, b) {
        quat.copy(out._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @return {qtek.math.Quaternion}
     */
    Quaternion.calculateW = function(out, a) {
        quat.calculateW(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @return {qtek.math.Quaternion}
     */
    Quaternion.conjugate = function(out, a) {
        quat.conjugate(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @return {qtek.math.Quaternion}
     */
    Quaternion.identity = function(out) {
        quat.identity(out._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @return {qtek.math.Quaternion}
     */
    Quaternion.invert = function(out, a) {
        quat.invert(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} a
     * @param  {qtek.math.Quaternion} b
     * @return {number}
     */
    Quaternion.dot = function(a, b) {
        return quat.dot(a._array, b._array);
    }

    /**
     * @param  {qtek.math.Quaternion} a
     * @return {number}
     */
    Quaternion.len = function(a) {
        return quat.length(a._array);
    }

    // Quaternion.length = Quaternion.len;

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {qtek.math.Quaternion} b
     * @param  {number}     t
     * @return {qtek.math.Quaternion}
     */
    Quaternion.lerp = function(out, a, b, t) {
        quat.lerp(out._array, a._array, b._array, t);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {qtek.math.Quaternion} b
     * @param  {number}     t
     * @return {qtek.math.Quaternion}
     */
    Quaternion.slerp = function(out, a, b, t) {
        quat.slerp(out._array, a._array, b._array, t);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {qtek.math.Quaternion} b
     * @return {qtek.math.Quaternion}
     */
    Quaternion.mul = function(out, a, b) {
        quat.multiply(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @method
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {qtek.math.Quaternion} b
     * @return {qtek.math.Quaternion}
     */
    Quaternion.multiply = Quaternion.mul;

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {number}     rad
     * @return {qtek.math.Quaternion}
     */
    Quaternion.rotateX = function(out, a, rad) {
        quat.rotateX(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {number}     rad
     * @return {qtek.math.Quaternion}
     */
    Quaternion.rotateY = function(out, a, rad) {
        quat.rotateY(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @param  {number}     rad
     * @return {qtek.math.Quaternion}
     */
    Quaternion.rotateZ = function(out, a, rad) {
        quat.rotateZ(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Vector3}    axis
     * @param  {number}     rad
     * @return {qtek.math.Quaternion}
     */
    Quaternion.setAxisAngle = function(out, axis, rad) {
        quat.setAxisAngle(out._array, axis._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Quaternion} a
     * @return {qtek.math.Quaternion}
     */
    Quaternion.normalize = function(out, a) {
        quat.normalize(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} a
     * @return {number}
     */
    Quaternion.sqrLen = function(a) {
        return quat.sqrLen(a._array);
    }

    /**
     * @method
     * @param  {qtek.math.Quaternion} a
     * @return {number}
     */
    Quaternion.squaredLength = Quaternion.sqrLen;

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Matrix3}    m
     * @return {qtek.math.Quaternion}
     */
    Quaternion.fromMat3 = function(out, m) {
        quat.fromMat3(out._array, m._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Vector3}    view
     * @param  {qtek.math.Vector3}    right
     * @param  {qtek.math.Vector3}    up
     * @return {qtek.math.Quaternion}
     */
    Quaternion.setAxes = function(out, view, right, up) {
        quat.setAxes(out._array, view._array, right._array, up._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Quaternion} out
     * @param  {qtek.math.Vector3}    a
     * @param  {qtek.math.Vector3}    b
     * @return {qtek.math.Quaternion}
     */
    Quaternion.rotationTo = function(out, a, b) {
        quat.rotationTo(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    return Quaternion;
});
define('qtek/math/Matrix4',['require','glmatrix','./Vector3'],function(require) {

    

    var glMatrix = require("glmatrix");
    var Vector3 = require("./Vector3");
    var mat4 = glMatrix.mat4;
    var vec3 = glMatrix.vec3;
    var mat3 = glMatrix.mat3;
    var quat = glMatrix.quat;

    function makeProperty(n) {
        return {
            set : function(value) {
                this._array[n] = value;
                this._dirty = true;
            },
            get : function() {
                return this._array[n];
            }
        }
    }

    /**
     * @constructor
     * @alias qtek.math.Matrix4
     */
    var Matrix4 = function() {

        this._axisX = new Vector3();
        this._axisY = new Vector3();
        this._axisZ = new Vector3();

        /**
         * Storage of Matrix4
         * @type {Float32Array}
         */
        this._array = mat4.create();

        /**
         * @type {boolean}
         */
        this._dirty = true;
    };

    Matrix4.prototype = {

        constructor : Matrix4,

        /**
         * Z Axis of local transform
         * @name forward
         * @type {qtek.math.Vector3}
         * @memberOf qtek.math.Matrix4
         * @instance
         */
        get forward() {
            var el = this._array;
            this._axisZ.set(el[8], el[9], el[10]);
            return this._axisZ;
        },

        // TODO Here has a problem
        // If only set an item of vector will not work
        set forward(v) {
            var el = this._array;
            v = v._array;
            el[8] = v[0];
            el[9] = v[1];
            el[10] = v[2];

            this._dirty = true;
        },

        /**
         * Y Axis of local transform
         * @name up
         * @type {qtek.math.Vector3}
         * @memberOf qtek.math.Matrix4
         * @instance
         */
        get up() {
            var el = this._array;
            this._axisY.set(el[4], el[5], el[6]);
            return this._axisY;
        },

        set up(v) {
            var el = this._array;
            v = v._array;
            el[4] = v[0];
            el[5] = v[1];
            el[6] = v[2];

            this._dirty = true;
        },

        /**
         * X Axis of local transform
         * @name right
         * @type {qtek.math.Vector3}
         * @memberOf qtek.math.Matrix4
         * @instance
         */
        get right() {
            var el = this._array;
            this._axisX.set(el[0], el[1], el[2]);
            return this._axisX;
        },

        set right(v) {
            var el = this._array;
            v = v._array;
            el[0] = v[0];
            el[1] = v[1];
            el[2] = v[2];

            this._dirty = true;
        },

        /**
         * Calculate the adjugate of self, in-place
         * @return {qtek.math.Matrix4}
         */
        adjoint : function() {
            mat4.adjoint(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Clone a new Matrix4
         * @return {qtek.math.Matrix4}
         */
        clone : function() {
            return (new Matrix4()).copy(this);
        },

        /**
         * Copy from b
         * @param  {qtek.math.Matrix4} b
         * @return {qtek.math.Matrix4}
         */
        copy : function(a) {
            mat4.copy(this._array, a._array);
            this._dirty = true;
            return this;
        },

        /**
         * Calculate matrix determinant
         * @return {number}
         */
        determinant : function() {
            return mat4.determinant(this._array);
        },

        /**
         * Set upper 3x3 part from quaternion
         * @param  {qtek.math.Quaternion} q
         * @return {qtek.math.Matrix4}
         */
        fromQuat : function(q) {
            mat4.fromQuat(this._array, q._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set from a quaternion rotation and a vector translation
         * @param  {qtek.math.Quaternion} q
         * @param  {qtek.math.Vector3} v
         * @return {qtek.math.Matrix4}
         */
        fromRotationTranslation : function(q, v) {
            mat4.fromRotationTranslation(this._array, q._array, v._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set from Matrix2d, it is used when converting a 2d shape to 3d space.
         * In 3d space it is equivalent to ranslate on xy plane and rotate about z axis
         * @param  {qtek.math.Matrix2d} m2d
         * @return {qtek.math.Matrix4}
         */
        fromMat2d : function(m2d) {
            Matrix4.fromMat2d(this, m2d);
            return this;
        },

        /**
         * Set from frustum bounds
         * @param  {number} left
         * @param  {number} right
         * @param  {number} bottom
         * @param  {number} top
         * @param  {number} near
         * @param  {number} far
         * @return {qtek.math.Matrix4}
         */
        frustum : function(left, right, bottom, top, near, far) {
            mat4.frustum(this._array, left, right, bottom, top, near, far);
            this._dirty = true;
            return this;
        },

        /**
         * Set to a identity matrix
         * @return {qtek.math.Matrix4}
         */
        identity : function() {
            mat4.identity(this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Invert self
         * @return {qtek.math.Matrix4}
         */
        invert : function() {
            mat4.invert(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set as a matrix with the given eye position, focal point, and up axis
         * @param  {qtek.math.Vector3} eye
         * @param  {qtek.math.Vector3} center
         * @param  {qtek.math.Vector3} up
         * @return {qtek.math.Matrix4}
         */
        lookAt : function(eye, center, up) {
            mat4.lookAt(this._array, eye._array, center._array, up._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for mutiply
         * @param  {qtek.math.Matrix4} b
         * @return {qtek.math.Matrix4}
         */
        mul : function(b) {
            mat4.mul(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for multiplyLeft
         * @param  {qtek.math.Matrix4} a
         * @return {qtek.math.Matrix4}
         */
        mulLeft : function(a) {
            mat4.mul(this._array, a._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Multiply self and b
         * @param  {qtek.math.Matrix4} b
         * @return {qtek.math.Matrix4}
         */
        multiply : function(b) {
            mat4.multiply(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Multiply a and self, a is on the left
         * @param  {qtek.math.Matrix3} a
         * @return {qtek.math.Matrix3}
         */
        multiplyLeft : function(a) {
            mat4.multiply(this._array, a._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set as a orthographic projection matrix
         * @param  {number} left
         * @param  {number} right
         * @param  {number} bottom
         * @param  {number} top
         * @param  {number} near
         * @param  {number} far
         * @return {qtek.math.Matrix4}
         */
        ortho : function(left, right, bottom, top, near, far) {
            mat4.ortho(this._array, left, right, bottom, top, near, far);
            this._dirty = true;
            return this;
        },
        /**
         * Set as a perspective projection matrix
         * @param  {number} fovy
         * @param  {number} aspect
         * @param  {number} near
         * @param  {number} far
         * @return {qtek.math.Matrix4}
         */
        perspective : function(fovy, aspect, near, far) {
            mat4.perspective(this._array, fovy, aspect, near, far);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by rad about axis
         * @param  {number}   rad
         * @param  {qtek.math.Vector3} axis
         * @return {qtek.math.Matrix4}
         */
        rotate : function(rad, axis) {
            mat4.rotate(this._array, this._array, rad, axis._array);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian about X axis
         * @param {number} rad
         * @return {qtek.math.Matrix4}
         */
        rotateX : function(rad) {
            mat4.rotateX(this._array, this._array, rad);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian about Y axis
         * @param {number} rad
         * @return {qtek.math.Matrix4}
         */
        rotateY : function(rad) {
            mat4.rotateY(this._array, this._array, rad);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian about Z axis
         * @param {number} rad
         * @return {qtek.math.Matrix4}
         */
        rotateZ : function(rad) {
            mat4.rotateZ(this._array, this._array, rad);
            this._dirty = true;
            return this;
        },

        /**
         * Scale self by s
         * @param  {qtek.math.Vector3}  s
         * @return {qtek.math.Matrix4}
         */
        scale : function(v) {
            mat4.scale(this._array, this._array, v._array);
            this._dirty = true;
            return this;
        },

        /**
         * Translate self by v
         * @param  {qtek.math.Vector3}  v
         * @return {qtek.math.Matrix4}
         */
        translate : function(v) {
            mat4.translate(this._array, this._array, v._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transpose self, in-place.
         * @return {qtek.math.Matrix2}
         */
        transpose : function() {
            mat4.transpose(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Decompose a matrix to SRT
         * @param {qtek.math.Vector3} scale
         * @param {qtek.math.Quaternion} rotation
         * @param {qtek.math.Vector} position
         * @see http://msdn.microsoft.com/en-us/library/microsoft.xna.framework.matrix.decompose.aspx
         */
        decomposeMatrix : (function() {

            var x = vec3.create();
            var y = vec3.create();
            var z = vec3.create();

            var m3 = mat3.create();

            return function(scale, rotation, position) {

                var el = this._array;
                vec3.set(x, el[0], el[1], el[2]);
                vec3.set(y, el[4], el[5], el[6]);
                vec3.set(z, el[8], el[9], el[10]);

                scale.x = vec3.length(x);
                scale.y = vec3.length(y);
                scale.z = vec3.length(z);

                position.set(el[12], el[13], el[14]);

                mat3.fromMat4(m3, el);
                // Not like mat4, mat3 in glmatrix seems to be row-based
                mat3.transpose(m3, m3);

                m3[0] /= scale.x;
                m3[1] /= scale.x;
                m3[2] /= scale.x;

                m3[3] /= scale.y;
                m3[4] /= scale.y;
                m3[5] /= scale.y;

                m3[6] /= scale.z;
                m3[7] /= scale.z;
                m3[8] /= scale.z;

                quat.fromMat3(rotation._array, m3);
                quat.normalize(rotation._array, rotation._array);

                scale._dirty = true;
                rotation._dirty = true;
                position._dirty = true;
            }
        })(),

        toString : function() {
            return "[" + Array.prototype.join.call(this._array, ",") + "]";
        }
    }

    // Object.defineProperty(Matrix4.prototype, 'm00', makeProperty(0));
    // Object.defineProperty(Matrix4.prototype, 'm01', makeProperty(1));
    // Object.defineProperty(Matrix4.prototype, 'm02', makeProperty(2));
    // Object.defineProperty(Matrix4.prototype, 'm03', makeProperty(3));
    // Object.defineProperty(Matrix4.prototype, 'm10', makeProperty(4));
    // Object.defineProperty(Matrix4.prototype, 'm11', makeProperty(5));
    // Object.defineProperty(Matrix4.prototype, 'm12', makeProperty(6));
    // Object.defineProperty(Matrix4.prototype, 'm13', makeProperty(7));
    // Object.defineProperty(Matrix4.prototype, 'm20', makeProperty(8));
    // Object.defineProperty(Matrix4.prototype, 'm21', makeProperty(9));
    // Object.defineProperty(Matrix4.prototype, 'm22', makeProperty(10));
    // Object.defineProperty(Matrix4.prototype, 'm23', makeProperty(11));
    // Object.defineProperty(Matrix4.prototype, 'm30', makeProperty(12));
    // Object.defineProperty(Matrix4.prototype, 'm31', makeProperty(13));
    // Object.defineProperty(Matrix4.prototype, 'm32', makeProperty(14));
    // Object.defineProperty(Matrix4.prototype, 'm33', makeProperty(15));

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @return {qtek.math.Matrix4}
     */
    Matrix4.adjoint = function(out, a) {
        mat4.adjoint(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @return {qtek.math.Matrix4}
     */
    Matrix4.copy = function(out, a) {
        mat4.copy(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} a
     * @return {number}
     */
    Matrix4.determinant = function(a) {
        return mat4.determinant(a._array);
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @return {qtek.math.Matrix4}
     */
    Matrix4.identity = function(out) {
        mat4.identity(out._array);
        out._dirty = true;
        return out;
    }
    
    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {number}  left
     * @param  {number}  right
     * @param  {number}  bottom
     * @param  {number}  top
     * @param  {number}  near
     * @param  {number}  far
     * @return {qtek.math.Matrix4}
     */
    Matrix4.ortho = function(out, left, right, bottom, top, near, far) {
        mat4.ortho(out._array, left, right, bottom, top, near, far);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {number}  fovy
     * @param  {number}  aspect
     * @param  {number}  near
     * @param  {number}  far
     * @return {qtek.math.Matrix4}
     */
    Matrix4.perspective = function(out, fovy, aspect, near, far) {
        mat4.perspective(out._array, fovy, aspect, near, far);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Vector3} eye
     * @param  {qtek.math.Vector3} center
     * @param  {qtek.math.Vector3} up
     * @return {qtek.math.Matrix4}
     */
    Matrix4.lookAt = function(out, eye, center, up) {
        mat4.lookAt(out._array, eye._array, center._array, up._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @return {qtek.math.Matrix4}
     */
    Matrix4.invert = function(out, a) {
        mat4.invert(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {qtek.math.Matrix4} b
     * @return {qtek.math.Matrix4}
     */
    Matrix4.mul = function(out, a, b) {
        mat4.mul(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @method
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {qtek.math.Matrix4} b
     * @return {qtek.math.Matrix4}
     */
    Matrix4.multiply = Matrix4.mul;

    /**
     * @param  {qtek.math.Matrix4}    out
     * @param  {qtek.math.Quaternion} q
     * @return {qtek.math.Matrix4}
     */
    Matrix4.fromQuat = function(out, q) {
        mat4.fromQuat(out._array, q._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4}    out
     * @param  {qtek.math.Quaternion} q
     * @param  {qtek.math.Vector3}    v
     * @return {qtek.math.Matrix4}
     */
    Matrix4.fromRotationTranslation = function(out, q, v) {
        mat4.fromRotationTranslation(out._array, q._array, v._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} m4
     * @param  {qtek.math.Matrix2d} m2d
     * @return {qtek.math.Matrix4}
     */
    Matrix4.fromMat2d = function(m4, m2d) {
        m4._dirty = true;
        var m2d = m2d._array;
        var m4 = m4._array;

        m4[0] = m2d[0];
        m4[4] = m2d[2];
        m4[12] = m2d[4];

        m4[1] = m2d[1];
        m4[5] = m2d[3];
        m4[13] = m2d[5];

        return m4;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {number}  rad
     * @param  {qtek.math.Vector3} axis
     * @return {qtek.math.Matrix4}
     */
    Matrix4.rotate = function(out, a, rad, axis) {
        mat4.rotate(out._array, a._array, rad, axis._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {number}  rad
     * @return {qtek.math.Matrix4}
     */
    Matrix4.rotateX = function(out, a, rad) {
        mat4.rotateX(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {number}  rad
     * @return {qtek.math.Matrix4}
     */
    Matrix4.rotateY = function(out, a, rad) {
        mat4.rotateY(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {number}  rad
     * @return {qtek.math.Matrix4}
     */
    Matrix4.rotateZ = function(out, a, rad) {
        mat4.rotateZ(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {qtek.math.Vector3} v
     * @return {qtek.math.Matrix4}
     */
    Matrix4.scale = function(out, a, v) {
        mat4.scale(out._array, a._array, v._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @return {qtek.math.Matrix4}
     */
    Matrix4.transpose = function(out, a) {
        mat4.transpose(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix4} out
     * @param  {qtek.math.Matrix4} a
     * @param  {qtek.math.Vector3} v
     * @return {qtek.math.Matrix4}
     */
    Matrix4.translate = function(out, a, v) {
        mat4.translate(out._array, a._array, v._array);
        out._dirty = true;
        return out;
    }

    return Matrix4;
});
define('qtek/math/Matrix3',['require','glmatrix'],function(require) {

    

    var glMatrix = require("glmatrix");
    var mat3 = glMatrix.mat3;

    function makeProperty(n) {
        return {
            configurable : false,
            set : function(value) {
                this._array[n] = value;
                this._dirty = true;
            },
            get : function() {
                return this._array[n];
            }
        }
    }

    /**
     * @constructor
     * @alias qtek.math.Matrix3
     */
    var Matrix3 = function() {

        /**
         * Storage of Matrix3
         * @type {Float32Array}
         */
        this._array = mat3.create();

        /**
         * @type {boolean}
         */
        this._dirty = true;
    };

    Matrix3.prototype = {

        constructor : Matrix3,

        /**
         * Calculate the adjugate of self, in-place
         * @return {qtek.math.Matrix3}
         */
        adjoint : function() {
            mat3.adjoint(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Clone a new Matrix3
         * @return {qtek.math.Matrix3}
         */
        clone : function() {
            return (new Matrix3()).copy(this);
        },

        /**
         * Copy from b
         * @param  {qtek.math.Matrix3} b
         * @return {qtek.math.Matrix3}
         */
        copy : function(b) {
            mat3.copy(this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Calculate matrix determinant
         * @return {number}
         */
        determinant : function() {
            return mat3.determinant(this._array);
        },

        /**
         * Copy the values from Matrix2d a
         * @param  {qtek.math.Matrix2d} a
         * @return {qtek.math.Matrix3}
         */
        fromMat2d : function(a) {
            mat3.fromMat2d(this._array, a._array);
            this._dirty = true;
            return this;
        },

        /**
         * Copies the upper-left 3x3 values of Matrix4
         * @param  {qtek.math.Matrix4} a
         * @return {qtek.math.Matrix3}
         */
        fromMat4 : function(a) {
            mat3.fromMat4(this._array, a._array);
            this._dirty = true;
            return this;
        },

        /**
         * Calculates a rotation matrix from the given quaternion
         * @param  {qtek.math.Quaternion} q
         * @return {qtek.math.Matrix3}
         */
        fromQuat : function(q) {
            mat3.fromQuat(this._array, q._array);
            this._dirty = true;
            return this;
        },

        /**
         * Set to a identity matrix
         * @return {qtek.math.Matrix3}
         */
        identity : function() {
            mat3.identity(this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Invert self
         * @return {qtek.math.Matrix3}
         */
        invert : function() {
            mat3.invert(this._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for mutiply
         * @param  {qtek.math.Matrix3} b
         * @return {qtek.math.Matrix3}
         */
        mul : function(b) {
            mat3.mul(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Alias for multiplyLeft
         * @param  {qtek.math.Matrix3} a
         * @return {qtek.math.Matrix3}
         */
        mulLeft : function(a) {
            mat3.mul(this._array, a._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Multiply self and b
         * @param  {qtek.math.Matrix3} b
         * @return {qtek.math.Matrix3}
         */
        multiply : function(b) {
            mat3.multiply(this._array, this._array, b._array);
            this._dirty = true;
            return this;
        },

        /**
         * Multiply a and self, a is on the left
         * @param  {qtek.math.Matrix3} a
         * @return {qtek.math.Matrix3}
         */
        multiplyLeft : function(a) {
            mat3.multiply(this._array, a._array, this._array);
            this._dirty = true;
            return this;
        },

        /**
         * Rotate self by a given radian
         * @param  {number}   rad
         * @return {qtek.math.Matrix3}
         */
        rotate : function(rad) {
            mat3.rotate(this._array, this._array, rad);
            this._dirty = true;
            return this;
        },

        /**
         * Scale self by s
         * @param  {qtek.math.Vector2}  s
         * @return {qtek.math.Matrix3}
         */
        scale : function(v) {
            mat3.scale(this._array, this._array, v._array);
            this._dirty = true;
            return this;
        },

        /**
         * Translate self by v
         * @param  {qtek.math.Vector2}  v
         * @return {qtek.math.Matrix3}
         */
        translate : function(v) {
            mat3.translate(this._array, this._array, v._array);
            this._dirty = true;
            return this;
        },
        /**
         * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
         * @param {qtek.math.Matrix4} a
         */
        normalFromMat4 : function(a) {
            mat3.normalFromMat4(this._array, a._array);
            this._dirty = true;
            return this;
        },

        /**
         * Transpose self, in-place.
         * @return {qtek.math.Matrix2}
         */
        transpose : function() {
            mat3.transpose(this._array, this._array);
            this._dirty = true;
            return this;
        },
        toString : function() {
            return "[" + Array.prototype.join.call(this._array, ",") + "]";
        }
    }
    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.adjoint = function(out, a) {
        mat3.adjoint(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.copy = function(out, a) {
        mat3.copy(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} a
     * @return {number}
     */
    Matrix3.determinant = function(a) {
        return mat3.determinant(a._array);
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @return {qtek.math.Matrix3}
     */
    Matrix3.identity = function(out) {
        mat3.identity(out._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.invert = function(out, a) {
        mat3.invert(out._array, a._array);
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @param  {qtek.math.Matrix3} b
     * @return {qtek.math.Matrix3}
     */
    Matrix3.mul = function(out, a, b) {
        mat3.mul(out._array, a._array, b._array);
        out._dirty = true;
        return out;
    }

    /**
     * @method
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @param  {qtek.math.Matrix3} b
     * @return {qtek.math.Matrix3}
     */
    Matrix3.multiply = Matrix3.mul;
    
    /**
     * @param  {qtek.math.Matrix3}  out
     * @param  {qtek.math.Matrix2d} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.fromMat2d = function(out, a) {
        mat3.fromMat2d(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix4} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.fromMat4 = function(out, a) {
        mat3.fromMat4(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3}    out
     * @param  {qtek.math.Quaternion} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.fromQuat = function(out, q) {
        mat3.fromQuat(out._array, q._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix4} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.normalFromMat4 = function(out, a) {
        mat3.normalFromMat4(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @param  {number}  rad
     * @return {qtek.math.Matrix3}
     */
    Matrix3.rotate = function(out, a, rad) {
        mat3.rotate(out._array, a._array, rad);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @param  {qtek.math.Vector2} v
     * @return {qtek.math.Matrix3}
     */
    Matrix3.scale = function(out, a, v) {
        mat3.scale(out._array, a._array, v._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @return {qtek.math.Matrix3}
     */
    Matrix3.transpose = function(out, a) {
        mat3.transpose(out._array, a._array);
        out._dirty = true;
        return out;
    }

    /**
     * @param  {qtek.math.Matrix3} out
     * @param  {qtek.math.Matrix3} a
     * @param  {qtek.math.Vector2} v
     * @return {qtek.math.Matrix3}
     */
    Matrix3.translate = function(out, a, v) {
        mat3.translate(out._array, a._array, v._array);
        out._dirty = true;
        return out;
    }

    return Matrix3;
});
define('qtek/Node',['require','./core/Base','./core/util','./math/Vector3','./math/Quaternion','./math/Matrix4','./math/Matrix3','glmatrix'],function(require) {
    
    

    var Base = require("./core/Base");
    var util = require("./core/util");
    var Vector3 = require("./math/Vector3");
    var Quaternion = require("./math/Quaternion");
    var Matrix4 = require("./math/Matrix4");
    var Matrix3 = require("./math/Matrix3");
    var glMatrix = require('glmatrix');
    var mat4 = glMatrix.mat4;

    var nameId = 0;

    /**
     * @constructor qtek.Node
     * @extends qtek.core.Base
     */
    var Node = Base.derive(
    /** @lends qtek.Node# */
    {
        /**
         * Scene node name
         * @type {string}
         */
        name: '',

        /**
         * Position relative to its parent node. aka translation.
         * @type {qtek.math.Vector3}
         */
        position: null,
        
        /**
         * Rotation relative to its parent node. Represented by a quaternion
         * @type {qtek.math.Quaternion}
         */
        rotation: null,
        
        /**
         * Scale relative to its parent node
         * @type {qtek.math.Vector3}
         */
        scale: null,

        /**
         * Affine transform matrix relative to its root scene.
         * @type {qtek.math.Matrix4}
         */
        worldTransform: null,

        /**
         * Affine transform matrix relative to its parent node.
         * Composite with position, rotation and scale.
         * @type {qtek.math.Matrix4}
         */
        localTransform: null,
        
        /**
         * Parent of current scene node
         * @type {?qtek.Node}
         */
        parent : null,
        
        /**
         * The root scene attached to. Null if it is a isolated node
         * @type {?qtek.Scene}
         */
        scene : null,

        /**
         * If the local transform is update from SRT(scale, rotation, translation, which is position here) each frame
         * @type {boolean}
         */
        autoUpdateLocalTransform : true,

        _needsUpdateWorldTransform : true,

        _inIterating : false,

        // Depth for transparent queue sorting
        __depth : 0

    }, function() {

        if (!this.name) {
            this.name = 'NODE_' + (nameId++);
        }

        if (!this.position) {
            this.position = new Vector3();
        }
        if (!this.rotation) {
            this.rotation = new Quaternion();
        }
        if (!this.scale) {
            this.scale = new Vector3(1, 1, 1);
        }

        this.worldTransform = new Matrix4();
        this.localTransform = new Matrix4();

        this._children = [];

    },
    /**@lends qtek.Node.prototype. */
    {

        /**
         * If node and its chilren visible
         * @type {boolean}
         * @memberOf qtek.Node
         * @instance
         */
        visible : true,

        /**
         * Return true if it is a renderable scene node, like Mesh and ParticleSystem
         * @return {boolean}
         */
        isRenderable : function() {
            return false;
        },

        /**
         * Set the name of the scene node
         * @param {string} name
         */
        setName : function(name) {
            if (this.scene) {
                delete this.scene._nodeRepository[this.name];
                this.scene._nodeRepository[name] = this;
            }
            this.name = name;
        },

        /**
         * Add a child node
         * @param {qtek.Node} node
         */
        add : function(node) {
            if (this._inIterating) {
                console.warn('Add operation can cause unpredictable error when in iterating');
            }
            if (node.parent === this) {
                return;
            }
            if (node.parent) {
                node.parent.remove(node);
            }
            node.parent = this;
            this._children.push(node);

            if (this.scene && this.scene !== node.scene) {
                node.traverse(this._addSelfToScene, this);
            }
        },

        /**
         * Remove the given child scene node
         * @param {qtek.Node} node
         */
        remove : function(node) {
            if (this._inIterating) {
                console.warn('Remove operation can cause unpredictable error when in iterating');
            }

            var idx = this._children.indexOf(node);
            if (idx < 0) {
                return;
            }

            this._children.splice(idx, 1);
            node.parent = null;

            if (this.scene) {
                node.traverse(this._removeSelfFromScene, this);
            }
        },

        _removeSelfFromScene : function(descendant) {
            descendant.scene.removeFromScene(descendant);
            descendant.scene = null;
        },

        _addSelfToScene : function(descendant, parent) {
            parent.scene.addToScene(descendant);
            descendant.scene = parent.scene;
        },

        /**
         * Return true if it is ancestor of the given scene node
         * @param {qtek.Node} node
         */
        isAncestor : function(node) {
            var parent = node.parent;
            while(parent) {
                if (parent === this) {
                    return true;
                }
                parent = parent.parent;
            }
            return false;
        },

        /**
         * Get a new created array of all its children nodes
         * @return {qtek.Node[]}
         */
        children : function() {
            return this._children.slice();
        },

        childAt : function(idx) {
            return this._children[idx];
        },

        /**
         * Get first child have the given name
         * @param {string} name
         * @return {qtek.Node}
         */
        getChildByName : function(name) {
            for (var i = 0; i < this._children.length; i++) {
                if (this._children[i].name === name) {
                    return this._children[i];
                }
            }
        },

        /**
         * Get first descendant have the given name
         * @param {string} name
         * @return {qtek.Node}
         */
        getDescendantByName : function(name) {
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                if (child.name === name) {
                    return child;
                } else {
                    var res = child.getDescendantByName(name);
                    if (res) {
                        return res;
                    }
                }
            }
        },

        /**
         * Depth first traverse all its descendant scene nodes and
         * @param {Function} callback
         * @param {Node} [parent]
         * @param {Function} [ctor]
         */
        traverse : function(callback, parent, ctor) {
            
            this._inIterating = true;

            if (ctor === undefined || this.constructor === ctor) {
                callback(this, parent);
            }
            var _children = this._children;
            for(var i = 0, len = _children.length; i < len; i++) {
                _children[i].traverse(callback, this, ctor);
            }

            this._inIterating = false;
        },

        /**
         * Set the local transform and decompose to SRT
         * @param {qtek.math.Matrix4} matrix
         */
        setLocalTransform : function(matrix) {
            mat4.copy(this.localTransform._array, matrix._array);
            this.decomposeLocalTransform();
        },

        /**
         * Decompose the local transform to SRT
         */
        decomposeLocalTransform : function() {
            this.localTransform.decomposeMatrix(this.scale, this.rotation, this.position);
        },

        /**
         * Set the world transform and decompose to SRT
         * @param {qtek.math.Matrix4} matrix
         */
        setWorldTransform : function(matrix) {
            mat4.copy(this.worldTransform._array, matrix._array);
            this.decomposeWorldTransform();
        },

        /**
         * Decompose the world transform to SRT
         * @method
         */
        decomposeWorldTransform : (function() {
            
            var tmp = mat4.create();

            return function(matrix) {
                // Assume world transform is updated
                if (this.parent) {
                    mat4.invert(tmp, this.parent.worldTransform._array);
                    mat4.multiply(this.localTransform._array, tmp, this.worldTransform._array);
                } else {
                    mat4.copy(this.localTransform._array, matrix._array);
                }
                this.localTransform.decomposeMatrix(this.scale, this.rotation, this.position);
            }
        })(),

        /**
         * Update local transform from SRT
         * Notice that local transform will not be updated if _dirty mark of position, rotation, scale is all false
         */
        updateLocalTransform : function() {
            var position = this.position;
            var rotation = this.rotation;
            var scale = this.scale;

            if (position._dirty || scale._dirty || rotation._dirty) {
                var m = this.localTransform._array;

                // Transform order, scale->rotation->position
                mat4.fromRotationTranslation(m, rotation._array, position._array);

                mat4.scale(m, m, scale._array);

                rotation._dirty = false;
                scale._dirty = false;
                position._dirty = false;

                this._needsUpdateWorldTransform = true;
            }
        },

        /**
         * Update world transform, assume its parent world transform have been updated
         */
        updateWorldTransform : function() {
            if (this.parent) {
                mat4.multiply(
                    this.worldTransform._array,
                    this.parent.worldTransform._array,
                    this.localTransform._array
                )
            } else {
                mat4.copy(
                    this.worldTransform._array, this.localTransform._array 
                )
            }
        },

        /**
         * Update local transform and world transform recursively
         * @param {boolean} forceUpdateWorld 
         */
        update : function(forceUpdateWorld) {
            if (this.autoUpdateLocalTransform) {
                this.updateLocalTransform();
            } else {
                // Transform is manually setted
                forceUpdateWorld = true;
            }

            if (forceUpdateWorld || this._needsUpdateWorldTransform) {
                this.updateWorldTransform();
                forceUpdateWorld = true;
                this._needsUpdateWorldTransform = false;
            }
            
            for(var i = 0, len = this._children.length; i < len; i++) {
                this._children[i].update(forceUpdateWorld);
            }
        },

        /**
         * Get world position, extracted from world transform
         * @param  {math.Vector3} [out]
         * @return {math.Vector3}
         */
        getWorldPosition : function(out) {
            var m = this.worldTransform._array;
            if (out) {
                out._array[0] = m[12];
                out._array[1] = m[13];
                out._array[2] = m[14];
                return out;
            } else {
                return new Vector3(m[12], m[13], m[14]);
            }
        },

        /**
         * Clone a new node
         * @return {Node}
         */
        clone : function() {
            // TODO Name
            var node = new this.constructor();
            node.position.copy(this.position);
            node.rotation.copy(this.rotation);
            node.scale.copy(this.scale);

            for (var i = 0; i < this._children.length; i++) {
                node.add(this._children[i].clone());
            }
            return node;
        },

        /**
         * Rotate the node around a axis by angle degrees, axis passes through point
         * @param {math.Vector3} point Center point
         * @param {math.Vector3} axis  Center axis
         * @param {number}       angle Rotation angle
         * @see http://docs.unity3d.com/Documentation/ScriptReference/Transform.RotateAround.html
         * @method
         */
        rotateAround : (function() {
            var v = new Vector3();
            var RTMatrix = new Matrix4();

            // TODO improve performance
            return function(point, axis, angle) {

                v.copy(this.position).subtract(point);

                this.localTransform.identity();
                // parent node
                this.localTransform.translate(point);
                this.localTransform.rotate(angle, axis);

                RTMatrix.fromRotationTranslation(this.rotation, v);
                this.localTransform.multiply(RTMatrix);
                this.localTransform.scale(this.scale);

                this.decomposeLocalTransform();
                this._needsUpdateWorldTransform = true;
            }
        })(),

        /**
         * @param {math.Vector3} target
         * @param {math.Vector3} [up]
         * @see http://www.opengl.org/sdk/docs/man2/xhtml/gluLookAt.xml
         * @method
         */
        lookAt : (function() {
            var m = new Matrix4();
            var scaleVector = new Vector3();
            return function(target, up) {
                m.lookAt(this.position, target, up || this.localTransform.up).invert();
                m.decomposeMatrix(scaleVector, this.rotation, this.position);
            }
        })()
    });

    return Node;
});
/**
 * Mainly do the parse and compile of shader string
 * Support shader code chunk import and export
 * Support shader semantics
 * http://www.nvidia.com/object/using_sas.html
 * https://github.com/KhronosGroup/collada2json/issues/45
 *
 */
define('qtek/Shader',['require','./core/Base','./core/util','./core/Cache','glmatrix'],function(require) {
    
    

    var Base = require("./core/Base");
    var util = require("./core/util");
    var Cache = require("./core/Cache");
    var glMatrix = require("glmatrix");
    var mat2 = glMatrix.mat2;
    var mat3 = glMatrix.mat3;
    var mat4 = glMatrix.mat4;

    var uniformRegex = /uniform\s+(bool|float|int|vec2|vec3|vec4|ivec2|ivec3|ivec4|mat2|mat3|mat4|sampler2D|samplerCube)\s+([\w\,]+)?(\[.*?\])?\s*(:\s*([\S\s]+?))?;/g;
    var attributeRegex = /attribute\s+(float|int|vec2|vec3|vec4)\s+(\w*)\s*(:\s*(\w+))?;/g;
    var defineRegex = /#define\s+(\w+)?(\s+[\w-.]+)?\s*\n/g;

    var uniformTypeMap = {
        "bool" : "1i",
        "int" : "1i",
        "sampler2D" : "t",
        "samplerCube" : "t",
        "float" : "1f",
        "vec2" : "2f",
        "vec3" : "3f",
        "vec4" : "4f",
        "ivec2" : "2i",
        "ivec3" : "3i",
        "ivec4" : "4i",
        "mat2" : "m2",
        "mat3" : "m3",
        "mat4" : "m4"
    }
    var uniformValueConstructor = {
        'bool' : function() {return true;},
        'int' : function() {return 0;},
        'float' : function() {return 0;},
        'sampler2D' : function() {return null;},
        'samplerCube' : function() {return null;},

        'vec2' : function() {return [0, 0];},
        'vec3' : function() {return [0, 0, 0];},
        'vec4' : function() {return [0, 0, 0, 0];},

        'ivec2' : function() {return [0, 0];},
        'ivec3' : function() {return [0, 0, 0];},
        'ivec4' : function() {return [0, 0, 0, 0];},

        'mat2' : function() {return mat2.create();},
        'mat3' : function() {return mat3.create();},
        'mat4' : function() {return mat4.create();},

        'array' : function() {return [];}
    }
    var attribSemantics = [
        'POSITION', 
        'NORMAL',
        'BINORMAL',
        'TANGENT',
        'TEXCOORD',
        'TEXCOORD_0',
        'TEXCOORD_1',
        'COLOR',
        // Skinning
        // https://github.com/KhronosGroup/glTF/blob/master/specification/README.md#semantics
        'JOINT',
        'WEIGHT',
        'SKIN_MATRIX'
    ];
    var matrixSemantics = [
        'WORLD',
        'VIEW',
        'PROJECTION',
        'WORLDVIEW',
        'VIEWPROJECTION',
        'WORLDVIEWPROJECTION',
        'WORLDINVERSE',
        'VIEWINVERSE',
        'PROJECTIONINVERSE',
        'WORLDVIEWINVERSE',
        'VIEWPROJECTIONINVERSE',
        'WORLDVIEWPROJECTIONINVERSE',
        'WORLDTRANSPOSE',
        'VIEWTRANSPOSE',
        'PROJECTIONTRANSPOSE',
        'WORLDVIEWTRANSPOSE',
        'VIEWPROJECTIONTRANSPOSE',
        'WORLDVIEWPROJECTIONTRANSPOSE',
        'WORLDINVERSETRANSPOSE',
        'VIEWINVERSETRANSPOSE',
        'PROJECTIONINVERSETRANSPOSE',
        'WORLDVIEWINVERSETRANSPOSE',
        'VIEWPROJECTIONINVERSETRANSPOSE',
        'WORLDVIEWPROJECTIONINVERSETRANSPOSE'
    ];
    
    // Enable attribute operation is global to all programs
    // Here saved the list of all enabled attribute index 
    // http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
    var enabledAttributeList = {};

    var SHADER_STATE_TO_ENABLE = 1;
    var SHADER_STATE_KEEP_ENABLE = 2;
    var SHADER_STATE_PENDING = 3;

    /**
     * @constructor qtek.Shader
     * @extends qtek.core.Base
     *
     * @example
     *     // Create a phong shader
     *     var shader = new qtek.Shader({
     *         vertex: qtek.Shader.source('buildin.phong.vertex'),
     *         fragment: qtek.Shader.source('buildin.phong.fragment')
     *     });
     *     // Enable diffuse texture
     *     shader.enableTexture('diffuseMap');
     *     // Use alpha channel in diffuse texture
     *     shader.define('fragment', 'DIFFUSEMAP_ALPHA_ALPHA');
     */
    var Shader = Base.derive(function() {
        return /** @lends qtek.Shader# */ {
            /**
             * Vertex shader code
             * @type {string}
             */
            vertex : "",
            
            /**
             * Fragment shader code
             * @type {string}
             */
            fragment : "",


            precision : "mediump",
            // Properties follow will be generated by the program
            attribSemantics : {},
            matrixSemantics : {},
            matrixSemanticKeys : [],

            uniformTemplates : {},
            attributeTemplates : {},

            /**
             * Custom defined values in the vertex shader
             * @type {Object}
             */
            vertexDefines : {},
            /**
             * Custom defined values in the vertex shader
             * @type {Object}
             */
            fragmentDefines : {},

            // Glue code
            // Defines the each type light number in the scene
            // AMBIENT_LIGHT
            // POINT_LIGHT
            // SPOT_LIGHT
            // AREA_LIGHT
            lightNumber : {},

            _uniformList : [],
            // {
            //  enabled : true
            //  shaderType : "vertex",
            // }
            _textureStatus : {},

            _vertexProcessed : "",
            _fragmentProcessed : "",

            _currentLocationsMap : {}
        }
    }, function() {
        
        this._cache = new Cache();

        this._updateShaderString();
    },
    /** @lends qtek.Shader.prototype */
    {
        /**
         * Set vertex shader code
         * @param {string} str
         */
        setVertex : function(str) {
            this.vertex = str;
            this._updateShaderString();
            this.dirty();
        },

        /**
         * Set fragment shader code
         * @param {string} str
         */
        setFragment : function(str) {
            this.fragment = str;
            this._updateShaderString();
            this.dirty();
        },

        /**
         * Bind shader program
         * Return true or error msg if error happened
         * @param {WebGLRenderingContext} _gl
         */
        bind : function(_gl) {
            this._cache.use(_gl.__GLID__, getCacheSchema);

            this._currentLocationsMap = this._cache.get('locations');

            if (this._cache.isDirty()) {
                this._updateShaderString();
                var errMsg = this._buildProgram(_gl, this._vertexProcessed, this._fragmentProcessed);
                this._cache.fresh();
                
                if (errMsg) {
                    return errMsg;
                }
            }

            _gl.useProgram(this._cache.get("program"));
        },

        /**
         * Mark dirty and update program in next frame
         */
        dirty : function() {
            this._cache.dirtyAll();
            for (var i = 0; i < this._cache._caches.length; i++) {
                if (this._cache._caches[i]) {
                    var context = this._cache._caches[i];
                    context["locations"] = {};
                    context["attriblocations"] = {};
                }
            }
        },

        _updateShaderString : function() {

            if (this.vertex !== this._vertexPrev ||
                this.fragment !== this._fragmentPrev) {

                this._parseImport();
                
                this.attribSemantics = {};
                this.matrixSemantics = {};
                this._textureStatus = {};

                this._parseUniforms();
                this._parseAttributes();
                this._parseDefines();

                this._vertexPrev = this.vertex;
                this._fragmentPrev = this.fragment;
            }
            this._addDefine();
        },

        /**
         * Add a #define micro in shader code
         * @param  {string} shaderType Can be vertex, fragment or both
         * @param  {string} symbol
         * @param  {number} [val]
         */
        define : function(shaderType, symbol, val) {
            val = val !== undefined ? val : null;
            if (shaderType == 'vertex' || shaderType == 'both') {
                if (this.vertexDefines[symbol] !== val) {
                    this.vertexDefines[symbol] = val;
                    // Mark as dirty
                    this.dirty();
                }
            }
            if (shaderType == 'fragment' || shaderType == 'both') {
                if (this.fragmentDefines[symbol] !== val) {
                    this.fragmentDefines[symbol] = val;
                    if (shaderType !== 'both') {
                        this.dirty();
                    }
                }
            }
        },

        /**
         * @param  {string} shaderType Can be vertex, fragment or both
         * @param  {string} symbol
         */
        unDefine : function(shaderType, symbol) {
            if (shaderType == 'vertex' || shaderType == 'both') {
                if (this.isDefined('vertex', symbol)) {
                    delete this.vertexDefines[symbol];
                    // Mark as dirty
                    this.dirty();
                }
            }
            if (shaderType == 'fragment' || shaderType == 'both') {
                if (this.isDefined('fragment', symbol)) {
                    delete this.fragmentDefines[symbol];
                    if (shaderType !== 'both') {
                        this.dirty();
                    }
                }
            }
        },

        /**
         * @param  {string} shaderType Can be vertex, fragment or both
         * @param  {string} symbol
         */
        isDefined : function(shaderType, symbol) {
            switch(shaderType) {
                case "vertex":
                    return this.vertexDefines[symbol] !== undefined;
                case "fragment":
                    return this.fragmentDefines[symbol] !== undefined;
            }
        },
        /**
         * @param  {string} shaderType Can be vertex, fragment or both
         * @param  {string} symbol
         */
        getDefine : function(shaderType, symbol) {
            switch(shaderType) {
                case "vertex":
                    return this.vertexDefines[symbol];
                case "fragment":
                    return this.fragmentDefines[symbol];
            }
        },
        /**
         * Enable a texture, actually it will add a #define micro in the shader code
         * For example, if texture symbol is diffuseMap, it will add a line `#define DIFFUSEMAP_ENABLED` in the shader code
         * @param  {string} symbol
         */
        enableTexture : function(symbol) {
            var status = this._textureStatus[symbol];
            if (status) {
                var isEnabled = status.enabled;
                if (!isEnabled) {
                    status.enabled = true;
                    this.dirty();
                }
            }
        },
        /**
         * Enable all textures used in the shader
         */
        enableTexturesAll : function() {
            for (var symbol in this._textureStatus) {
                this._textureStatus[symbol].enabled = true;
            }

            this.dirty();
        },
        /**
         * Disable a texture, it remove a #define micro in the shader
         * @param  {string} symbol
         */
        disableTexture : function(symbol) {
            var status = this._textureStatus[symbol];
            if (status) {
                var isDisabled = ! status.enabled;
                if (!isDisabled) {
                    status.enabled = false;
                    this.dirty();
                }
            }
        },
        /**
         * Disable all textures used in the shader
         */
        disableTexturesAll : function() {
            for (var symbol in this._textureStatus) {
                this._textureStatus[symbol].enabled = false;
            }

            this.dirty();
        },
        /**
         * @param  {string}  symbol
         * @return {boolean}
         */
        isTextureEnabled : function(symbol) {
            return this._textureStatus[symbol].enabled;
        },

        hasUniform : function(symbol) {
            var location = this._currentLocationsMap[symbol];
            return location !== null && location !== undefined;
        },

        setUniform : function(_gl, type, symbol, value) {
            var locationMap = this._currentLocationsMap;
            var location = locationMap[symbol];
            // Uniform is not existed in the shader
            if (location === null || location === undefined) {
                return false;
            }
            switch (type) {
                case 'm4':
                    // The matrix must be created by glmatrix and can pass it directly.
                    _gl.uniformMatrix4fv(location, false, value);
                    break;
                case '2i':
                    _gl.uniform2i(location, value[0], value[1]);
                    break;
                case '2f':
                    _gl.uniform2f(location, value[0], value[1]);
                    break;
                case '3i':
                    _gl.uniform3i(location, value[0], value[1], value[2]);
                    break;
                case '3f':
                    _gl.uniform3f(location, value[0], value[1], value[2]);
                    break;
                case '4i':
                    _gl.uniform4i(location, value[0], value[1], value[2], value[3]);
                    break;
                case '4f':
                    _gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                    break;
                case '1i':
                    _gl.uniform1i(location, value);
                    break;
                case '1f':
                    _gl.uniform1f(location, value);
                    break;
                case "1fv":
                    _gl.uniform1fv(location, value);
                    break;
                case "1iv":
                    _gl.uniform1iv(location, value);
                    break;
                case '2iv':
                    _gl.uniform2iv(location, value);
                    break;
                case '2fv':
                    _gl.uniform2fv(location, value);
                    break;
                case '3iv':
                    _gl.uniform3iv(location, value);
                    break;
                case '3fv':
                    _gl.uniform3fv(location, value);
                    break;
                case "4iv":
                    _gl.uniform4iv(location, value);
                    break;
                case "4fv":
                    _gl.uniform4fv(location, value);
                    break;
                case 'm2':
                case "m2v":
                    _gl.uniformMatrix2fv(location, false, value);
                    break;
                case 'm3':
                case "m3v":
                    _gl.uniformMatrix3fv(location, false, value);
                    break;
                case 'm4v':
                    if (value instanceof Array) {
                        var array = new Float32Array(value.length * 16);
                        var cursor = 0;
                        for (var i = 0; i < value.length; i++) {
                            var item = value[i];
                            for (var j = 0; j < 16; j++) {
                                array[cursor++] = item[j];
                            }
                        }
                        _gl.uniformMatrix4fv(location, false, array);
                    // Raw value
                    } else if (value instanceof Float32Array) {   // ArrayBufferView
                        _gl.uniformMatrix4fv(location, false, value);
                    }
                    break;
            }
            return true
        },

        setUniformBySemantic : function(_gl, semantic, val) {
            var semanticInfo = this.attribSemantics[semantic];
            if (semanticInfo) {
                return this.setUniform(_gl, semanticInfo.type, semanticInfo.symbol, val);
            }
            return false;
        },

        // Enable the attributes passed in and disable the rest
        // Example Usage:
        // enableAttributes(_gl, ["position", "texcoords"])
        enableAttributes : function(_gl, attribList) {
            
            var program = this._cache.get("program");

            var locationMap = this._cache.get("attriblocations");

            var enabledAttributeListInContext = enabledAttributeList[_gl.__GLID__];
            if (! enabledAttributeListInContext) {
                enabledAttributeListInContext
                    = enabledAttributeList[_gl.__GLID__] 
                    = [];
            }
            var locationList = [];
            for (var i = 0; i < attribList.length; i++) {
                var symbol = attribList[i];
                if (!this.attributeTemplates[symbol]) {
                    locationList[i] = -1;
                    continue;
                }
                var location = locationMap[symbol];
                if (location === undefined) {
                    location = _gl.getAttribLocation(program, symbol);
                    // Attrib location is a number from 0 to ...
                    if (location === -1) {
                        locationList[i] = -1;
                        continue;
                    }
                    locationMap[symbol] = location;
                }
                locationList[i] = location;

                if (!enabledAttributeListInContext[location]) {
                    enabledAttributeListInContext[location] = SHADER_STATE_TO_ENABLE;
                } else {
                    enabledAttributeListInContext[location] = SHADER_STATE_KEEP_ENABLE;
                }
            }

            for (var i = 0; i < enabledAttributeListInContext.length; i++) {
                switch(enabledAttributeListInContext[i]){
                    case SHADER_STATE_TO_ENABLE:
                        _gl.enableVertexAttribArray(i);
                        enabledAttributeListInContext[i] = SHADER_STATE_PENDING;
                        break;
                    case SHADER_STATE_KEEP_ENABLE:
                        enabledAttributeListInContext[i] = SHADER_STATE_PENDING;
                        break;
                    // Expired
                    case SHADER_STATE_PENDING:
                        _gl.disableVertexAttribArray(i);
                        enabledAttributeListInContext[i] = 0;
                        break;
                }
            }

            return locationList;
        },

        _parseImport : function() {

            this._vertexProcessedWithoutDefine = Shader.parseImport(this.vertex);
            this._fragmentProcessedWithoutDefine = Shader.parseImport(this.fragment);

        },

        _addDefine : function() {

            // Add defines
            // VERTEX
            var defineStr = [];
            for (var lightType in this.lightNumber) {
                var count = this.lightNumber[lightType];
                if (count > 0) {
                    defineStr.push("#define "+lightType.toUpperCase()+"_NUMBER "+count);
                }
            }
            for (var symbol in this._textureStatus) {
                var status = this._textureStatus[symbol];
                if (status.enabled) {
                    defineStr.push("#define "+symbol.toUpperCase()+"_ENABLED");
                }
            }
            // Custom Defines
            for (var symbol in this.vertexDefines) {
                var value = this.vertexDefines[symbol];
                if (value === null) {
                    defineStr.push("#define "+symbol);
                }else{
                    defineStr.push("#define "+symbol+" "+value.toString());
                }
            }
            this._vertexProcessed = defineStr.join("\n") + "\n" + this._vertexProcessedWithoutDefine;

            // FRAGMENT
            defineStr = [];
            for (var lightType in this.lightNumber) {
                var count = this.lightNumber[lightType];
                if (count > 0) {
                    defineStr.push("#define "+lightType.toUpperCase()+"_NUMBER "+count);
                }
            }
            for (var symbol in this._textureStatus) {
                var status = this._textureStatus[symbol];
                if (status.enabled) {
                    defineStr.push("#define "+symbol.toUpperCase()+"_ENABLED");
                }
            }
            // Custom Defines
            for (var symbol in this.fragmentDefines) {
                var value = this.fragmentDefines[symbol];
                if (value === null) {
                    defineStr.push("#define "+symbol);
                }else{
                    defineStr.push("#define "+symbol+" "+value.toString());
                }
            }
            var tmp = defineStr.join("\n") + "\n" + this._fragmentProcessedWithoutDefine;
            
            // Add precision
            this._fragmentProcessed = ['precision', this.precision, 'float'].join(' ')+';\n' + tmp;
        },

        _parseUniforms : function() {
            var uniforms = {};
            var self = this;
            var shaderType = "vertex";
            this._uniformList = [];

            this._vertexProcessedWithoutDefine = this._vertexProcessedWithoutDefine.replace(uniformRegex, _uniformParser);
            shaderType = "fragment";
            this._fragmentProcessedWithoutDefine = this._fragmentProcessedWithoutDefine.replace(uniformRegex, _uniformParser);

            self.matrixSemanticKeys = Object.keys(this.matrixSemantics);

            function _uniformParser(str, type, symbol, isArray, semanticWrapper, semantic) {
                if (type && symbol) {
                    var uniformType = uniformTypeMap[type];
                    var isConfigurable = true;
                    if (uniformType) {
                        self._uniformList.push(symbol);
                        if (type === "sampler2D" || type === "samplerCube") {
                            // Texture is default disabled
                            self._textureStatus[symbol] = {
                                enabled : false,
                                shaderType : shaderType
                            };
                        }
                        if (isArray) {
                            uniformType += 'v';
                        }
                        if (semantic) {
                            // This case is only for SKIN_MATRIX
                            // TODO
                            if (attribSemantics.indexOf(semantic) >= 0) {
                                self.attribSemantics[semantic] = {
                                    symbol : symbol,
                                    type : uniformType
                                }
                                isConfigurable = false;
                            }
                            else if (matrixSemantics.indexOf(semantic) >= 0) {
                                var isTranspose = false;
                                var semanticNoTranspose = semantic;
                                if (semantic.match(/TRANSPOSE$/)) {
                                    isTranspose = true;
                                    semanticNoTranspose = semantic.slice(0, -9)
                                }
                                self.matrixSemantics[semantic] = {
                                    symbol : symbol,
                                    type : uniformType,
                                    isTranspose : isTranspose,
                                    semanticNoTranspose : semanticNoTranspose
                                }
                                isConfigurable = false;
                            }
                            else {
                                // The uniform is not configurable, which means it will not appear
                                // in the material uniform properties
                                if (semantic === "unconfigurable") {
                                    isConfigurable = false;
                                }else{
                                    var defaultValueFunc = self._parseDefaultValue(type, semantic);
                                    if (! defaultValueFunc)
                                        throw new Error('Unkown semantic "' + semantic + '"');
                                    else
                                        semantic = "";
                                }
                            }
                        }
                        if (isConfigurable) {
                            uniforms[symbol] = {
                                type : uniformType,
                                value : isArray ? uniformValueConstructor['array'] : (defaultValueFunc || uniformValueConstructor[type]),
                                semantic : semantic || null
                            }
                        }
                    }
                    return ["uniform", type, symbol, isArray].join(" ")+";\n";
                }
            }

            this.uniformTemplates = uniforms;
        },

        _parseDefaultValue : function(type, str) {
            var arrayRegex = /\[\s*(.*)\s*\]/
            if (type === "vec2" ||
                type === "vec3" ||
                type === "vec4") {
                var arrayStr = arrayRegex.exec(str)[1];
                if (arrayStr) {
                    var arr = arrayStr.split(/\s*,\s*/);
                    return function() {
                        return new Float32Array(arr);
                    }
                }else{
                    // Invalid value
                    return;
                }
            }
            else if (type === "bool") {
                return function() {
                    return str.toLowerCase() === "true" ? true : false;
                }
            }
            else if (type === "float") {
                return function() {
                    return parseFloat(str);
                }
            }
        },

        // Create a new uniform instance for material
        createUniforms : function() {
            var uniforms = {};
            
            for (var symbol in this.uniformTemplates){
                var uniformTpl = this.uniformTemplates[symbol];
                uniforms[symbol] = {
                    type : uniformTpl.type,
                    value : uniformTpl.value()
                }
            }
            return uniforms;
        },

        _parseAttributes : function() {
            var attributes = {};
            var self = this;
            this._vertexProcessedWithoutDefine = this._vertexProcessedWithoutDefine.replace(attributeRegex, _attributeParser);

            function _attributeParser(str, type, symbol, semanticWrapper, semantic) {
                if (type && symbol) {
                    var size = 1;
                    switch (type) {
                        case "vec4":
                            size = 4;
                            break;
                        case "vec3":
                            size = 3;
                            break;
                        case "vec2":
                            size = 2;
                            break;
                        case "float":
                            size = 1;
                            break;
                    }

                    attributes[symbol] = {
                        // Force float
                        type : "float",
                        size : size,
                        semantic : semantic || null
                    }

                    if (semantic) {
                        if (attribSemantics.indexOf(semantic) < 0) {
                            throw new Error('Unkown semantic "' + semantic + '"');
                        }else{
                            self.attribSemantics[semantic] = {
                                symbol : symbol,
                                type : type
                            }
                        }
                    }
                }

                return ["attribute", type, symbol].join(" ")+";\n";
            }

            this.attributeTemplates = attributes;
        },

        _parseDefines : function() {
            var self = this;
            var shaderType = 'vertex';
            this._vertexProcessedWithoutDefine = this._vertexProcessedWithoutDefine.replace(defineRegex, _defineParser);
            shaderType = 'fragment';
            this._fragmentProcessedWithoutDefine = this._fragmentProcessedWithoutDefine.replace(defineRegex, _defineParser);

            function _defineParser(str, symbol, value) {
                var defines = shaderType === 'vertex' ? self.vertexDefines : self.fragmentDefines;
                if (!defines[symbol]) { // Haven't been defined by user
                    if (value == 'false') {
                        defines[symbol] = false
                    } else if (value == 'true') {
                        defines[symbol] = true;
                    } else {
                        defines[symbol] = value ? parseFloat(value) : null;
                    }
                }
                return '';
            }
        },
        // Return true or error msg if error happened
        _buildProgram : function(_gl, vertexShaderString, fragmentShaderString) {

            if (this._cache.get("program")) {
                _gl.deleteProgram(this._cache.get("program"));
            }
            var program = _gl.createProgram();

            var vertexShader = _gl.createShader(_gl.VERTEX_SHADER);
            _gl.shaderSource(vertexShader, vertexShaderString);
            _gl.compileShader(vertexShader);

            var fragmentShader = _gl.createShader(_gl.FRAGMENT_SHADER);
            _gl.shaderSource(fragmentShader, fragmentShaderString);
            _gl.compileShader(fragmentShader);

            var msg = this._checkShaderErrorMsg(_gl, vertexShader, vertexShaderString);
            if (msg) {
                return msg;
            }
            msg = this._checkShaderErrorMsg(_gl, fragmentShader, fragmentShaderString);
            if (msg) {
                return msg;
            }

            _gl.attachShader(program, vertexShader);
            _gl.attachShader(program, fragmentShader);
            // Force the position bind to index 0;
            if (this.attribSemantics['POSITION']) {
                _gl.bindAttribLocation(program, 0, this.attribSemantics['POSITION'].symbol);
            }
            _gl.linkProgram(program);

            if (!_gl.getProgramParameter(program, _gl.LINK_STATUS)) {
                return "Could not link program\n" + "VALIDATE_STATUS: " + _gl.getProgramParameter(program, _gl.VALIDATE_STATUS) + ", gl error [" + _gl.getError() + "]";
            }

            // Cache uniform locations
            for (var i = 0; i < this._uniformList.length; i++) {
                var uniformSymbol = this._uniformList[i];
                var locationMap = this._cache.get("locations");
                locationMap[uniformSymbol] = _gl.getUniformLocation(program, uniformSymbol);
            }

            _gl.deleteShader(vertexShader);
            _gl.deleteShader(fragmentShader);

            this._cache.put("program", program);
        },

        // Return true or error msg if error happened
        _checkShaderErrorMsg : function(_gl, shader, shaderString) {
            if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {
                return [_gl.getShaderInfoLog(shader), addLineNumbers(shaderString)].join("\n");
            }
        },

        /**
         * Clone a new shader
         * @return {qtek.Shader}
         */
        clone : function() {
            var shader = new Shader({
                vertex : this.vertex,
                fragment : this.fragment,
                vertexDefines : util.clone(this.vertexDefines),
                fragmentDefines : util.clone(this.fragmentDefines)
            });
            for (var name in this._textureStatus) {
                shader._textureStatus[name] = util.clone(this._textureStatus[name]);
            }
            return shader;
        },
        /**
         * @param  {WebGLRenderingContext} _gl
         */
        dispose : function(_gl) {
            this._cache.use(_gl.__GLID__);
            if (program) {
                var program = this._cache.get('program');
            }
            _gl.deleteProgram(program);
            this._cache.deleteContext(_gl.__GLID__);
            this._locations = {};
        }
    });
    
    function getCacheSchema() {
        return {
            "locations" : {},
            "attriblocations" : {}
        }
    }

    // some util functions
    function addLineNumbers(string) {
        var chunks = string.split("\n");
        for (var i = 0, il = chunks.length; i < il; i ++) {
            // Chrome reports shader errors on lines
            // starting counting from 1
            chunks[i] = (i + 1) + ": " + chunks[i];
        }
        return chunks.join("\n");
    }

    var importRegex = /(@import)\s*([0-9a-zA-Z_\-\.]*)/g;
    Shader.parseImport = function(shaderStr) {
        shaderStr = shaderStr.replace(importRegex, function(str, importSymbol, importName) {
            var str = Shader.source(importName);
            if (str) {
                // Recursively parse
                return Shader.parseImport(str);
            } else {
                console.warn('Shader chunk "' + importName + '" not existed in library');
                return '';
            }
        })
        return shaderStr;
    }

    var exportRegex = /(@export)\s*([0-9a-zA-Z_\-\.]*)\s*\n([\s\S]*?)@end/g;

    /**
     * Import shader source
     * @param  {string} shaderStr
     * @memberOf qtek.Shader
     */
    Shader['import'] = function(shaderStr) {
        shaderStr.replace(exportRegex, function(str, exportSymbol, exportName, code) {
            var code = code.replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+\x24)/g, '');
            if (code) {
                var parts = exportName.split('.');
                var obj = Shader.codes;
                var i = 0;
                while(i < parts.length - 1) {
                    var key = parts[i++];
                    if (!obj[key]) {
                        obj[key] = {};
                    }
                    obj = obj[key];
                }
                key = parts[i];
                obj[key] = code;
            }
            return code;
        })
    }

    /**
     * Library to store all the loaded shader codes
     * @type {Object}
     * @readOnly
     * @memberOf qtek.Shader
     */
    Shader.codes = {};

    /**
     * Get shader source
     * @param  {string} name
     * @return {string}
     * @memberOf qtek.Shader
     */
    Shader.source = function(name) {
        var parts = name.split('.');
        var obj = Shader.codes;
        var i = 0;
        while(obj && i < parts.length) {
            var key = parts[i++];
            obj = obj[key];
        }
        if (! obj) {
            console.warn('Shader "' + name + '" not existed in library');
            return;
        }
        return obj;
    }

    return Shader;
});

define('qtek/light/light.essl',[],function () { return '@export buildin.header.directional_light\nuniform vec3 directionalLightDirection[ DIRECTIONAL_LIGHT_NUMBER ] : unconfigurable;\nuniform vec3 directionalLightColor[ DIRECTIONAL_LIGHT_NUMBER ] : unconfigurable;\n@end\n\n@export buildin.header.ambient_light\nuniform vec3 ambientLightColor[ AMBIENT_LIGHT_NUMBER ] : unconfigurable;\n@end\n\n@export buildin.header.point_light\nuniform vec3 pointLightPosition[ POINT_LIGHT_NUMBER ] : unconfigurable;\nuniform float pointLightRange[ POINT_LIGHT_NUMBER ] : unconfigurable;\nuniform vec3 pointLightColor[ POINT_LIGHT_NUMBER ] : unconfigurable;\n@end\n\n@export buildin.header.spot_light\nuniform vec3 spotLightPosition[SPOT_LIGHT_NUMBER] : unconfigurable;\nuniform vec3 spotLightDirection[SPOT_LIGHT_NUMBER] : unconfigurable;\nuniform float spotLightRange[SPOT_LIGHT_NUMBER] : unconfigurable;\nuniform float spotLightUmbraAngleCosine[SPOT_LIGHT_NUMBER] : unconfigurable;\nuniform float spotLightPenumbraAngleCosine[SPOT_LIGHT_NUMBER] : unconfigurable;\nuniform float spotLightFalloffFactor[SPOT_LIGHT_NUMBER] : unconfigurable;\nuniform vec3 spotLightColor[SPOT_LIGHT_NUMBER] : unconfigurable;\n@end';});

define('qtek/Light',['require','./Node','./Shader','./light/light.essl'],function(require){

    var Node = require("./Node");
    var Shader = require("./Shader");

    /**
     * @constructor qtek.Light
     * @extends qtek.Node
     */
    var Light = Node.derive(function(){
        return /** @lends qtek.Light# */ {
            /**
             * Light RGB color
             * @type {number[]}
             */
            color : [1, 1, 1],

            /**
             * Light intensity
             * @type {number}
             */
            intensity : 1.0,
            
            // Config for shadow map
            /**
             * If light cast shadow
             * @type {boolean}
             */
            castShadow : true,

            /**
             * Shadow map size
             * @type {number}
             */
            shadowResolution : 512
        }
    }, {
        /**
         * Light type
         * @type {string}
         * @memberOf qtek.Light#
         */
        type: '',

        /**
         * @return {qtek.Light}
         * @memberOf qtek.Light.prototype
         */
        clone: function() {
            var light = Node.prototype.clone.call(this);
            light.color = Array.prototype.slice.call(this.color);
            light.intensity = this.intensity;
            light.castShadow = this.castShadow;
            light.shadowResolution = this.shadowResolution;

            return light;
        }
    });

    Shader['import'](require('./light/light.essl'));

    return Light;
});
define('qtek/Geometry',['require','./core/Base','./core/util','./core/glenum','./core/Cache'],function(require) {
    
    'use strict'

    var Base = require("./core/Base");
    var util = require("./core/util");
    var glenum = require("./core/glenum");
    var Cache = require("./core/Cache");

    // PENDING put the buffer data in attribute ? 
    function Attribute(name, type, size, semantic, isDynamic) {
        this.name = name;
        this.type = type;
        this.size = size;
        if (semantic) {
            this.semantic = semantic;
        }
        if (isDynamic) {
            this._isDynamic = true;
            this.value = [];
        } else {
            this._isDynamic = false;
            this.value = null
        }
    }

    Attribute.prototype.init = function(nVertex) {
        if (!this._isDynamic) {
            if (!this.value || this.value.length != nVertex * this.size) {
                var ArrayConstructor;
                switch(this.type) {
                    case "byte":
                        ArrayConstructor = Int8Array;
                        break;
                    case "ubyte":
                        ArrayConstructor = Uint8Array;
                        break;
                    case "short":
                        ArrayConstructor = Int16Array;
                        break;
                    case "ushort":
                        ArrayConstructor = Uint16Array;
                        break;
                    default:
                        ArrayConstructor = Float32Array;
                        break;
                }
                this.value = new ArrayConstructor(nVertex * this.size);
            }
        } else {
            console.warn('Dynamic geometry not support init method');
        }
    }

    Attribute.prototype.clone = function(copyValue) {
        var ret = new Attribute(this.name, this.type, this.size, this.semantic, this._isDynamic);
        if (copyValue) {
            console.warn('todo');
        }

        return ret;
    }

    function AttributeBuffer(name, type, buffer, size, semantic) {
        this.name = name;
        this.type = type;
        this.buffer = buffer;
        this.size = size;
        this.semantic = semantic;

        // To be set in mesh
        // symbol in the shader
        this.symbol = '';
    }

    function IndicesBuffer(buffer, count) {
        this.buffer = buffer;
        this.count = count;
    }

    function notImplementedWarn() {
        console.warn('Geometry doesn\'t implement this method, use DynamicGeometry or StaticGeometry instead');
    }

    /**
     * @constructor qtek.Geometry
     * @extends qtek.core.Base
     */
    var Geometry = Base.derive(
    /** @lends qtek.Geometry# */
    {
        /**
         * @type {qtek.math.BoundingBox}
         */
        boundingBox : null,
        
        /**
         * Vertex attributes
         * @type {Object}
         */
        attributes : {},

        faces : null,

        /**
         * @type {boolean}
         */
        useFace : true,

        //Max Value of Uint16, i.e. 0xffff
        chunkSize : 65535
        
    }, function() {
        // Use cache
        this._cache = new Cache();

        this._attributeList = Object.keys(this.attributes);
    },
    /** @lends qtek.Geometry.prototype */
    {
        /**
         * Mark attributes in geometry is dirty
         * @method
         */
        dirty : notImplementedWarn,
        /**
         * Create a new attribute
         * @method
         * @param {string} name
         * @param {string} type
         * @param {number} size
         * @param {string} [semantic]
         */
        createAttribute: notImplementedWarn,
        /**
         * Remove attribute
         * @method
         * @param {string} name
         */
        removeAttribute: notImplementedWarn,
        /**
         * @method
         * @return {number}
         */
        getVertexNumber : notImplementedWarn,
        /**
         * @method
         * @return {number}
         */
        getFaceNumber : notImplementedWarn,
        /**
         * @method
         * @return {boolean}
         */
        isUseFace : notImplementedWarn,
        /**
         * @method
         * @return {boolean}
         */
        isStatic : notImplementedWarn,

        getEnabledAttributes : notImplementedWarn,
        getBufferChunks : notImplementedWarn,

        /**
         * @method
         */
        generateVertexNormals : notImplementedWarn,
        /**
         * @method
         */
        generateFaceNormals : notImplementedWarn,
        /**
         * @method
         * @return {boolean}
         */
        isUniqueVertex : notImplementedWarn,
        /**
         * @method
         */
        generateUniqueVertex : notImplementedWarn,
        /**
         * @method
         */
        generateTangents : notImplementedWarn,
        /**
         * @method
         */
        generateBarycentric : notImplementedWarn,
        /**
         * @method
         * @param {qtek.math.Matrix4} matrix
         */
        applyTransform : notImplementedWarn,
        /**
         * @method
         * @param {WebGLRenderingContext} gl
         */
        dispose : notImplementedWarn
    });

    Geometry.STATIC_DRAW = glenum.STATIC_DRAW;
    Geometry.DYNAMIC_DRAW = glenum.DYNAMIC_DRAW;
    Geometry.STREAM_DRAW = glenum.STREAM_DRAW;

    Geometry.AttributeBuffer = AttributeBuffer;
    Geometry.IndicesBuffer = IndicesBuffer;
    Geometry.Attribute = Attribute;

    return Geometry
});
define('qtek/math/BoundingBox',['require','./Vector3','glmatrix'],function(require) {

    var Vector3 = require("./Vector3");
    var glMatrix = require('glmatrix');
    var mat4 = glMatrix.mat4;
    var vec3 = glMatrix.vec3;

    var vec3TransformMat4 = vec3.transformMat4;
    var vec3Copy = vec3.copy;
    var vec3Set = vec3.set;

    /**
     * Axis aligned bounding box
     * @constructor
     * @alias qtek.math.BoundingBox
     * @param {qtek.math.Vector3} [min]
     * @param {qtek.math.Vector3} [max]
     */
    var BoundingBox = function(min, max) {

        /**
         * Minimum coords of bounding box
         * @type {qtek.math.Vector3}
         */
        this.min = min || new Vector3(Infinity, Infinity, Infinity);

        /**
         * Maximum coords of bounding box
         * @type {qtek.math.Vector3}
         */
        this.max = max || new Vector3(-Infinity, -Infinity, -Infinity);

        // Cube vertices
        var vertices = [];
        for (var i = 0; i < 8; i++) {
            vertices[i] = vec3.fromValues(0, 0, 0);
        }

        /**
         * Eight coords of bounding box
         * @type {Float32Array[]}
         */
        this.vertices = vertices;
    }

    BoundingBox.prototype = {
        
        constructor : BoundingBox,
        /**
         * Update min and max coords from a vertices array
         * @param  {array} vertices
         */
        updateFromVertices : function(vertices) {
            if (vertices.length > 0) {
                var _min = this.min._array;
                var _max = this.max._array;
                vec3Copy(_min, vertices[0]);
                vec3Copy(_max, vertices[0]);
                for (var i = 1; i < vertices.length; i++) {
                    var vertex = vertices[i];

                    _min[0] = Math.min(vertex[0], _min[0]);
                    _min[1] = Math.min(vertex[1], _min[1]);
                    _min[2] = Math.min(vertex[2], _min[2]);

                    _max[0] = Math.max(vertex[0], _max[0]);
                    _max[1] = Math.max(vertex[1], _max[1]);
                    _max[2] = Math.max(vertex[2], _max[2]);
                }
                this.min._dirty = true;
                this.max._dirty = true;
            }
        },

        /**
         * Union operation with another bounding box
         * @param  {qtek.math.BoundingBox} bbox
         */
        union : function(bbox) {
            vec3.min(this.min._array, this.min._array, bbox.min._array);
            vec3.max(this.max._array, this.max._array, bbox.max._array);
            this.min._dirty = true;
            this.max._dirty = true;
        },

        /**
         * If intersect with another bounding box
         * @param  {qtek.math.BoundingBox} bbox
         * @return {boolean}
         */
        intersectBoundingBox : function(bbox) {
            var _min = this.min._array;
            var _max = this.max._array;

            var _min2 = bbox.min._array;
            var _max2 = bbox.max._array;

            return ! (_min[0] > _max2[0] || _min[1] > _max2[1] || _min[2] > _max2[1]
                || _max[0] < _min2[0] || _max[1] < _min2[1] || _max[2] < _min2[2]);
        },

        /**
         * Apply an affine transform matrix to the bounding box 
         * @param  {qtek.math.Matrix4} matrix
         */
        applyTransform : function(matrix) {
            if (this.min._dirty || this.max._dirty) {
                this.updateVertices();
                this.min._dirty = false;
                this.max._dirty = false;
            }

            var m4 = matrix._array;
            var _min = this.min._array;
            var _max = this.max._array;
            var vertices = this.vertices;

            var v = vertices[0];
            vec3TransformMat4(v, v, m4);
            vec3Copy(_min, v);
            vec3Copy(_max, v);

            for (var i = 1; i < 8; i++) {
                v = vertices[i];
                vec3TransformMat4(v, v, m4);

                _min[0] = Math.min(v[0], _min[0]);
                _min[1] = Math.min(v[1], _min[1]);
                _min[2] = Math.min(v[2], _min[2]);

                _max[0] = Math.max(v[0], _max[0]);
                _max[1] = Math.max(v[1], _max[1]);
                _max[2] = Math.max(v[2], _max[2]);
            }

            this.min._dirty = true;
            this.max._dirty = true;
        },

        /**
         * Apply a projection matrix to the bounding box
         * @param  {qtek.math.Matrix4} matrix
         */
        applyProjection : function(matrix) {
            if (this.min._dirty || this.max._dirty) {
                this.updateVertices();
                this.min._dirty = false;
                this.max._dirty = false;
            }

            var m = matrix._array;
            // min in min z
            var v1 = this.vertices[0];
            // max in min z
            var v2 = this.vertices[3];
            // max in max z
            var v3 = this.vertices[7];

            var _min = this.min._array;
            var _max = this.max._array;

            if (m[15] === 1) {  // Orthographic projection
                _min[0] = m[0] * v1[0] + m[12];
                _min[1] = m[5] * v1[1] + m[13];
                _max[2] = m[10] * v1[2] + m[14];

                _max[0] = m[0] * v3[0] + m[12];
                _max[1] = m[5] * v3[1] + m[13];
                _min[2] = m[10] * v3[2] + m[14];
            } else {
                var w = -1 / v1[2];
                _min[0] = m[0] * v1[0] * w;
                _min[1] = m[5] * v1[1] * w;
                _max[2] = (m[10] * v1[2] + m[14]) * w;

                w = -1 / v2[2];
                _max[0] = m[0] * v2[0] * w;
                _max[1] = m[5] * v2[1] * w;

                w = -1 / v3[2];
                _min[2] = (m[10] * v3[2] + m[14]) * w;
            }
            this.min._dirty = true;
            this.max._dirty = true;
        },

        updateVertices : function() {
            var min = this.min._array;
            var max = this.max._array;
            var vertices = this.vertices;
            //--- min z
            // min x
            vec3Set(vertices[0], min[0], min[1], min[2]);
            vec3Set(vertices[1], min[0], max[1], min[2]);
            // max x
            vec3Set(vertices[2], max[0], min[1], min[2]);
            vec3Set(vertices[3], max[0], max[1], min[2]);

            //-- max z
            vec3Set(vertices[4], min[0], min[1], max[2]);
            vec3Set(vertices[5], min[0], max[1], max[2]);
            vec3Set(vertices[6], max[0], min[1], max[2]);
            vec3Set(vertices[7], max[0], max[1], max[2]);
        },
        /**
         * Copy values from another bounding box
         * @param  {qtek.math.BoundingBox} bbox
         */
        copy : function(bbox) {
            vec3Copy(this.min._array, bbox.min._array);
            vec3Copy(this.max._array, bbox.max._array);
            this.min._dirty = true;
            this.max._dirty = true;
        },

        /**
         * Clone a new bounding box
         * @return {qtek.math.BoundingBox}
         */
        clone : function() {
            var boundingBox = new BoundingBox();
            boundingBox.copy(this);
            return boundingBox;
        }
    };

    return BoundingBox;
});
/**
 * StaticGeometry can not be changed once they've been setup
 */
define('qtek/StaticGeometry',['require','./Geometry','./core/util','./math/BoundingBox','glmatrix','./core/glenum'],function(require) {

    

    var Geometry = require("./Geometry");
    var util = require("./core/util");
    var BoundingBox = require("./math/BoundingBox");
    var glMatrix = require("glmatrix");
    var glenum = require("./core/glenum");
    var mat4 = glMatrix.mat4;
    var vec3 = glMatrix.vec3;

    /**
     * @constructor qtek.StaticGeometry
     * @extends qtek.Geometry
     */
    var StaticGeometry = Geometry.derive(function() {
        return /** @lends qtek.StaticGeometry# */ {
            attributes : {
                 position : new Geometry.Attribute('position', 'float', 3, 'POSITION', false),
                 texcoord0 : new Geometry.Attribute('texcoord0', 'float', 2, 'TEXCOORD_0', false),
                 texcoord1 : new Geometry.Attribute('texcoord1', 'float', 2, 'TEXCOORD_1', false),
                 normal : new Geometry.Attribute('normal', 'float', 3, 'NORMAL', false),
                 tangent : new Geometry.Attribute('tangent', 'float', 4, 'TANGENT', false),
                 color : new Geometry.Attribute('color', 'float', 4, 'COLOR', false),
                 // Skinning attributes
                 // Each vertex can be bind to 4 bones, because the 
                 // sum of weights is 1, so the weights is stored in vec3 and the last
                 // can be calculated by 1-w.x-w.y-w.z
                 weight : new Geometry.Attribute('weight', 'float', 3, 'WEIGHT', false),
                 joint : new Geometry.Attribute('joint', 'float', 4, 'JOINT', false),
                 // For wireframe display
                 // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
                 barycentric : new Geometry.Attribute('barycentric', 'float', 3, null, false),
            },

            hint : glenum.STATIC_DRAW,

            /**
             * @type {Uint16Array}
             */
            faces: null,

            _normalType : 'vertex',

            _enabledAttributes : null
        }
    }, 

    /** @lends qtek.StaticGeometry.prototype */
    {
        dirty : function() {
            this._cache.dirtyAll();
            this._enabledAttributes = null;
        },
        
        getVertexNumber : function() {
            if (!this.attributes.position.value) {
                return 0;
            }
            return this.attributes.position.value.length / 3;
        },

        getFaceNumber : function() {
            return this.faces.length / 3;
        },
        
        isUseFace : function() {
            return this.useFace && (this.faces != null);
        },

        isStatic : function() {
            return true;
        },

        createAttribute: function(name, type, size, semantic) {
            var attrib = new Geometry.Attribute(name, type, size, semantic, false);
            this.attributes[name] = attrib;
            this._attributeList.push(name);
            return attrib;
        },

        removeAttribute: function(name) {
            var idx = this._attributeList.indexOf(name);
            if (idx >= 0) {
                this._attributeList.splice(idx, 1);
                delete this.attributes[name];
                return true;
            }
            return false;
        },

        /**
         * Get enabled attributes name list
         * Attribute which has the same vertex number with position is treated as a enabled attribute
         * @return {string[]}
         */
        getEnabledAttributes : function() {
            // Cache
            if (this._enabledAttributes) {
                return this._enabledAttributes;
            }

            var result = [];
            var nVertex = this.getVertexNumber();

            for (var i = 0; i < this._attributeList.length; i++) {
                var name = this._attributeList[i];
                var attrib = this.attributes[name];
                if (attrib.value) {
                    if (attrib.value.length === nVertex * attrib.size) {
                        result.push(name);
                    }
                }
            }

            this._enabledAttributes = result;

            return result;
        },

        getBufferChunks : function(_gl) {
            this._cache.use(_gl.__GLID__);
            if (this._cache.isDirty()) {
                this._updateBuffer(_gl);
                this._cache.fresh();
            }
            return this._cache.get("chunks");
        },
        
        _updateBuffer : function(_gl) {
            var chunks = this._cache.get("chunks");
            var firstUpdate = false;
            if (! chunks) {
                chunks = [];
                // Intialize
                chunks[0] = {
                    attributeBuffers : [],
                    indicesBuffer : null
                }
                this._cache.put("chunks", chunks);
                firstUpdate = true;
            }
            var chunk = chunks[0];
            var attributeBuffers = chunk.attributeBuffers;
            var indicesBuffer = chunk.indicesBuffer;

            var attributeList = this.getEnabledAttributes();
            var prevSearchIdx = 0;
            var count = 0;
            for (var k = 0; k < attributeList.length; k++) {
                var name = attributeList[k];
                var attribute = this.attributes[name];

                var bufferInfo;

                if (!firstUpdate) {
                    // Search for created buffer
                    for (var i = prevSearchIdx; i < attributeBuffers.length; i++) {
                        if (attributeBuffers[i].name === name) {
                            bufferInfo = attributeBuffers[i];
                            prevSearchIdx = i + 1;
                            break;
                        }
                    }
                    if (!bufferInfo) {
                        for (var i = prevSearchIdx - 1; i >= 0; i--) {
                            if (attributeBuffers[i].name === name) {
                                bufferInfo = attributeBuffers[i];
                                prevSearchIdx = i;
                                break;
                            }
                        }
                    }
                }
                var buffer;
                if (bufferInfo) {
                    buffer = bufferInfo.buffer;
                } else {
                    buffer = _gl.createBuffer();
                }
                //TODO: Use BufferSubData?
                _gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
                _gl.bufferData(_gl.ARRAY_BUFFER, attribute.value, this.hint);

                attributeBuffers[count++] = new Geometry.AttributeBuffer(name, attribute.type, buffer, attribute.size, attribute.semantic);
            }
            attributeBuffers.length = count;

            if (! indicesBuffer && this.isUseFace()) {
                indicesBuffer = new Geometry.IndicesBuffer(_gl.createBuffer(), this.faces.length);
                chunk.indicesBuffer = indicesBuffer;
                _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, indicesBuffer.buffer);
                _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, this.faces, this.hint);
            }
        },

        generateVertexNormals : function() {
            var faces = this.faces;
            var positions = this.attributes.position.value;
            var normals = this.attributes.normal.value;

            if (!normals || normals.length !== positions.length) {
                normals = this.attributes.normal.value = new Float32Array(positions.length);
            } else {
                // Reset
                for (var i = 0; i < normals.length; i++) {
                    normals[i] = 0;
                }
            }

            var p1 = vec3.create();
            var p2 = vec3.create();
            var p3 = vec3.create();

            var v21 = vec3.create();
            var v32 = vec3.create();

            var n = vec3.create();

            for (var f = 0; f < faces.length;) {
                var i1 = faces[f++];
                var i2 = faces[f++];
                var i3 = faces[f++];

                vec3.set(p1, positions[i1*3], positions[i1*3+1], positions[i1*3+2]);
                vec3.set(p2, positions[i2*3], positions[i2*3+1], positions[i2*3+2]);
                vec3.set(p3, positions[i3*3], positions[i3*3+1], positions[i3*3+2]);

                vec3.sub(v21, p1, p2);
                vec3.sub(v32, p2, p3);
                vec3.cross(n, v21, v32);
                // Weighted by the triangle area
                for (var i = 0; i < 3; i++) {
                    normals[i1*3+i] = normals[i1*3+i] + n[i];
                    normals[i2*3+i] = normals[i2*3+i] + n[i];
                    normals[i3*3+i] = normals[i3*3+i] + n[i];
                }
            }

            for (var i = 0; i < normals.length;) {
                vec3.set(n, normals[i], normals[i+1], normals[i+2]);
                vec3.normalize(n, n);
                normals[i++] = n[0];
                normals[i++] = n[1];
                normals[i++] = n[2];
            }
        },

        generateFaceNormals : function() {
            if (!this.isUniqueVertex()) {
                this.generateUniqueVertex();
            }

            var faces = this.faces;
            var positions = this.attributes.position.value;
            var normals = this.attributes.normal.value;

            var p1 = vec3.create();
            var p2 = vec3.create();
            var p3 = vec3.create();

            var v21 = vec3.create();
            var v32 = vec3.create();
            var n = vec3.create();

            if (!normals) {
                normals = this.attributes.position.value = new Float32Array(positions.length);
            }
            for (var f = 0; f < faces.length;) {
                var i1 = faces[f++];
                var i2 = faces[f++];
                var i3 = faces[f++];

                vec3.set(p1, positions[i1*3], positions[i1*3+1], positions[i1*3+2]);
                vec3.set(p2, positions[i2*3], positions[i2*3+1], positions[i2*3+2]);
                vec3.set(p3, positions[i3*3], positions[i3*3+1], positions[i3*3+2]);

                vec3.sub(v21, p1, p2);
                vec3.sub(v32, p2, p3);
                vec3.cross(n, v21, v32);

                vec3.normalize(n, n);

                for (var i = 0; i < 3; i++) {
                    normals[i1*3+i] = n[i];
                    normals[i2*3+i] = n[i];
                    normals[i3*3+i] = n[i];
                }
            }
        },

        generateTangents : function() {
            var nVertex = this.getVertexNumber();
            if (!this.attributes.tangent.value) {
                this.attributes.tangent.value = new Float32Array(nVertex * 4);
            }
            var texcoords = this.attributes.texcoord0.value;
            var positions = this.attributes.position.value;
            var tangents = this.attributes.tangent.value;
            var normals = this.attributes.normal.value;

            var tan1 = [];
            var tan2 = [];
            for (var i = 0; i < nVertex; i++) {
                tan1[i] = [0.0, 0.0, 0.0];
                tan2[i] = [0.0, 0.0, 0.0];
            }

            var sdir = [0.0, 0.0, 0.0];
            var tdir = [0.0, 0.0, 0.0];
            for (var i = 0; i < this.faces.length;) {
                var i1 = this.faces[i++],
                    i2 = this.faces[i++],
                    i3 = this.faces[i++],

                    st1s = texcoords[i1 * 2],
                    st2s = texcoords[i2 * 2],
                    st3s = texcoords[i3 * 2],
                    st1t = texcoords[i1 * 2 + 1],
                    st2t = texcoords[i2 * 2 + 1],
                    st3t = texcoords[i3 * 2 + 1],

                    p1x = positions[i1 * 3],
                    p2x = positions[i2 * 3],
                    p3x = positions[i3 * 3],
                    p1y = positions[i1 * 3 + 1],
                    p2y = positions[i2 * 3 + 1],
                    p3y = positions[i3 * 3 + 1],
                    p1z = positions[i1 * 3 + 2],
                    p2z = positions[i2 * 3 + 2],
                    p3z = positions[i3 * 3 + 2];

                var x1 = p2x - p1x,
                    x2 = p3x - p1x,
                    y1 = p2y - p1y,
                    y2 = p3y - p1y,
                    z1 = p2z - p1z,
                    z2 = p3z - p1z;

                var s1 = st2s - st1s,
                    s2 = st3s - st1s,
                    t1 = st2t - st1t,
                    t2 = st3t - st1t;

                var r = 1.0 / (s1 * t2 - t1 * s2);
                sdir[0] = (t2 * x1 - t1 * x2) * r;
                sdir[1] = (t2 * y1 - t1 * y2) * r; 
                sdir[2] = (t2 * z1 - t1 * z2) * r;

                tdir[0] = (s1 * x2 - s2 * x1) * r;
                tdir[1] = (s1 * y2 - s2 * y1) * r;
                tdir[2] = (s1 * z2 - s2 * z1) * r;

                vec3.add(tan1[i1], tan1[i1], sdir);
                vec3.add(tan1[i2], tan1[i2], sdir);
                vec3.add(tan1[i3], tan1[i3], sdir);
                vec3.add(tan2[i1], tan2[i1], tdir);
                vec3.add(tan2[i2], tan2[i2], tdir);
                vec3.add(tan2[i3], tan2[i3], tdir);
            }
            var tmp = vec3.create();
            var nCrossT = vec3.create();
            var n = vec3.create();
            for (var i = 0; i < nVertex; i++) {
                n[0] = normals[i * 3];
                n[1] = normals[i * 3 + 1];
                n[2] = normals[i * 3 + 2];
                var t = tan1[i];

                // Gram-Schmidt orthogonalize
                vec3.scale(tmp, n, vec3.dot(n, t));
                vec3.sub(tmp, t, tmp);
                vec3.normalize(tmp, tmp);
                // Calculate handedness.
                vec3.cross(nCrossT, n, t);
                tangents[i * 4] = tmp[0];
                tangents[i * 4 + 1] = tmp[1];
                tangents[i * 4 + 2] = tmp[2];
                tangents[i * 4 + 3] = vec3.dot(nCrossT, tan2[i]) < 0.0 ? -1.0 : 1.0;;
            }
        },

        isUniqueVertex : function() {
            if (this.isUseFace()) {
                return this.getVertexNumber() === this.faces.length;
            } else {
                return true;
            }
        },

        generateUniqueVertex : function() {
            var vertexUseCount = [];

            for (var i = 0, len = this.getVertexNumber(); i < len; i++) {
                vertexUseCount[i] = 0;
            }

            var cursor = this.getVertexNumber();
            var attributes = this.attributes;
            var faces = this.faces;

            var attributeNameList = this.getEnabledAttributes();

            for (var a = 0; a < attributeNameList.length; a++) {
                var name = attributeNameList[a];
                var expandedArray = new Float32Array(this.faces.length * attributes[name].size);
                var len = attributes[name].value.length;
                for (var i = 0; i < len; i++) {
                    expandedArray[i] = attributes[name].value[i];
                }
                attributes[name].value = expandedArray;
            }

            for (var i = 0; i < faces.length; i++) {
                var ii = faces[i];
                if (vertexUseCount[ii] > 0) {
                    for (var a = 0; a < attributeNameList.length; a++) {
                        var name = attributeNameList[a];
                        var array = attributes[name].value;
                        var size = attributes[name].size;

                        for (var k = 0; k < size; k++) {
                            array[cursor * size + k] = array[ii * size + k];
                        }
                    }
                    faces[i] = cursor;
                    cursor++;
                }
                vertexUseCount[ii]++;
            }
        },

        generateBarycentric : function() {

            if (! this.isUniqueVertex()) {
                this.generateUniqueVertex();
            }

            var array = this.attributes.barycentric.value;
            // Already existed;
            if (array && array.length === this.faces.length * 3) {
                return;
            }
            array = this.attributes.barycentric.value = new Float32Array(this.faces.length * 3);
            var i1, i2, i3, face;
            for (var i = 0; i < this.faces.length;) {
                for (var j = 0; j < 3; j++) {
                    var ii = this.faces[i++];
                    array[ii + j] = 1;
                }
            }
        },

        convertToDynamic : function(geometry) {
            var offset = 0;
            var chunk = this._arrayChunks[c];

            for (var i = 0; i < this.faces.length; i+=3) {
                geometry.faces.push(this.face.subarray(i, i + 3));
            }

            var attributes = this.getEnabledAttributes();
            for (var name in attributes) {
                var attrib = attributes[name];
                var geoAttrib = geometry.attributes[name];
                if (!geoAttrib) {
                    geoAttrib = geometry.attributes[name] = {
                        type : attrib.type,
                        size : attrib.size,
                        value : []
                    }
                    if (attrib.semantic) {
                        geoAttrib.semantic = attrib.semantic;
                    }
                }
                for (var i = 0; i < attrib.value.length; i+= attrib.size) {
                    if (attrib.size === 1) {
                        geoAttrib.value.push(attrib.array[i]);
                    } else {
                        geoAttrib.value.push(attrib.subarray(i, i + attrib.size));
                    }
                }
            }

            if (this.boundingBox) {
                geometry.boundingBox = new BoundingBox();
                geometry.boundingBox.min.copy(this.boundingBox.min);
                geometry.boundingBox.max.copy(this.boundingBox.max);
            }
            // PENDING : copy buffer ?
            
            return geometry;
        },

        applyTransform : function(matrix) {

            if (this.boundingBox) {
                this.boundingBox.applyTransform(matrix);
            }

            var positions = this.attributes.position.value;
            var normals = this.attributes.normal.value;
            var tangents = this.attributes.tangent.value;

            matrix = matrix._array;
            // Normal Matrix
            var inverseTransposeMatrix = mat4.create();
            mat4.invert(inverseTransposeMatrix, matrix);
            mat4.transpose(inverseTransposeMatrix, inverseTransposeMatrix);

            vec3.forEach(positions, 3, 0, null, vec3.transformMat4, matrix);
            if (normals) {
                vec3.forEach(normals, 3, 0, null, vec3.transformMat4, inverseTransposeMatrix);
            }
            if (tangents) {
                vec3.forEach(tangents, 4, 0, null, vec3.transformMat4, inverseTransposeMatrix);   
            }
        },

        dispose : function(_gl) {
            this._cache.use(_gl.__GLID__);
            var chunks = this._cache.get('chunks');
            if (chunks) {
                for (var c = 0; c < chunks.length; c++) {
                    var chunk = chunks[c];

                    for (var k = 0; k < chunk.attributeBuffers.length; k++) {
                        var attribs = chunk.attributeBuffers[k];
                        _gl.deleteBuffer(attribs.buffer);
                    }
                }
            }
            this._cache.deleteContext(_gl.__GLID__);
        }
    });

    return StaticGeometry;
});
define('qtek/Renderable',['require','./Node','./core/glenum','./core/glinfo','./math/Vector3','./StaticGeometry'],function(require) {

    

    var Node = require("./Node");
    var glenum = require("./core/glenum");
    var glinfo = require('./core/glinfo');
    var Vector3 = require("./math/Vector3");
    var StaticGeometry = require('./StaticGeometry');

    // Cache
    var prevDrawID = 0;
    var prevDrawIndicesBuffer = null;
    var prevDrawIsUseFace = true;

    var currentDrawID;

    var RenderInfo = function() {
        this.faceNumber = 0;
        this.vertexNumber = 0;
        this.drawCallNumber = 0;
    }

    function VertexArrayObject(
        availableAttributes,
        availableAttributeSymbols,
        indicesBuffer
    ) {
        this.availableAttributes = availableAttributes;
        this.availableAttributeSymbols = availableAttributeSymbols;
        this.indicesBuffer = indicesBuffer;

        this.vao = null;
    }
    /**
     * @constructor qtek.Renderable
     * @extends qtek.Node
     */
    var Renderable = Node.derive(
    /** @lends qtek.Renderable# */
    {
        /**
         * @type {qtek.Material}
         */
        material : null,

        /**
         * @type {qtek.Geometry}
         */
        geometry : null,
        
        /**
         * @type {number}
         */
        mode : glenum.TRIANGLES,

        _drawCache : null,

        _renderInfo : null
    }, function() {
        this._drawCache = {};
        this._renderInfo = new RenderInfo();
    },
    /** @lends qtek.Renderable.prototype */
    {

        // Only if mode is LINES
        /**
         * Used when mode is LINES, LINE_STRIP or LINE_LOOP
         * @type {number}
         */
        lineWidth : 1,
        
        // Culling
        /**
         * @type {boolean}
         */
        culling : true,
        /**
         * @type {number}
         */
        cullFace : glenum.BACK,
        /**
         * @type {number}
         */
        frontFace : glenum.CCW,

        /**
         * Software frustum culling
         * @type {boolean}
         */
        frustumCulling : true,
        /**
         * @type {boolean}
         */
        receiveShadow : true,
        /**
         * @type {boolean}
         */
        castShadow : true,

        /**
         * @return {boolean}
         */
        isRenderable : function() {
            return this.geometry && this.material && this.material.shader && this.visible;
        },

        /**
         * @param  {WebGLRenderingContext} _gl
         * @param  {qtek.Material} [globalMaterial]
         * @return {Object}
         */
        render : function(_gl, globalMaterial) {
            var material = globalMaterial || this.material;
            var shader = material.shader;
            var geometry = this.geometry;

            var glDrawMode = this.mode;

            // TODO
            // var vaoExt = glinfo.getExtension(_gl, 'OES_vertex_array_object');
            var vaoExt = null;
            var isStatic = geometry.hint == glenum.STATIC_DRAW;
            
            var nVertex = geometry.getVertexNumber();
            var isUseFace = geometry.isUseFace();
            var renderInfo = this._renderInfo;
            renderInfo.vertexNumber = nVertex;
            renderInfo.faceNumber = 0;
            renderInfo.drawCallNumber = 0;
            // Draw each chunk
            var drawHashChanged = false;
            // Hash with shader id in case previous material has less attributes than next material
            currentDrawID = _gl.__GLID__ + '-' + geometry.__GUID__ + '-' + shader.__GUID__;

            // The cache will be invalid in the following cases
            // 1. Geometry is splitted to multiple chunks
            // 2. VAO is enabled and is binded to null after render
            // 3. Geometry needs update
            if (nVertex > geometry.chunkSize && isUseFace || (vaoExt && isStatic)) {
                drawHashChanged = true;
            }
            else if (geometry._cache.isDirty()) {
                drawHashChanged = true;
            }
            else {
                if (currentDrawID !== prevDrawID) {
                    drawHashChanged = true;
                }
            }
            drawHashChanged = true;
            prevDrawID = currentDrawID;

            if (!drawHashChanged) {
                // Direct draw
                if (prevDrawIsUseFace) {
                    _gl.drawElements(glDrawMode, prevDrawIndicesBuffer.count, _gl.UNSIGNED_SHORT, 0);
                    renderInfo.faceNumber = prevDrawIndicesBuffer.count / 3;
                }
                else {
                    _gl.drawArrays(glDrawMode, 0, nVertex);
                }
                renderInfo.drawCallNumber = 1;
            } else {
                // Use the cache of static geometry
                // TODO : machanism to change to the DynamicGeometry automatically
                // when the geometry is not static any more
                var vaoList = this._drawCache[currentDrawID];
                if (!vaoList) {
                    var chunks = geometry.getBufferChunks(_gl);
                    if (!chunks) {  // Empty mesh
                        return;
                    }
                    vaoList = [];
                    for (var c = 0; c < chunks.length; c++) {
                        var chunk = chunks[c];
                        var attributeBuffers = chunk.attributeBuffers;
                        var indicesBuffer = chunk.indicesBuffer;

                        var availableAttributes = [];
                        var availableAttributeSymbols = [];
                        for (var a = 0; a < attributeBuffers.length; a++) {
                            var attributeBufferInfo = attributeBuffers[a];
                            var name = attributeBufferInfo.name;
                            var semantic = attributeBufferInfo.semantic;

                            if (semantic) {
                                var semanticInfo = shader.attribSemantics[semantic];
                                var symbol = semanticInfo && semanticInfo.symbol;
                            } else {
                                var symbol = name;
                            }
                            if (symbol && shader.attributeTemplates[symbol]) {
                                availableAttributes.push(attributeBufferInfo);
                                availableAttributeSymbols.push(symbol);
                            }
                        }

                        var vao = new VertexArrayObject(
                            availableAttributes,
                            availableAttributeSymbols,
                            indicesBuffer
                        );
                        vaoList.push(vao);
                    }
                    if (isStatic) {
                        this._drawCache[currentDrawID] = vaoList;
                    }
                }

                for (var i = 0; i < vaoList.length; i++) {
                    var vao = vaoList[i];
                    var needsBindAttributes = true;

                    // Create vertex object array cost a lot
                    // So we don't abaddoned it on the dynamic object
                    if (vaoExt && isStatic) {
                        // Use vertex array object
                        // http://blog.tojicode.com/2012/10/oesvertexarrayobject-extension.html
                        if (vao.vao == null) {
                            vao.vao = vaoExt.createVertexArrayOES();
                        } else {
                            needsBindAttributes = false;
                        }
                        vaoExt.bindVertexArrayOES(vao.vao);
                    }

                    var availableAttributes = vao.availableAttributes;
                    var availableAttributeSymbols = vao.availableAttributeSymbols;
                    var indicesBuffer = vao.indicesBuffer;
                    
                    if (needsBindAttributes) {
                        var locationList = shader.enableAttributes(_gl, vao.availableAttributeSymbols);
                        // Setting attributes;
                        for (var a = 0; a < availableAttributes.length; a++) {
                            var location = locationList[a];
                            if (location === -1) {
                                continue;
                            }
                            var attributeBufferInfo = availableAttributes[a];
                            var buffer = attributeBufferInfo.buffer;
                            var symbol = availableAttributeSymbols[a];
                            var size = attributeBufferInfo.size;
                            var glType;
                            switch (attributeBufferInfo.type) {
                                case "float":
                                    glType = _gl.FLOAT;
                                    break;
                                case "byte":
                                    glType = _gl.BYTE;
                                    break;
                                case "ubyte":
                                    glType = _gl.UNSIGNED_BYTE;
                                    break;
                                case "short":
                                    glType = _gl.SHORT;
                                    break;
                                case "ushort":
                                    glType = _gl.UNSIGNED_SHORT;
                                    break;
                                default:
                                    glType = _gl.FLOAT;
                                    break;
                            }

                            _gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
                            _gl.vertexAttribPointer(location, size, glType, false, 0, 0);
                            if (vaoExt && isStatic) {
                                _gl.enableVertexAttribArray(location);
                            }
                        }
                    }
                    if (
                        glDrawMode == glenum.LINES ||
                        glDrawMode == glenum.LINE_STRIP ||
                        glDrawMode == glenum.LINE_LOOP
                    ) {
                        _gl.lineWidth(this.lineWidth);
                    }
                    
                    prevDrawIndicesBuffer = indicesBuffer;
                    prevDrawIsUseFace = geometry.isUseFace();
                    //Do drawing
                    if (prevDrawIsUseFace) {
                        if (needsBindAttributes) {
                            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, indicesBuffer.buffer);
                        }
                        _gl.drawElements(glDrawMode, indicesBuffer.count, _gl.UNSIGNED_SHORT, 0);
                        renderInfo.faceNumber += indicesBuffer.count / 3;
                    } else {
                        _gl.drawArrays(glDrawMode, 0, nVertex);
                    }

                    if (vaoExt && isStatic) {
                        vaoExt.bindVertexArrayOES(null);
                    }

                    renderInfo.drawCallNumber++;
                }
            }

            return renderInfo;
        },

        /**
         * Clone a new renderable
         * @method
         * @return {qtek.Renderable}
         */
        clone : (function() {
            var properties = [
                'castShadow', 'receiveShadow',
                'mode', 'culling', 'cullFace', 'frontFace',
                'frustumCulling'
            ];
            return function() {
                var renderable = Node.prototype.clone.call(this);

                renderable.geometry = this.geometry;
                renderable.material = this.material;
                
                for (var i = 0; i < properties.length; i++) {
                    var name = properties[i];
                    // Try not to overwrite the prototype property
                    if (renderable[name] !== this[name]) {
                        renderable[name] = this[name];
                    }
                }

                return renderable;
            }
        })()
    });

    Renderable.beforeFrame = function() {
        prevDrawID = 0;
    }

    // Enums
    Renderable.POINTS = glenum.POINTS;
    Renderable.LINES = glenum.LINES;
    Renderable.LINE_LOOP = glenum.LINE_LOOP;
    Renderable.LINE_STRIP = glenum.LINE_STRIP;
    Renderable.TRIANGLES = glenum.TRIANGLES;
    Renderable.TRIANGLE_STRIP = glenum.TRIANGLE_STRIP;
    Renderable.TRIANGLE_FAN = glenum.TRIANGLE_FAN;

    Renderable.BACK = glenum.BACK;
    Renderable.FRONT = glenum.FRONT;
    Renderable.FRONT_AND_BACK = glenum.FRONT_AND_BACK;
    Renderable.CW = glenum.CW;
    Renderable.CCW = glenum.CCW;

    Renderable.RenderInfo = RenderInfo;

    return Renderable;
});
define('qtek/Mesh',['require','./Renderable','./core/glenum','./core/glinfo'],function(require) {

    

    var Renderable = require("./Renderable");
    var glenum = require("./core/glenum");
    var glinfo = require('./core/glinfo');

    /**
     * @constructor qtek.Mesh
     * @extends qtek.Renderable
     */
    var Mesh = Renderable.derive(
    /** @lends qtek.Mesh# */
    {

        mode : glenum.TRIANGLES,

        /**
         * Used when it is a skinned mesh
         * @type {qtek.Skeleton}
         */
        skeleton : null,
        /**
         * Joints indices Meshes can share the one skeleton instance and each mesh can use one part of joints. Joints indices indicate the index of joint in the skeleton instance
         * @type {number[]}
         */
        joints : null

    }, function() {
        if (!this.joints) {
            this.joints = [];
        }
    }, {

        render : function(_gl, globalMaterial) {       
            var material = globalMaterial || this.material;
            // Set pose matrices of skinned mesh
            if (this.skeleton) {
                var skinMatricesArray = this.skeleton.getSubSkinMatrices(this.__GUID__, this.joints);
                material.shader.setUniformBySemantic(_gl, "SKIN_MATRIX", skinMatricesArray);
            }

            return Renderable.prototype.render.call(this, _gl, globalMaterial);
        }
    });

    // Enums
    Mesh.POINTS = glenum.POINTS;
    Mesh.LINES = glenum.LINES;
    Mesh.LINE_LOOP = glenum.LINE_LOOP;
    Mesh.LINE_STRIP = glenum.LINE_STRIP;
    Mesh.TRIANGLES = glenum.TRIANGLES;
    Mesh.TRIANGLE_STRIP = glenum.TRIANGLE_STRIP;
    Mesh.TRIANGLE_FAN = glenum.TRIANGLE_FAN;

    Mesh.BACK = glenum.BACK;
    Mesh.FRONT = glenum.FRONT;
    Mesh.FRONT_AND_BACK = glenum.FRONT_AND_BACK;
    Mesh.CW = glenum.CW;
    Mesh.CCW = glenum.CCW;

    return Mesh;
});

define('qtek/shader/source/basic.essl',[],function () { return '@export buildin.basic.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nuniform vec2 uvRepeat : [1.0, 1.0];\n\nattribute vec2 texcoord : TEXCOORD_0;\nattribute vec3 position : POSITION;\n\nattribute vec3 barycentric;\n\n#ifdef SKINNING\nattribute vec3 weight : WEIGHT;\nattribute vec4 joint : JOINT;\n\nuniform mat4 skinMatrix[JOINT_NUMBER] : SKIN_MATRIX;\n#endif\n\nvarying vec2 v_Texcoord;\nvarying vec3 v_Barycentric;\n\nvoid main()\n{\n    vec3 skinnedPosition = position;\n\n    #ifdef SKINNING\n        \n        @import buildin.chunk.skin_matrix\n        \n        skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n    #endif\n\n    v_Texcoord = texcoord * uvRepeat;\n    v_Barycentric = barycentric;\n\n    gl_Position = worldViewProjection * vec4(skinnedPosition, 1.0);\n}\n\n@end\n\n\n\n\n@export buildin.basic.fragment\n\nvarying vec2 v_Texcoord;\nuniform sampler2D diffuseMap;\nuniform vec3 color : [1.0, 1.0, 1.0];\nuniform vec3 emission : [0.0, 0.0, 0.0];\nuniform float alpha : 1.0;\n\n// Uniforms for wireframe\nuniform float lineWidth : 0.0;\nuniform vec3 lineColor : [0.0, 0.0, 0.0];\nvarying vec3 v_Barycentric;\n\n#extension GL_OES_standard_derivatives : enable\n@import buildin.util.edge_factor\n\nvoid main()\n{\n\n    #ifdef RENDER_TEXCOORD\n        gl_FragColor = vec4(v_Texcoord, 1.0, 1.0);\n        return;\n    #endif\n\n    gl_FragColor = vec4(color, alpha);\n    \n    #ifdef DIFFUSEMAP_ENABLED\n        vec4 tex = texture2D( diffuseMap, v_Texcoord );\n\n        #ifdef SRGB_DECODE\n            tex.rgb = pow(tex.rgb, vec3(2.2));\n        #endif\n        \n        #if defined(DIFFUSEMAP_ALPHA_ALPHA)\n            gl_FragColor.a = tex.a;\n        #endif\n\n        gl_FragColor.rgb *= tex.rgb;\n    #endif\n\n    gl_FragColor.rgb += emission;\n    if( lineWidth > 0.01)\n    {\n        gl_FragColor.rgb = gl_FragColor.rgb * mix(lineColor, vec3(1.0), edgeFactor(lineWidth));\n    }\n}\n\n@end';});


define('qtek/shader/source/lambert.essl',[],function () { return '/**\n * http://en.wikipedia.org/wiki/Lambertian_reflectance\n */\n\n@export buildin.lambert.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\nuniform mat4 worldInverseTranspose : WORLDINVERSETRANSPOSE;\nuniform mat4 world : WORLD;\n\nuniform vec2 uvRepeat : [1.0, 1.0];\n\nattribute vec3 position : POSITION;\nattribute vec2 texcoord : TEXCOORD_0;\nattribute vec3 normal : NORMAL;\n\nattribute vec3 barycentric;\n\n#ifdef SKINNING\nattribute vec3 weight : WEIGHT;\nattribute vec4 joint : JOINT;\n\nuniform mat4 skinMatrix[JOINT_NUMBER] : SKIN_MATRIX;\n#endif\n\nvarying vec2 v_Texcoord;\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\nvarying vec3 v_Barycentric;\n\nvoid main()\n{\n\n    vec3 skinnedPosition = position;\n    vec3 skinnedNormal = normal;\n\n    #ifdef SKINNING\n        \n        @import buildin.chunk.skin_matrix\n\n        skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n        // Normal matrix ???\n        skinnedNormal = (skinMatrixWS * vec4(normal, 0.0)).xyz;\n    #endif\n\n    gl_Position = worldViewProjection * vec4( skinnedPosition, 1.0 );\n\n    v_Texcoord = texcoord * uvRepeat;\n    v_Normal = normalize( ( worldInverseTranspose * vec4(skinnedNormal, 0.0) ).xyz );\n    v_WorldPosition = ( world * vec4( skinnedPosition, 1.0) ).xyz;\n\n    v_Barycentric = barycentric;\n}\n\n@end\n\n\n\n\n@export buildin.lambert.fragment\n\nvarying vec2 v_Texcoord;\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\n\nuniform sampler2D diffuseMap;\nuniform sampler2D alphaMap;\n\nuniform vec3 color : [1.0, 1.0, 1.0];\nuniform vec3 emission : [0.0, 0.0, 0.0];\nuniform float alpha : 1.0;\n\n// Uniforms for wireframe\nuniform float lineWidth : 0.0;\nuniform vec3 lineColor : [0.0, 0.0, 0.0];\nvarying vec3 v_Barycentric;\n\n#ifdef AMBIENT_LIGHT_NUMBER\n@import buildin.header.ambient_light\n#endif\n#ifdef POINT_LIGHT_NUMBER\n@import buildin.header.point_light\n#endif\n#ifdef DIRECTIONAL_LIGHT_NUMBER\n@import buildin.header.directional_light\n#endif\n#ifdef SPOT_LIGHT_NUMBER\n@import buildin.header.spot_light\n#endif\n\n#extension GL_OES_standard_derivatives : enable\n// Import util functions and uniforms needed\n@import buildin.util.calculate_attenuation\n\n@import buildin.util.edge_factor\n\n@import buildin.plugin.compute_shadow_map\n\nvoid main()\n{\n    #ifdef RENDER_NORMAL\n        gl_FragColor = vec4(v_Normal, 1.0);\n        return;\n    #endif\n    #ifdef RENDER_TEXCOORD\n        gl_FragColor = vec4(v_Texcoord, 1.0, 1.0);\n        return;\n    #endif\n\n    gl_FragColor = vec4(color, alpha);\n\n    #ifdef DIFFUSEMAP_ENABLED\n        vec4 tex = texture2D( diffuseMap, v_Texcoord );\n        #ifdef SRGB_DECODE\n            tex.rgb = pow(tex.rgb, vec3(2.2));\n        #endif\n        gl_FragColor.rgb *= tex.rgb;\n        #ifdef DIFFUSEMAP_ALPHA_ALPHA\n            gl_FragColor.a *= tex.a;\n        #endif\n    #endif\n\n    vec3 diffuseColor = vec3(0.0, 0.0, 0.0);\n    \n    #ifdef AMBIENT_LIGHT_NUMBER\n        for(int i = 0; i < AMBIENT_LIGHT_NUMBER; i++)\n        {\n            diffuseColor += ambientLightColor[i];\n        }\n    #endif\n    // Compute point light color\n    #ifdef POINT_LIGHT_NUMBER\n        #if defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[POINT_LIGHT_NUMBER];\n            if( shadowEnabled )\n            {\n                computeShadowOfPointLights( v_WorldPosition, shadowContribs );\n            }\n        #endif\n        for(int i = 0; i < POINT_LIGHT_NUMBER; i++)\n        {\n\n            vec3 lightPosition = pointLightPosition[i];\n            vec3 lightColor = pointLightColor[i];\n            float range = pointLightRange[i];\n\n            vec3 lightDirection = lightPosition - v_WorldPosition;\n\n            // Calculate point light attenuation\n            float dist = length(lightDirection);\n            float attenuation = lightAttenuation(dist, range);\n\n            // Normalize vectors\n            lightDirection /= dist;\n\n            float ndl = dot( v_Normal, lightDirection );\n\n            float shadowContrib = 1.0;\n            #if defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n                if( shadowEnabled )\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            diffuseColor += lightColor * clamp(ndl, 0.0, 1.0) * attenuation * shadowContrib;\n        }\n    #endif\n    #ifdef DIRECTIONAL_LIGHT_NUMBER\n        #if defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[DIRECTIONAL_LIGHT_NUMBER];\n            if(shadowEnabled)\n            {\n                computeShadowOfDirectionalLights( v_WorldPosition, shadowContribs );\n            }\n        #endif\n        for(int i = 0; i < DIRECTIONAL_LIGHT_NUMBER; i++)\n        {\n            vec3 lightDirection = -directionalLightDirection[i];\n            vec3 lightColor = directionalLightColor[i];\n            \n            float ndl = dot( v_Normal, normalize( lightDirection ) );\n\n            float shadowContrib = 1.0;\n            #if defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER)\n                if( shadowEnabled )\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            diffuseColor += lightColor * clamp(ndl, 0.0, 1.0) * shadowContrib;\n        }\n    #endif\n    \n    #ifdef SPOT_LIGHT_NUMBER\n        #if defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[SPOT_LIGHT_NUMBER];\n            if( shadowEnabled )\n            {\n                computeShadowOfSpotLights( v_WorldPosition, shadowContribs );\n            }\n        #endif\n        for(int i = 0; i < SPOT_LIGHT_NUMBER; i++)\n        {\n            vec3 lightPosition = -spotLightPosition[i];\n            vec3 spotLightDirection = -normalize( spotLightDirection[i] );\n            vec3 lightColor = spotLightColor[i];\n            float range = spotLightRange[i];\n            float a = spotLightUmbraAngleCosine[i];\n            float b = spotLightPenumbraAngleCosine[i];\n            float falloffFactor = spotLightFalloffFactor[i];\n\n            vec3 lightDirection = lightPosition - v_WorldPosition;\n            // Calculate attenuation\n            float dist = length(lightDirection);\n            float attenuation = lightAttenuation(dist, range); \n\n            // Normalize light direction\n            lightDirection /= dist;\n            // Calculate spot light fall off\n            float c = dot(spotLightDirection, lightDirection);\n\n            float falloff;\n            falloff = clamp((c - a) /( b - a), 0.0, 1.0);\n            falloff = pow(falloff, falloffFactor);\n\n            float ndl = dot(v_Normal, lightDirection);\n            ndl = clamp(ndl, 0.0, 1.0);\n\n            float shadowContrib = 1.0;\n            #if defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n                if( shadowEnabled )\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            diffuseColor += lightColor * ndl * attenuation * (1.0-falloff) * shadowContrib;\n\n        }\n    #endif\n\n    gl_FragColor.rgb *= diffuseColor;\n    gl_FragColor.rgb += emission;\n    if(lineWidth > 0.01)\n    {\n        gl_FragColor.rgb = gl_FragColor.rgb * mix(lineColor, vec3(1.0), edgeFactor(lineWidth));\n    }\n}\n\n@end';});


define('qtek/shader/source/phong.essl',[],function () { return '\n// http://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_shading_model\n\n@export buildin.phong.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\nuniform mat4 worldInverseTranspose : WORLDINVERSETRANSPOSE;\nuniform mat4 world : WORLD;\n\nuniform vec2 uvRepeat : [1.0, 1.0];\n\nattribute vec3 position : POSITION;\nattribute vec2 texcoord : TEXCOORD_0;\nattribute vec3 normal : NORMAL;\nattribute vec4 tangent : TANGENT;\n\n#ifdef VERTEX_COLOR\nattribute vec4 color : COLOR;\n#endif\n\nattribute vec3 barycentric;\n\n#ifdef SKINNING\nattribute vec3 weight : WEIGHT;\nattribute vec4 joint : JOINT;\n\nuniform mat4 skinMatrix[JOINT_NUMBER] : SKIN_MATRIX;\n#endif\n\nvarying vec2 v_Texcoord;\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\nvarying vec3 v_Barycentric;\n\n#ifdef NORMALMAP_ENABLED\nvarying vec3 v_Tangent;\nvarying vec3 v_Bitangent;\n#endif\n\n#ifdef VERTEX_COLOR\nvarying vec4 v_Color;\n#endif\n\nvoid main()\n{\n    \n    vec3 skinnedPosition = position;\n    vec3 skinnedNormal = normal;\n    vec3 skinnedTangent = tangent.xyz;\n    #ifdef SKINNING\n        \n        @import buildin.chunk.skin_matrix\n\n        skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n        // Normal matrix ???\n        skinnedNormal = (skinMatrixWS * vec4(normal, 0.0)).xyz;\n        skinnedTangent = (skinMatrixWS * vec4(tangent.xyz, 0.0)).xyz;\n    #endif\n\n    gl_Position = worldViewProjection * vec4(skinnedPosition, 1.0);\n\n    v_Texcoord = texcoord * uvRepeat;\n    v_WorldPosition = (world * vec4(skinnedPosition, 1.0)).xyz;\n    v_Barycentric = barycentric;\n\n    v_Normal = normalize((worldInverseTranspose * vec4(skinnedNormal, 0.0)).xyz);\n    \n    #ifdef NORMALMAP_ENABLED\n        v_Tangent = normalize((worldInverseTranspose * vec4(skinnedTangent, 0.0)).xyz);\n        v_Bitangent = normalize(cross(v_Normal, v_Tangent) * tangent.w);\n    #endif\n\n    #ifdef VERTEX_COLOR\n        v_Color = color;\n    #endif\n}\n\n@end\n\n\n@export buildin.phong.fragment\n\nuniform mat4 viewInverse : VIEWINVERSE;\n\nvarying vec2 v_Texcoord;\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\n\n#ifdef NORMALMAP_ENABLED\nvarying vec3 v_Tangent;\nvarying vec3 v_Bitangent;\n#endif\n\nuniform sampler2D diffuseMap;\nuniform sampler2D normalMap;\nuniform samplerCube environmentMap;\n\nuniform vec3 color : [1.0, 1.0, 1.0];\nuniform float alpha : 1.0;\n\nuniform float shininess : 30;\n\nuniform vec3 specularColor : [1.0, 1.0, 1.0];\nuniform vec3 emission : [0.0, 0.0, 0.0];\n\nuniform float reflectivity : 0.5;\n\n// Uniforms for wireframe\nuniform float lineWidth : 0.0;\nuniform vec3 lineColor : [0.0, 0.0, 0.0];\nvarying vec3 v_Barycentric;\n\n#ifdef AMBIENT_LIGHT_NUMBER\n@import buildin.header.ambient_light\n#endif\n#ifdef POINT_LIGHT_NUMBER\n@import buildin.header.point_light\n#endif\n#ifdef DIRECTIONAL_LIGHT_NUMBER\n@import buildin.header.directional_light\n#endif\n#ifdef SPOT_LIGHT_NUMBER\n@import buildin.header.spot_light\n#endif\n\n#extension GL_OES_standard_derivatives : enable\n// Import util functions and uniforms needed\n@import buildin.util.calculate_attenuation\n\n@import buildin.util.edge_factor\n\n@import buildin.plugin.compute_shadow_map\n\nvoid main()\n{\n    #ifdef RENDER_TEXCOORD\n        gl_FragColor = vec4(v_Texcoord, 1.0, 1.0);\n        return;\n    #endif\n\n    vec4 finalColor = vec4(color, alpha);\n\n    vec3 eyePos = viewInverse[3].xyz;\n    vec3 viewDirection = normalize(eyePos - v_WorldPosition);\n\n    #ifdef DIFFUSEMAP_ENABLED\n        vec4 tex = texture2D(diffuseMap, v_Texcoord);\n        #ifdef SRGB_DECODE\n            tex.rgb = pow(tex.rgb, vec3(2.2));\n        #endif\n        finalColor.rgb *= tex.rgb;\n        #ifdef DIFFUSEMAP_ALPHA_ALPHA\n            finalColor.a *= tex.a;\n        #endif\n    #endif\n\n    vec3 normal = v_Normal;\n    #ifdef NORMALMAP_ENABLED\n        normal = texture2D(normalMap, v_Texcoord).xyz * 2.0 - 1.0;\n        mat3 tbn = mat3(v_Tangent, v_Bitangent, v_Normal);\n        normal = normalize(tbn * normal);\n    #endif\n\n    #ifdef RENDER_NORMAL\n        gl_FragColor = vec4(normal, 1.0);\n        return;\n    #endif\n\n    // Diffuse part of all lights\n    vec3 diffuseTerm = vec3(0.0, 0.0, 0.0);\n    // Specular part of all lights\n    vec3 specularTerm = vec3(0.0, 0.0, 0.0);\n    \n    #ifdef AMBIENT_LIGHT_NUMBER\n        for(int i = 0; i < AMBIENT_LIGHT_NUMBER; i++)\n        {\n            diffuseTerm += ambientLightColor[i];\n        }\n    #endif\n    #ifdef POINT_LIGHT_NUMBER\n        #if defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[POINT_LIGHT_NUMBER];\n            if(shadowEnabled)\n            {\n                computeShadowOfPointLights(v_WorldPosition, shadowContribs);\n            }\n        #endif\n        for(int i = 0; i < POINT_LIGHT_NUMBER; i++)\n        {\n            vec3 lightPosition = pointLightPosition[i];\n            vec3 lightColor = pointLightColor[i];\n            float range = pointLightRange[i];\n\n            vec3 lightDirection = lightPosition - v_WorldPosition;\n\n            // Calculate point light attenuation\n            float dist = length(lightDirection);\n            float attenuation = lightAttenuation(dist, range); \n\n            // Normalize vectors\n            lightDirection /= dist;\n            vec3 halfVector = normalize(lightDirection + viewDirection);\n\n            float ndh = dot(normal, halfVector);\n            ndh = clamp(ndh, 0.0, 1.0);\n\n            float ndl = dot(normal,  lightDirection);\n            ndl = clamp(ndl, 0.0, 1.0);\n\n            float shadowContrib = 1.0;\n            #if defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n                if(shadowEnabled)\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            vec3 li = lightColor * ndl * attenuation * shadowContrib;\n\n            diffuseTerm += li;\n            if (shininess > 0.0)\n            {\n                specularTerm += li * pow(ndh, shininess);\n            }\n\n        }\n    #endif\n\n    #ifdef DIRECTIONAL_LIGHT_NUMBER\n        #if defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[DIRECTIONAL_LIGHT_NUMBER];\n            if(shadowEnabled)\n            {\n                computeShadowOfDirectionalLights(v_WorldPosition, shadowContribs);\n            }\n        #endif\n        for(int i = 0; i < DIRECTIONAL_LIGHT_NUMBER; i++)\n        {\n\n            vec3 lightDirection = -normalize(directionalLightDirection[i]);\n            vec3 lightColor = directionalLightColor[i];\n\n            vec3 halfVector = normalize(lightDirection + viewDirection);\n\n            float ndh = dot(normal, halfVector);\n            ndh = clamp(ndh, 0.0, 1.0);\n\n            float ndl = dot(normal, lightDirection);\n            ndl = clamp(ndl, 0.0, 1.0);\n\n            float shadowContrib = 1.0;\n            #if defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER)\n                if(shadowEnabled)\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            vec3 li = lightColor * ndl * shadowContrib;\n\n            diffuseTerm += li;\n            if (shininess > 0.0)\n            {\n                specularTerm += li * pow(ndh, shininess);\n            }\n        }\n    #endif\n\n    #ifdef SPOT_LIGHT_NUMBER\n        #if defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[SPOT_LIGHT_NUMBER];\n            if(shadowEnabled)\n            {\n                computeShadowOfSpotLights(v_WorldPosition, shadowContribs);\n            }\n        #endif\n        for(int i = 0; i < SPOT_LIGHT_NUMBER; i++)\n        {\n            vec3 lightPosition = spotLightPosition[i];\n            vec3 spotLightDirection = -normalize(spotLightDirection[i]);\n            vec3 lightColor = spotLightColor[i];\n            float range = spotLightRange[i];\n            float a = spotLightUmbraAngleCosine[i];\n            float b = spotLightPenumbraAngleCosine[i];\n            float falloffFactor = spotLightFalloffFactor[i];\n\n            vec3 lightDirection = lightPosition - v_WorldPosition;\n            // Calculate attenuation\n            float dist = length(lightDirection);\n            float attenuation = lightAttenuation(dist, range); \n\n            // Normalize light direction\n            lightDirection /= dist;\n            // Calculate spot light fall off\n            float c = dot(spotLightDirection, lightDirection);\n\n            float falloff;\n            // Fomular from real-time-rendering\n            falloff = clamp((c - a) /( b - a), 0.0, 1.0);\n            falloff = pow(falloff, falloffFactor);\n\n            vec3 halfVector = normalize(lightDirection + viewDirection);\n\n            float ndh = dot(normal, halfVector);\n            ndh = clamp(ndh, 0.0, 1.0);\n\n            float ndl = dot(normal, lightDirection);\n            ndl = clamp(ndl, 0.0, 1.0);\n\n            float shadowContrib = 1.0;\n            #if defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n                if (shadowEnabled)\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            vec3 li = lightColor * ndl * attenuation * (1.0-falloff) * shadowContrib;\n\n            diffuseTerm += li;\n            if (shininess > 0.0)\n            {\n                specularTerm += li * pow(ndh, shininess);\n            }\n        }\n    #endif\n\n    finalColor.rgb *= diffuseTerm;\n    finalColor.rgb += specularTerm * specularColor;\n    finalColor.rgb += emission;\n\n    #ifdef ENVIRONMENTMAP_ENABLED\n        vec3 envTex = textureCube(environmentMap, reflect(-viewDirection, normal)).xyz;\n        finalColor.rgb = finalColor.rgb + envTex * reflectivity;\n    #endif\n\n    if(lineWidth > 0.01)\n    {\n        finalColor.rgb = finalColor.rgb * mix(lineColor, vec3(1.0), edgeFactor(lineWidth));\n    }\n\n    #ifdef GAMMA_ENCODE\n        finalColor.rgb = pow(finalColor.rgb, vec3(1 / 2.2));\n    #endif\n\n    gl_FragColor = finalColor;\n}\n\n@end';});


define('qtek/shader/source/physical.essl',[],function () { return '\n// http://blog.selfshadow.com/publications/s2013-shading-course/\n\n@export buildin.physical.vertex\n\n@import buildin.phong.vertex\n\n@end\n\n\n@export buildin.physical.fragment\n\n#define PI 3.14159265358979\n\nuniform mat4 viewInverse : VIEWINVERSE;\n\nvarying vec2 v_Texcoord;\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\n\n#ifdef NORMALMAP_ENABLED\nvarying vec3 v_Tangent;\nvarying vec3 v_Bitangent;\n#endif\n\nuniform sampler2D diffuseMap;\nuniform sampler2D normalMap;\nuniform samplerCube environmentMap;\n\nuniform vec3 color : [1.0, 1.0, 1.0];\nuniform float alpha : 1.0;\n\nuniform float glossiness : 0.5;\n\nuniform vec3 specularColor : [0.1, 0.1, 0.1];\nuniform vec3 emission : [0.0, 0.0, 0.0];\n\n// Uniforms for wireframe\nuniform float lineWidth : 0.0;\nuniform vec3 lineColor : [0.0, 0.0, 0.0];\nvarying vec3 v_Barycentric;\n\n#ifdef AMBIENT_LIGHT_NUMBER\n@import buildin.header.ambient_light\n#endif\n#ifdef POINT_LIGHT_NUMBER\n@import buildin.header.point_light\n#endif\n#ifdef DIRECTIONAL_LIGHT_NUMBER\n@import buildin.header.directional_light\n#endif\n#ifdef SPOT_LIGHT_NUMBER\n@import buildin.header.spot_light\n#endif\n\n#extension GL_OES_standard_derivatives : enable\n\n// Import util functions and uniforms needed\n@import buildin.util.calculate_attenuation\n\n@import buildin.util.edge_factor\n\n@import buildin.plugin.compute_shadow_map\n\n\nfloat G_Smith(float glossiness, float ndv, float ndl)\n{\n    // float k = (roughness+1.0) * (roughness+1.0) * 0.125;\n    float roughness = 1.0 - glossiness;\n    float k = roughness * roughness / 2.0;\n    float G1V = ndv / (ndv * (1.0 - k) + k);\n    float G1L = ndl / (ndl * (1.0 - k) + k);\n    return G1L * G1V;\n}\n\nvec3 F_Schlick(float ldn) {\n    return specularColor + (1.0 - specularColor) * pow(1.0 - ldn, 5.0);\n}\n\nfloat D_Phong(float g, float ndh) {\n    // from black ops 2\n    float a = pow(8192.0, g);\n    return (a + 2.0) / 8.0 * pow(ndh, a);\n}\n\nfloat D_GGX(float g, float ndh) {\n    float r = 1.0 - g;\n    float a = r * r;\n    float tmp = ndh * ndh * (a - 1.0) + 1.0;\n    return a / (PI * tmp * tmp);\n}\n\nvoid main()\n{\n    #ifdef RENDER_TEXCOORD\n        gl_FragColor = vec4(v_Texcoord, 1.0, 1.0);\n        return;\n    #endif\n\n    vec4 finalColor = vec4(color, alpha);\n\n    vec3 eyePos = viewInverse[3].xyz;\n    vec3 V = normalize(eyePos - v_WorldPosition);\n    float g = glossiness;\n\n    #ifdef DIFFUSEMAP_ENABLED\n        vec4 tex = texture2D(diffuseMap, v_Texcoord);\n        #ifdef SRGB_DECODE\n            tex.rgb = pow(tex.rgb, vec3(2.2));\n        #endif\n        finalColor.rgb *= tex.rgb;\n        #ifdef DIFFUSEMAP_ALPHA_ALPHA\n            finalColor.a *= tex.a;\n        #endif\n        #ifdef DIFFUSEMAP_ALPHA_GLOSS\n            g *= tex.a;\n        #endif\n    #endif\n\n    vec3 N = v_Normal;\n    #ifdef NORMALMAP_ENABLED\n        N = texture2D(normalMap, v_Texcoord).xyz * 2.0 - 1.0;\n        mat3 tbn = mat3(v_Tangent, v_Bitangent, v_Normal);\n        N = normalize(tbn * N);\n    #endif\n\n    #ifdef RENDER_NORMAL\n        gl_FragColor = vec4(N, 1.0);\n        return;\n    #endif\n\n    #ifdef RENDER_GLOSSINESS\n        gl_FragColor = vec4(vec3(g), 1.0);\n        return;\n    #endif\n\n    float ndv = dot(N, V);\n\n    // Diffuse part of all lights\n    vec3 diffuseTerm = vec3(0.0, 0.0, 0.0);\n    // Specular part of all lights\n    vec3 specularTerm = vec3(0.0, 0.0, 0.0);\n    \n    #ifdef AMBIENT_LIGHT_NUMBER\n        for(int i = 0; i < AMBIENT_LIGHT_NUMBER; i++)\n        {\n            // Hemisphere ambient lighting from cryengine\n            diffuseTerm += ambientLightColor[i] * (clamp(N.y * 0.7, 0.0, 1.0) + 0.3);\n            // diffuseTerm += ambientLightColor[i];\n        }\n    #endif\n    #ifdef POINT_LIGHT_NUMBER\n        #if defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[POINT_LIGHT_NUMBER];\n            if(shadowEnabled)\n            {\n                computeShadowOfPointLights(v_WorldPosition, shadowContribs);\n            }\n        #endif\n        for(int i = 0; i < POINT_LIGHT_NUMBER; i++)\n        {\n\n            vec3 lightPosition = pointLightPosition[i];\n            vec3 lc = pointLightColor[i];\n            float range = pointLightRange[i];\n\n            vec3 L = lightPosition - v_WorldPosition;\n\n            // Calculate point light attenuation\n            float dist = length(L);\n            float attenuation = lightAttenuation(dist, range); \n            L /= dist;\n            vec3 H = normalize(L + V);\n            float ndl = clamp(dot(N, L), 0.0, 1.0);\n            float ndh = clamp(dot(N, H), 0.0, 1.0);\n            float ldn = clamp(dot(L, N), 0.0, 1.0);\n\n            float shadowContrib = 1.0;\n            #if defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n                if(shadowEnabled)\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            vec3 li = lc * ndl * attenuation * shadowContrib;\n            diffuseTerm += li;\n            specularTerm += li * F_Schlick(ldn) * D_Phong(g, ndh);\n        }\n    #endif\n\n    #ifdef DIRECTIONAL_LIGHT_NUMBER\n        #if defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[DIRECTIONAL_LIGHT_NUMBER];\n            if(shadowEnabled)\n            {\n                computeShadowOfDirectionalLights(v_WorldPosition, shadowContribs);\n            }\n        #endif\n        for(int i = 0; i < DIRECTIONAL_LIGHT_NUMBER; i++)\n        {\n\n            vec3 L = -normalize(directionalLightDirection[i]);\n            vec3 lc = directionalLightColor[i];\n\n            vec3 H = normalize(L + V);\n            float ndl = clamp(dot(N, L), 0.0, 1.0);\n            float ndh = clamp(dot(N, H), 0.0, 1.0);\n            float ldn = clamp(dot(L, N), 0.0, 1.0);\n\n            float shadowContrib = 1.0;\n            #if defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER)\n                if(shadowEnabled)\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            vec3 li = lc * ndl * shadowContrib;\n\n            diffuseTerm += li;\n            specularTerm += li * F_Schlick(ldn) * D_Phong(g, ndh);\n        }\n    #endif\n\n    #ifdef SPOT_LIGHT_NUMBER\n        #if defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n            float shadowContribs[SPOT_LIGHT_NUMBER];\n            if(shadowEnabled)\n            {\n                computeShadowOfSpotLights(v_WorldPosition, shadowContribs);\n            }\n        #endif\n        for(int i = 0; i < SPOT_LIGHT_NUMBER; i++)\n        {\n            vec3 lightPosition = spotLightPosition[i];\n            vec3 spotLightDirection = -normalize(spotLightDirection[i]);\n            vec3 lc = spotLightColor[i];\n            float range = spotLightRange[i];\n            float a = spotLightUmbraAngleCosine[i];\n            float b = spotLightPenumbraAngleCosine[i];\n            float falloffFactor = spotLightFalloffFactor[i];\n\n            vec3 L = lightPosition - v_WorldPosition;\n            // Calculate attenuation\n            float dist = length(L);\n            float attenuation = lightAttenuation(dist, range); \n\n            // Normalize light direction\n            L /= dist;\n            // Calculate spot light fall off\n            float c = dot(spotLightDirection, L);\n\n            float falloff;\n            // Fomular from real-time-rendering\n            falloff = clamp((c - a) /( b - a), 0.0, 1.0);\n            falloff = pow(falloff, falloffFactor);\n\n            vec3 H = normalize(L + V);\n            float ndl = clamp(dot(N, L), 0.0, 1.0);\n            float ndh = clamp(dot(N, H), 0.0, 1.0);\n            float ldn = clamp(dot(L, N), 0.0, 1.0);\n\n            float shadowContrib = 1.0;\n            #if defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n                if (shadowEnabled)\n                {\n                    shadowContrib = shadowContribs[i];\n                }\n            #endif\n\n            vec3 li = lc * attenuation * (1.0-falloff) * shadowContrib * ndl;\n\n            diffuseTerm += li;\n            specularTerm += li * F_Schlick(ldn) * D_Phong(g, ndh);\n        }\n    #endif\n\n    finalColor.rgb *= diffuseTerm;\n    finalColor.rgb += specularTerm;\n    finalColor.rgb += emission;\n\n    #ifdef ENVIRONMENTMAP_ENABLED\n        vec3 envTex = textureCube(environmentMap, reflect(-V, N)).xyz;\n        finalColor.rgb = finalColor.rgb + envTex * g;\n    #endif\n\n    if(lineWidth > 0.)\n    {\n        finalColor.rgb = finalColor.rgb * mix(lineColor, vec3(1.0), edgeFactor(lineWidth));\n    }\n\n    #ifdef GAMMA_ENCODE\n        finalColor.rgb = pow(finalColor.rgb, vec3(1 / 2.2));\n    #endif\n    gl_FragColor = finalColor;\n}\n\n@end';});


define('qtek/shader/source/wireframe.essl',[],function () { return '@export buildin.wireframe.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\nuniform mat4 world : WORLD;\n\nattribute vec3 position : POSITION;\nattribute vec3 barycentric;\n\n#ifdef SKINNING\nattribute vec3 weight : WEIGHT;\nattribute vec4 joint : JOINT;\n\nuniform mat4 skinMatrix[JOINT_NUMBER] : SKIN_MATRIX;\n#endif\n\nvarying vec3 v_Barycentric;\n\nvoid main()\n{\n\n    vec3 skinnedPosition = position;\n    #ifdef SKINNING\n\n        @import buildin.chunk.skin_matrix\n\n        skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n    #endif\n\n    gl_Position = worldViewProjection * vec4(skinnedPosition, 1.0 );\n\n    v_Barycentric = barycentric;\n}\n\n@end\n\n\n@export buildin.wireframe.fragment\n\nuniform vec3 color : [0.0, 0.0, 0.0];\n\nuniform float alpha : 1.0;\nuniform float lineWidth : 1.0;\n\nvarying vec3 v_Barycentric;\n\n#extension GL_OES_standard_derivatives : enable\n\n@import buildin.util.edge_factor\n\nvoid main()\n{\n\n    gl_FragColor.rgb = color;\n    gl_FragColor.a = ( 1.0-edgeFactor(lineWidth) ) * alpha;\n}\n\n@end';});


define('qtek/shader/source/skybox.essl',[],function () { return '@export buildin.skybox.vertex\n\nuniform mat4 world : WORLD;\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nattribute vec3 position : POSITION;\n\nvarying vec3 v_WorldPosition;\n\nvoid main()\n{\n    v_WorldPosition = (world * vec4(position, 1.0)).xyz;\n    gl_Position = worldViewProjection * vec4(position, 1.0);\n}\n\n@end\n\n@export buildin.skybox.fragment\n\nuniform mat4 viewInverse : VIEWINVERSE;\nuniform samplerCube environmentMap;\n\nvarying vec3 v_WorldPosition;\n\nvoid main()\n{\n    vec3 eyePos = viewInverse[3].xyz;\n    vec3 viewDirection = normalize(v_WorldPosition - eyePos);\n\n    vec3 tex = textureCube(environmentMap, viewDirection).xyz;\n\n    #ifdef SRGB_DECODE\n        tex.rgb = pow(tex.rgb, vec3(2.2));\n    #endif\n    \n    gl_FragColor = vec4(tex, 1.0);\n}\n@end';});


define('qtek/shader/source/util.essl',[],function () { return '// Use light attenuation formula in\n// http://blog.slindev.com/2011/01/10/natural-light-attenuation/\n@export buildin.util.calculate_attenuation\n\nuniform float attenuationFactor : 5.0;\n\nfloat lightAttenuation(float dist, float range)\n{\n    float attenuation = 1.0;\n    if( range > 0.0)\n    {\n        attenuation = dist*dist/(range*range);\n        float att_s = attenuationFactor;\n        attenuation = 1.0/(attenuation*att_s+1.0);\n        att_s = 1.0/(att_s+1.0);\n        attenuation = attenuation - att_s;\n        attenuation /= 1.0 - att_s;\n    }\n    return attenuation;\n}\n\n@end\n\n//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/\n@export buildin.util.edge_factor\n\nfloat edgeFactor(float width)\n{\n    vec3 d = fwidth(v_Barycentric);\n    vec3 a3 = smoothstep(vec3(0.0), d * width, v_Barycentric);\n    return min(min(a3.x, a3.y), a3.z);\n}\n\n@end\n\n// Pack depth\n// Float value can only be [0.0 - 1.0) ?\n@export buildin.util.encode_float\nvec4 encodeFloat( const in float depth )\n{\n\n    const vec4 bitShifts = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0 );\n\n    const vec4 bit_mask  = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0 );\n    vec4 res = fract( depth * bitShifts );\n    res -= res.xxyz * bit_mask;\n\n    return res;\n}\n@end\n\n@export buildin.util.decode_float\nfloat decodeFloat(const in vec4 colour)\n{\n    const vec4 bitShifts = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );\n    return dot(colour, bitShifts);\n}\n@end\n\n// http://graphicrants.blogspot.com/2009/04/rgbm-color-encoding.html\n@export buildin.util.rgbm_decode\nvec3 RGBMDecode(vec4 rgbm, float range) {\n  return range * rgbm.rgb * rgbm.a;\n}\n@end\n\n@export buildin.util.rgbm_encode\nvec4 RGBMEncode(vec3 color, float range) {\n    vec4 rgbm;\n    color *= 1.0 / range;\n    rgbm.a = clamp(max(max(color.r, color.g), max(color.b, 1e-6 ) ), 0.0, 1.0);\n    rgbm.a = ceil(rgbm.a * 255.0) / 255.0;\n    rgbm.rgb = color / rgbm.a;\n    return rgbm;\n}\n@end\n\n\n@export buildin.chunk.skin_matrix\n\n// Weighted Sum Skinning Matrix\nmat4 skinMatrixWS;\nif (joint.x >= 0.0)\n{\n    skinMatrixWS = skinMatrix[int(joint.x)] * weight.x;\n}\nif (joint.y >= 0.0)\n{\n    skinMatrixWS += skinMatrix[int(joint.y)] * weight.y;\n}\nif (joint.z >= 0.0)\n{\n    skinMatrixWS += skinMatrix[int(joint.z)] * weight.z;\n}\nif (joint.w >= 0.0)\n{\n    skinMatrixWS += skinMatrix[int(joint.w)] * (1.0-weight.x-weight.y-weight.z);\n}\n@end\n';});


define('qtek/shader/source/prez.essl',[],function () { return '// Shader for prez pass\n@export buildin.prez.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nattribute vec3 position : POSITION;\n\n#ifdef SKINNING\nattribute vec3 weight : WEIGHT;\nattribute vec4 joint : JOINT;\n\nuniform mat4 skinMatrix[JOINT_NUMBER] : SKIN_MATRIX;\n#endif\n\nvoid main()\n{\n\n    vec3 skinnedPosition = position;\n\n    #ifdef SKINNING\n        \n        @import buildin.chunk.skin_matrix\n        \n        skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n    #endif\n    \n    gl_Position = worldViewProjection * vec4(skinnedPosition, 1.0);\n}\n\n@end\n\n\n@export buildin.prez.fragment\n\nvoid main()\n{\n    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n}\n\n@end';});


define('qtek/shader/source/shadowmap.essl',[],function () { return '\n@export buildin.sm.depth.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nattribute vec3 position : POSITION;\n\n#ifdef SHADOW_TRANSPARENT \nattribute vec2 texcoord : TEXCOORD_0;\n#endif\n\n#ifdef SKINNING\nattribute vec3 weight : WEIGHT;\nattribute vec4 joint : JOINT;\n\nuniform mat4 skinMatrix[JOINT_NUMBER] : SKIN_MATRIX;\n#endif\n\nvarying vec4 v_ViewPosition;\n\n#ifdef SHADOW_TRANSPARENT\nvarying vec2 v_Texcoord;\n#endif\n\nvoid main(){\n    \n    vec3 skinnedPosition = position;\n    \n    #ifdef SKINNING\n\n        @import buildin.chunk.skin_matrix\n\n        skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n    #endif\n\n    v_ViewPosition = worldViewProjection * vec4(skinnedPosition, 1.0);\n    gl_Position = v_ViewPosition;\n\n    #ifdef SHADOW_TRANSPARENT\n        v_Texcoord = texcoord;\n    #endif\n}\n@end\n\n@export buildin.sm.depth.fragment\n\nvarying vec4 v_ViewPosition;\n\n#ifdef SHADOW_TRANSPARENT\nvarying vec2 v_Texcoord;\n#endif\n\nuniform float bias : 0.001;\nuniform float slopeScale : 1.0;\n\n#ifdef SHADOW_TRANSPARENT\nuniform sampler2D transparentMap;\n#endif\n\n#extension GL_OES_standard_derivatives : enable\n\n@import buildin.util.encode_float\n\nvoid main(){\n    // Whats the difference between gl_FragCoord.z and this v_ViewPosition\n    // gl_FragCoord consider the polygon offset ?\n    float depth = v_ViewPosition.z / v_ViewPosition.w;\n    // float depth = gl_FragCoord.z / gl_FragCoord.w;\n\n    #ifdef USE_VSM\n        depth = depth * 0.5 + 0.5;\n        float moment1 = depth;\n        float moment2 = depth * depth;\n\n        // Adjusting moments using partial derivative\n        float dx = dFdx(depth);\n        float dy = dFdy(depth);\n        moment2 += 0.25*(dx*dx+dy*dy);\n\n        gl_FragColor = vec4(moment1, moment2, 0.0, 1.0);\n    #else\n        // Add slope scaled bias using partial derivative\n        float dx = dFdx(depth);\n        float dy = dFdy(depth);\n        depth += sqrt(dx*dx + dy*dy) * slopeScale + bias;\n\n        #ifdef SHADOW_TRANSPARENT\n            if (texture2D(transparentMap, v_Texcoord).a <= 0.1) {\n                // Hi-Z\n                gl_FragColor = encodeFloat(0.9999);\n                return;\n            }\n        #endif\n\n        gl_FragColor = encodeFloat(depth * 0.5 + 0.5);\n    #endif\n}\n@end\n\n@export buildin.sm.debug_depth\n\nuniform sampler2D depthMap;\nvarying vec2 v_Texcoord;\n\n@import buildin.util.decode_float\n\nvoid main() {\n    vec4 tex = texture2D(depthMap, v_Texcoord);\n    #ifdef USE_VSM\n        gl_FragColor = vec4(tex.rgb, 1.0);\n    #else\n        float depth = decodeFloat(tex);\n        gl_FragColor = vec4(depth, depth, depth, 1.0);\n    #endif\n}\n\n@end\n\n\n@export buildin.sm.distance.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\nuniform mat4 world : WORLD;\n\nattribute vec3 position : POSITION;\n\n#ifdef SKINNING\nattribute vec3 boneWeight;\nattribute vec4 boneIndex;\n\nuniform mat4 skinMatrix[JOINT_NUMBER] : SKIN_MATRIX;\n#endif\n\nvarying vec3 v_WorldPosition;\n\nvoid main(){\n\n    vec3 skinnedPosition = position;\n    #ifdef SKINNING\n        @import buildin.chunk.skin_matrix\n\n        skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n    #endif\n\n    gl_Position = worldViewProjection * vec4(skinnedPosition , 1.0);\n    v_WorldPosition = (world * vec4(skinnedPosition, 1.0)).xyz;\n}\n\n@end\n\n@export buildin.sm.distance.fragment\n\nuniform vec3 lightPosition;\nuniform float range : 100;\n\nvarying vec3 v_WorldPosition;\n\n@import buildin.util.encode_float\n\nvoid main(){\n    float dist = distance(lightPosition, v_WorldPosition);\n    #ifdef USE_VSM\n        gl_FragColor = vec4(dist, dist * dist, 0.0, 0.0);\n    #else\n        dist = dist / range;\n        gl_FragColor = encodeFloat(dist);\n    #endif\n}\n@end\n\n@export buildin.plugin.compute_shadow_map\n\n#if defined(SPOT_LIGHT_SHADOWMAP_NUMBER) || defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER) || defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n\n#ifdef SPOT_LIGHT_SHADOWMAP_NUMBER\nuniform sampler2D spotLightShadowMaps[SPOT_LIGHT_SHADOWMAP_NUMBER];\nuniform mat4 spotLightMatrices[SPOT_LIGHT_SHADOWMAP_NUMBER];\n#endif\n\n#ifdef DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER\n#if defined(SHADOW_CASCADE)\nuniform sampler2D directionalLightShadowMaps[SHADOW_CASCADE];\nuniform mat4 directionalLightMatrices[SHADOW_CASCADE];\nuniform float shadowCascadeClipsNear[SHADOW_CASCADE];\nuniform float shadowCascadeClipsFar[SHADOW_CASCADE];\n#else\nuniform sampler2D directionalLightShadowMaps[DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER];\nuniform mat4 directionalLightMatrices[DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER];\n#endif\n#endif\n\n#ifdef POINT_LIGHT_SHADOWMAP_NUMBER\nuniform samplerCube pointLightShadowMaps[POINT_LIGHT_SHADOWMAP_NUMBER];\nuniform float pointLightRanges[POINT_LIGHT_SHADOWMAP_NUMBER];\n#endif\n\nuniform bool shadowEnabled : true;\n\n@import buildin.util.decode_float\n\n#if defined(DIRECTIONAL_LIGHT_NUMBER) || defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n\nfloat tapShadowMap(sampler2D map, vec2 uv, float z){\n    vec4 tex = texture2D(map, uv);\n    return decodeFloat(tex) * 2.0 - 1.0< z ? 0.0 : 1.0;\n}\n\nfloat pcf(sampler2D map, vec2 uv, float z){\n\n    float shadowContrib = tapShadowMap(map, uv, z);\n    float offset = 1.0 / 2048.0;\n    shadowContrib += tapShadowMap(map, uv+vec2(offset, 0.0), z);\n    shadowContrib += tapShadowMap(map, uv+vec2(offset, offset), z);\n    shadowContrib += tapShadowMap(map, uv+vec2(-offset, offset), z);\n    shadowContrib += tapShadowMap(map, uv+vec2(0.0, offset), z);\n    shadowContrib += tapShadowMap(map, uv+vec2(-offset, 0.0), z);\n    shadowContrib += tapShadowMap(map, uv+vec2(-offset, -offset), z);\n    shadowContrib += tapShadowMap(map, uv+vec2(offset, -offset), z);\n    shadowContrib += tapShadowMap(map, uv+vec2(0.0, -offset), z);\n\n    return shadowContrib / 9.0;\n}\nfloat chebyshevUpperBound(vec2 moments, float z){\n    float p = 0.0;\n    z = z * 0.5 + 0.5;\n    if (z <= moments.x) {\n        p = 1.0;\n    }\n    float variance = moments.y - moments.x * moments.x;\n    // http://fabiensanglard.net/shadowmappingVSM/\n    variance = max(variance, 0.0000001);\n    // Compute probabilistic upper bound. \n    float mD = moments.x - z;\n    float pMax = variance / (variance + mD * mD);\n    // Now reduce light-bleeding by removing the [0, x] tail and linearly rescaling (x, 1]\n    // TODO : bleedBias parameter ?\n    pMax = clamp((pMax-0.4)/(1.0-0.4), 0.0, 1.0);\n    return max(p, pMax);\n}\nfloat computeShadowContrib(sampler2D map, mat4 lightVPM, vec3 position){\n    \n    vec4 posInLightSpace = lightVPM * vec4(v_WorldPosition, 1.0);\n    posInLightSpace.xyz /= posInLightSpace.w;\n    float z = posInLightSpace.z;\n    // In frustum\n    if(all(greaterThan(posInLightSpace.xyz, vec3(-0.99, -0.99, -1.0))) &&\n        all(lessThan(posInLightSpace.xyz, vec3(0.99, 0.99, 1.0)))){\n        // To texture uv\n        vec2 uv = (posInLightSpace.xy+1.0) / 2.0;\n\n        #ifdef USE_VSM\n            vec2 moments = texture2D(map, uv).xy;\n            return chebyshevUpperBound(moments, z);\n        #else\n            return pcf(map, uv, z);\n        #endif\n    }\n    return 1.0;\n}\n\n#endif\n\n#ifdef POINT_LIGHT_SHADOWMAP_NUMBER\n\nfloat computeShadowOfCube(samplerCube map, vec3 direction, float range){\n    vec4 shadowTex = textureCube(map, direction);\n    float dist = length(direction);\n\n    #ifdef USE_VSM\n        vec2 moments = shadowTex.xy;\n        float variance = moments.y - moments.x * moments.x;\n        float mD = moments.x - dist;\n        float p = variance / (variance + mD * mD);\n        if(moments.x + 0.001 < dist){\n            return clamp(p, 0.0, 1.0);\n        }else{\n            return 1.0;\n        }\n    #else\n        if((decodeFloat(shadowTex) + 0.0002) * range < dist){\n            return 0.0;\n        }else{\n            return 1.0;\n        }\n    #endif\n}\n#endif\n\n#if defined(SPOT_LIGHT_SHADOWMAP_NUMBER)\n\nvoid computeShadowOfSpotLights(vec3 position, inout float shadowContribs[SPOT_LIGHT_NUMBER] ){\n    for(int i = 0; i < SPOT_LIGHT_SHADOWMAP_NUMBER; i++){\n        float shadowContrib = computeShadowContrib(spotLightShadowMaps[i], spotLightMatrices[i], position);\n        shadowContribs[i] = shadowContrib;\n    }\n    // set default fallof of rest lights\n    for(int i = SPOT_LIGHT_SHADOWMAP_NUMBER; i < SPOT_LIGHT_NUMBER; i++){\n        shadowContribs[i] = 1.0;\n    }\n}\n\n#endif\n\n\n#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER)\n\n#ifdef SHADOW_CASCADE\n\nvoid computeShadowOfDirectionalLights(vec3 position, inout float shadowContribs[DIRECTIONAL_LIGHT_NUMBER]){\n    // http://www.opengl.org/wiki/Compute_eye_space_from_window_space\n    float depth = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far)\n                    / (gl_DepthRange.far - gl_DepthRange.near);\n\n    for (int i = 0; i < SHADOW_CASCADE; i++) {\n        if (\n            depth >= shadowCascadeClipsNear[i] &&\n            depth <= shadowCascadeClipsFar[i]\n        ) {\n            float shadowContrib = computeShadowContrib(directionalLightShadowMaps[i], directionalLightMatrices[i], position);\n            // TODO Will get a sampler needs to be be uniform error in native gl\n            shadowContribs[0] = shadowContrib;\n        }\n    }\n    // set default fallof of rest lights\n    for(int i = DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER; i < DIRECTIONAL_LIGHT_NUMBER; i++){\n        shadowContribs[i] = 1.0;\n    }\n}\n\n#else\n\nvoid computeShadowOfDirectionalLights(vec3 position, inout float shadowContribs[DIRECTIONAL_LIGHT_NUMBER]){\n    for(int i = 0; i < DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER; i++){\n        float shadowContrib = computeShadowContrib(directionalLightShadowMaps[i], directionalLightMatrices[i], position);\n        shadowContribs[i] = shadowContrib;\n    }\n    // set default fallof of rest lights\n    for(int i = DIRECTIONAL_LIGHT_SHADOWMAP_NUMBER; i < DIRECTIONAL_LIGHT_NUMBER; i++){\n        shadowContribs[i] = 1.0;\n    }\n}\n#endif\n\n#endif\n\n\n#if defined(POINT_LIGHT_SHADOWMAP_NUMBER)\n\nvoid computeShadowOfPointLights(vec3 position, inout float shadowContribs[POINT_LIGHT_NUMBER] ){\n    for(int i = 0; i < POINT_LIGHT_SHADOWMAP_NUMBER; i++){\n        vec3 lightPosition = pointLightPosition[i];\n        vec3 direction = position - lightPosition;\n        shadowContribs[i] = computeShadowOfCube(pointLightShadowMaps[i], direction, pointLightRanges[i]);\n    }\n    for(int i = POINT_LIGHT_SHADOWMAP_NUMBER; i < POINT_LIGHT_NUMBER; i++){\n        shadowContribs[i] = 1.0;\n    }\n}\n\n#endif\n\n#endif\n\n@end';});


define('qtek/shader/source/compositor/vertex.essl',[],function () { return '\n@export buildin.compositor.vertex\n\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\n\nattribute vec3 position : POSITION;\nattribute vec2 texcoord : TEXCOORD_0;\n\nvarying vec2 v_Texcoord;\n\nvoid main()\n{\n    v_Texcoord = texcoord;\n    gl_Position = worldViewProjection * vec4(position, 1.0);\n}\n\n@end';});


define('qtek/shader/source/compositor/coloradjust.essl',[],function () { return '@export buildin.compositor.coloradjust\n\nvarying vec2 v_Texcoord;\nuniform sampler2D texture;\n\nuniform float brightness : 0.0;\nuniform float contrast : 1.0;\nuniform float exposure : 0.0;\nuniform float gamma : 1.0;\nuniform float saturation : 1.0;\n\n// Values from "Graphics Shaders: Theory and Practice" by Bailey and Cunningham\nconst vec3 w = vec3(0.2125, 0.7154, 0.0721);\n\nvoid main()\n{\n    vec4 tex = texture2D( texture, v_Texcoord);\n\n    // brightness\n    vec3 color = clamp(tex.rgb + vec3(brightness), 0.0, 1.0);\n    // contrast\n    color = clamp( (color-vec3(0.5))*contrast+vec3(0.5), 0.0, 1.0);\n    // exposure\n    color = clamp( color * pow(2.0, exposure), 0.0, 1.0);\n    // gamma\n    color = clamp( pow(color, vec3(gamma)), 0.0, 1.0);\n    // saturation\n    float luminance = dot( color, w );\n    color = mix(vec3(luminance), color, saturation);\n    \n    gl_FragColor = vec4(color, tex.a);\n}\n\n@end\n\n// Seperate shader for float texture\n@export buildin.compositor.brightness\nvarying vec2 v_Texcoord;\nuniform sampler2D texture;\n\nuniform float brightness : 0.0;\n\nvoid main()\n{\n    vec4 tex = texture2D( texture, v_Texcoord);\n    vec3 color = tex.rgb + vec3(brightness);\n    gl_FragColor = vec4(color, tex.a);\n}\n@end\n\n@export buildin.compositor.contrast\nvarying vec2 v_Texcoord;\nuniform sampler2D texture;\n\nuniform float contrast : 1.0;\n\nvoid main()\n{\n    vec4 tex = texture2D( texture, v_Texcoord);\n    vec3 color = (tex.rgb-vec3(0.5))*contrast+vec3(0.5);\n    gl_FragColor = vec4(color, tex.a);\n}\n@end\n\n@export buildin.compositor.exposure\nvarying vec2 v_Texcoord;\nuniform sampler2D texture;\n\nuniform float exposure : 0.0;\n\nvoid main()\n{\n    vec4 tex = texture2D(texture, v_Texcoord);\n    vec3 color = tex.rgb * pow(2.0, exposure);\n    gl_FragColor = vec4(color, tex.a);\n}\n@end\n\n@export buildin.compositor.gamma\nvarying vec2 v_Texcoord;\nuniform sampler2D texture;\n\nuniform float gamma : 1.0;\n\nvoid main()\n{\n    vec4 tex = texture2D(texture, v_Texcoord);\n    vec3 color = pow(tex.rgb, vec3(gamma));\n    gl_FragColor = vec4(color, tex.a);\n}\n@end\n\n@export buildin.compositor.saturation\nvarying vec2 v_Texcoord;\nuniform sampler2D texture;\n\nuniform float saturation : 1.0;\n\nconst vec3 w = vec3(0.2125, 0.7154, 0.0721);\n\nvoid main()\n{\n    vec4 tex = texture2D(texture, v_Texcoord);\n    vec3 color = tex.rgb;\n    float luminance = dot(color, w);\n    color = mix(vec3(luminance), color, saturation);\n    gl_FragColor = vec4(color, tex.a);\n}\n@end';});


define('qtek/shader/source/compositor/blur.essl',[],function () { return '@export buildin.compositor.gaussian_blur_h\n\nuniform sampler2D texture; // the texture with the scene you want to blur\nvarying vec2 v_Texcoord;\n \nuniform float blurSize : 2.0; \nuniform float textureWidth : 512.0;\n\nvoid main(void)\n{\n   vec4 sum = vec4(0.0);\n   float blurOffset = blurSize / textureWidth;\n   // blur in y (vertical)\n   // take nine samples, with the distance blurSize between them\n   sum += texture2D(texture, vec2(max(v_Texcoord.x - 4.0*blurOffset, 0.0), v_Texcoord.y)) * 0.05;\n   sum += texture2D(texture, vec2(max(v_Texcoord.x - 3.0*blurOffset, 0.0), v_Texcoord.y)) * 0.09;\n   sum += texture2D(texture, vec2(max(v_Texcoord.x - 2.0*blurOffset, 0.0), v_Texcoord.y)) * 0.12;\n   sum += texture2D(texture, vec2(max(v_Texcoord.x - blurOffset, 0.0), v_Texcoord.y)) * 0.15;\n   sum += texture2D(texture, vec2(v_Texcoord.x, v_Texcoord.y)) * 0.18;\n   sum += texture2D(texture, vec2(min(v_Texcoord.x + blurOffset, 1.0), v_Texcoord.y)) * 0.15;\n   sum += texture2D(texture, vec2(min(v_Texcoord.x + 2.0*blurOffset, 1.0), v_Texcoord.y)) * 0.12;\n   sum += texture2D(texture, vec2(min(v_Texcoord.x + 3.0*blurOffset, 1.0), v_Texcoord.y)) * 0.09;\n   sum += texture2D(texture, vec2(min(v_Texcoord.x + 4.0*blurOffset, 1.0), v_Texcoord.y)) * 0.05;\n \n   gl_FragColor = sum;\n}\n\n@end\n\n@export buildin.compositor.gaussian_blur_v\n\nuniform sampler2D texture;\nvarying vec2 v_Texcoord;\n \nuniform float blurSize : 2.0;\nuniform float textureHeight : 512.0;\n \nvoid main(void)\n{\n   vec4 sum = vec4(0.0);\n   float blurOffset = blurSize / textureHeight;\n   // blur in y (vertical)\n   // take nine samples, with the distance blurSize between them\n   sum += texture2D(texture, vec2(v_Texcoord.x, max(v_Texcoord.y - 4.0*blurOffset, 0.0))) * 0.05;\n   sum += texture2D(texture, vec2(v_Texcoord.x, max(v_Texcoord.y - 3.0*blurOffset, 0.0))) * 0.09;\n   sum += texture2D(texture, vec2(v_Texcoord.x, max(v_Texcoord.y - 2.0*blurOffset, 0.0))) * 0.12;\n   sum += texture2D(texture, vec2(v_Texcoord.x, max(v_Texcoord.y - blurOffset, 0.0))) * 0.15;\n   sum += texture2D(texture, vec2(v_Texcoord.x, v_Texcoord.y)) * 0.18;\n   sum += texture2D(texture, vec2(v_Texcoord.x, min(v_Texcoord.y + blurOffset, 1.0))) * 0.15;\n   sum += texture2D(texture, vec2(v_Texcoord.x, min(v_Texcoord.y + 2.0*blurOffset, 1.0))) * 0.12;\n   sum += texture2D(texture, vec2(v_Texcoord.x, min(v_Texcoord.y + 3.0*blurOffset, 1.0))) * 0.09;\n   sum += texture2D(texture, vec2(v_Texcoord.x, min(v_Texcoord.y + 4.0*blurOffset, 1.0))) * 0.05;\n \n   gl_FragColor = sum;\n}\n\n@end\n\n@export buildin.compositor.box_blur\n\nuniform sampler2D texture;\nvarying vec2 v_Texcoord;\n\nuniform float blurSize : 3.0;\nuniform vec2 textureSize : [512.0, 512.0];\n\nvoid main(void){\n\n   vec4 tex = texture2D(texture, v_Texcoord);\n   vec2 offset = blurSize / textureSize;\n\n   tex += texture2D(texture, v_Texcoord + vec2(offset.x, 0.0) );\n   tex += texture2D(texture, v_Texcoord + vec2(offset.x, offset.y) );\n   tex += texture2D(texture, v_Texcoord + vec2(-offset.x, offset.y) );\n   tex += texture2D(texture, v_Texcoord + vec2(0.0, offset.y) );\n   tex += texture2D(texture, v_Texcoord + vec2(-offset.x, 0.0) );\n   tex += texture2D(texture, v_Texcoord + vec2(-offset.x, -offset.y) );\n   tex += texture2D(texture, v_Texcoord + vec2(offset.x, -offset.y) );\n   tex += texture2D(texture, v_Texcoord + vec2(0.0, -offset.y) );\n\n   tex /= 9.0;\n\n   gl_FragColor = tex;\n}\n\n@end\n\n// http://www.slideshare.net/DICEStudio/five-rendering-ideas-from-battlefield-3-need-for-speed-the-run\n@export buildin.compositor.hexagonal_blur_mrt_1\n\n// MRT in chrome\n// https://www.khronos.org/registry/webgl/sdk/tests/conformance/extensions/webgl-draw-buffers.html\n#extension GL_EXT_draw_buffers : require\n\nuniform sampler2D texture;\nvarying vec2 v_Texcoord;\n\nuniform float blurSize : 2.0;\n\nuniform vec2 textureSize : [512.0, 512.0];\n\nvoid main(void){\n   vec2 offset = blurSize / textureSize;\n\n   vec4 color = vec4(0.0);\n   // Top\n   for(int i = 0; i < 10; i++){\n      color += 1.0/10.0 * texture2D(texture, v_Texcoord + vec2(0.0, offset.y * float(i)) );\n   }\n   gl_FragData[0] = color;\n   vec4 color2 = vec4(0.0);\n   // Down left\n   for(int i = 0; i < 10; i++){\n      color2 += 1.0/10.0 * texture2D(texture, v_Texcoord - vec2(offset.x * float(i), offset.y * float(i)) );\n   }\n   gl_FragData[1] = (color + color2) / 2.0;\n}\n\n@end\n\n@export buildin.compositor.hexagonal_blur_mrt_2\n\nuniform sampler2D texture0;\nuniform sampler2D texture1;\n\nvarying vec2 v_Texcoord;\n\nuniform float blurSize : 2.0;\n\nuniform vec2 textureSize : [512.0, 512.0];\n\nvoid main(void){\n   vec2 offset = blurSize / textureSize;\n\n   vec4 color1 = vec4(0.0);\n   // Down left\n   for(int i = 0; i < 10; i++){\n      color1 += 1.0/10.0 * texture2D(texture0, v_Texcoord - vec2(offset.x * float(i), offset.y * float(i)) );\n   }\n   vec4 color2 = vec4(0.0);\n   // Down right\n   for(int i = 0; i < 10; i++){\n      color2 += 1.0/10.0 * texture2D(texture1, v_Texcoord + vec2(offset.x * float(i), -offset.y * float(i)) );\n   }\n\n   gl_FragColor = (color1 + color2) / 2.0;\n}\n\n@end\n\n\n@export buildin.compositor.hexagonal_blur_1\n\n#define KERNEL_SIZE 10\n\nuniform sampler2D texture;\nvarying vec2 v_Texcoord;\n\nuniform float blurSize : 1.0;\n\nuniform vec2 textureSize : [512.0, 512.0];\n\nvoid main(void){\n   vec2 offset = blurSize / textureSize;\n\n   vec4 color = vec4(0.0);\n   float fKernelSize = float(KERNEL_SIZE);\n   // Top\n   for(int i = 0; i < KERNEL_SIZE; i++){\n      color += 1.0 / fKernelSize * texture2D(texture, v_Texcoord + vec2(0.0, offset.y * float(i)) );\n   }\n   gl_FragColor = color;\n}\n\n@end\n\n@export buildin.compositor.hexagonal_blur_2\n\n#define KERNEL_SIZE 10\n\nuniform sampler2D texture;\nvarying vec2 v_Texcoord;\n\nuniform float blurSize : 1.0;\n\nuniform vec2 textureSize : [512.0, 512.0];\n\nvoid main(void){\n   vec2 offset = blurSize / textureSize;\n   offset.y /= 2.0;\n\n   vec4 color = vec4(0.0);\n   float fKernelSize = float(KERNEL_SIZE);\n   // Down left\n   for(int i = 0; i < KERNEL_SIZE; i++){\n      color += 1.0/fKernelSize * texture2D(texture, v_Texcoord - vec2(offset.x * float(i), offset.y * float(i)) );\n   }\n   gl_FragColor = color;\n}\n@end\n\n@export buildin.compositor.hexagonal_blur_3\n\n#define KERNEL_SIZE 10\n\nuniform sampler2D texture1;\nuniform sampler2D texture2;\n\nvarying vec2 v_Texcoord;\n\nuniform float blurSize : 1.0;\n\nuniform vec2 textureSize : [512.0, 512.0];\n\nvoid main(void){\n   vec2 offset = blurSize / textureSize;\n   offset.y /= 2.0;\n\n   vec4 color1 = vec4(0.0);\n   float fKernelSize = float(KERNEL_SIZE);\n   // Down left\n   for(int i = 0; i < KERNEL_SIZE; i++){\n      color1 += 1.0/fKernelSize * texture2D(texture1, v_Texcoord - vec2(offset.x * float(i), offset.y * float(i)) );\n   }\n   vec4 color2 = vec4(0.0);\n   // Down right\n   for(int i = 0; i < KERNEL_SIZE; i++){\n      color2 += 1.0/fKernelSize * texture2D(texture1, v_Texcoord + vec2(offset.x * float(i), -offset.y * float(i)) );\n   }\n\n   vec4 color3 = vec4(0.0);\n   // Down right\n   for(int i = 0; i < KERNEL_SIZE; i++){\n      color3 += 1.0/fKernelSize * texture2D(texture2, v_Texcoord + vec2(offset.x * float(i), -offset.y * float(i)) );\n   }\n\n   gl_FragColor = (color1 + color2 + color3) / 3.0;\n}\n\n@end';});


define('qtek/shader/source/compositor/lum.essl',[],function () { return '\n@export buildin.compositor.lum\n\nvarying vec2 v_Texcoord;\n\nuniform sampler2D texture;\n\nconst vec3 w = vec3(0.2125, 0.7154, 0.0721);\n\nvoid main()\n{\n    vec4 tex = texture2D( texture, v_Texcoord );\n    float luminance = dot(tex.rgb, w);\n\n    gl_FragColor = vec4(vec3(luminance), 1.0);\n}\n\n@end';});


define('qtek/shader/source/compositor/lut.essl',[],function () { return '\n// https://github.com/BradLarson/GPUImage?source=c\n@export buildin.compositor.lut\n\nvarying vec2 v_Texcoord;\n\nuniform sampler2D texture;\nuniform sampler2D lookup;\n\nvoid main()\n{\n    vec4 tex = texture2D(texture, v_Texcoord);\n\n    float blueColor = tex.b * 63.0;\n    \n    vec2 quad1;\n    quad1.y = floor(floor(blueColor) / 8.0);\n    quad1.x = floor(blueColor) - (quad1.y * 8.0);\n    \n    vec2 quad2;\n    quad2.y = floor(ceil(blueColor) / 8.0);\n    quad2.x = ceil(blueColor) - (quad2.y * 8.0);\n    \n    vec2 texPos1;\n    texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.r);\n    texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.g);\n    \n    vec2 texPos2;\n    texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.r);\n    texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * tex.g);\n    \n    vec4 newColor1 = texture2D(lookup, texPos1);\n    vec4 newColor2 = texture2D(lookup, texPos2);\n    \n    vec4 newColor = mix(newColor1, newColor2, fract(blueColor));\n    gl_FragColor = vec4(newColor.rgb, tex.w);\n}\n\n@end';});


define('qtek/shader/source/compositor/output.essl',[],function () { return '@export buildin.compositor.output\n\n#define OUTPUT_ALPHA;\n\nvarying vec2 v_Texcoord;\n\nuniform sampler2D texture;\n\nvoid main()\n{\n    vec4 tex = texture2D(texture, v_Texcoord);\n\n    gl_FragColor.rgb = tex.rgb;\n\n    #ifdef OUTPUT_ALPHA\n        gl_FragColor.a = tex.a;\n    #else\n        gl_FragColor.a = 1.0;\n    #endif\n\n}\n\n@end';});


define('qtek/shader/source/compositor/hdr.essl',[],function () { return '// HDR Pipeline\n@export buildin.compositor.hdr.bright\n\nuniform sampler2D texture;\nuniform float threshold : 1;\nuniform float scale : 1.0;\n\nvarying vec2 v_Texcoord;\n\nconst vec3 lumWeight = vec3(0.2125, 0.7154, 0.0721);\n\n@import buildin.util.rgbm_decode\n@import buildin.util.rgbm_encode\n\nvoid main()\n{\n    #ifdef TEXTURE_ENABLED\n        #ifdef RGBM_DECODE\n            vec3 tex = RGBMDecode(texture2D(texture, v_Texcoord));\n        #else\n            vec3 tex = texture2D(texture, v_Texcoord).rgb;\n        #endif\n    #else\n        vec3 tex = vec3(0.0);\n    #endif\n\n    float lum = dot(tex, lumWeight);\n    if (lum > threshold)\n    {\n        gl_FragColor.rgb = tex * scale;\n    }\n    else\n    {\n        gl_FragColor.rgb = vec3(0.0);\n    }\n    gl_FragColor.a = 1.0;\n\n    #ifdef RGBM_ENCODE\n        gl_FragColor.rgba = RGBMEncode(gl_FragColor.rgb);\n    #endif\n}\n@end\n\n@export buildin.compositor.hdr.log_lum\n\nvarying vec2 v_Texcoord;\n\nuniform sampler2D texture;\n\nconst vec3 w = vec3(0.2125, 0.7154, 0.0721);\n\nvoid main()\n{\n    vec4 tex = texture2D(texture, v_Texcoord);\n    float luminance = dot(tex.rgb, w);\n    luminance = log(luminance + 0.001);\n\n    gl_FragColor = vec4(vec3(luminance), 1.0);\n}\n\n@end\n\n@export buildin.compositor.hdr.lum_adaption\nvarying vec2 v_Texcoord;\n\nuniform sampler2D adaptedLum;\nuniform sampler2D currentLum;\n\nuniform float frameTime : 0.02;\n\nvoid main()\n{\n    float fAdaptedLum = texture2D(adaptedLum, vec2(0.5, 0.5)).r;\n    float fCurrentLum = exp(texture2D(currentLum, vec2(0.5, 0.5)).r);\n\n    fAdaptedLum += (fCurrentLum - fAdaptedLum) * (1.0 - pow(0.98, 30.0 * frameTime));\n    gl_FragColor.rgb = vec3(fAdaptedLum);\n    gl_FragColor.a = 1.0;\n}\n@end\n\n// Tone mapping with gamma correction\n// http://filmicgames.com/archives/75\n@export buildin.compositor.hdr.tonemapping\n\nuniform sampler2D texture;\nuniform sampler2D bloom;\nuniform sampler2D lensflare;\nuniform sampler2D lum;\n\nuniform float exposure : 1.0;\n\nvarying vec2 v_Texcoord;\n\nconst float A = 0.22;   // Shoulder Strength\nconst float B = 0.30;   // Linear Strength\nconst float C = 0.10;   // Linear Angle\nconst float D = 0.20;   // Toe Strength\nconst float E = 0.01;   // Toe Numerator\nconst float F = 0.30;   // Toe Denominator\nconst vec3 whiteScale = vec3(11.2);\n\nvec3 uncharted2ToneMap(vec3 x)\n{\n    return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;\n}\n\nvec3 filmicToneMap(vec3 color)\n{\n    vec3 x = max(vec3(0.0), color - 0.004);\n    return (x*(6.2*x+0.5))/(x*(6.2*x+1.7)+0.06);\n}\n\nfloat eyeAdaption(float fLum)\n{\n    return mix(0.2, fLum, 0.5);\n}\n\nvoid main()\n{\n    vec3 tex = vec3(0.0);\n    float a = 1.0;\n    #ifdef TEXTURE_ENABLED\n        vec4 res = texture2D(texture, v_Texcoord);\n        a = res.a;\n        tex = res.rgb;\n    #endif\n\n    #ifdef BLOOM_ENABLED\n        tex += texture2D(bloom, v_Texcoord).rgb * 0.25;\n    #endif\n\n    #ifdef LENSFLARE_ENABLED\n        tex += texture2D(lensflare, v_Texcoord).rgb;\n    #endif\n\n    // Adjust exposure\n    // From KlayGE\n    #ifdef LUM_ENABLED\n        float fLum = texture2D(lum, vec2(0.5, 0.5)).r;\n        float adaptedLumDest = 3.0 / (max(0.1, 1.0 + 10.0*eyeAdaption(fLum)));\n        float exposureBias = adaptedLumDest * exposure;\n    #else\n        float exposureBias = exposure;\n    #endif\n    tex *= exposureBias;\n\n    // Do tone mapping\n    vec3 color = uncharted2ToneMap(tex) / uncharted2ToneMap(whiteScale);\n    color = pow(color, vec3(1.0/2.2));\n    // vec3 color = filmicToneMap(tex);\n\n    #ifdef RGBM_ENCODE\n        gl_FragColor.rgba = RGBMEncode(color);\n    #else\n        gl_FragColor = vec4(color, a);\n    #endif\n}\n\n@end';});


define('qtek/shader/source/compositor/lensflare.essl',[],function () { return '// john-chapman-graphics.blogspot.co.uk/2013/02/pseudo-lens-flare.html\n@export buildin.compositor.lensflare\n\n#define SAMPLE_NUMBER 8\n\nuniform sampler2D texture;\nuniform sampler2D lensColor;\n\nuniform vec2 textureSize : [512, 512];\n\nuniform float dispersal : 0.3;\nuniform float haloWidth : 0.4;\nuniform float distortion : 1.0;\n\nvarying vec2 v_Texcoord;\n\nvec4 textureDistorted(\n    in vec2 texcoord,\n    in vec2 direction,\n    in vec3 distortion\n) {\n    return vec4(\n        texture2D(texture, texcoord + direction * distortion.r).r,\n        texture2D(texture, texcoord + direction * distortion.g).g,\n        texture2D(texture, texcoord + direction * distortion.b).b,\n        1.0\n    );\n}\n\nvoid main()\n{\n    vec2 texcoord = -v_Texcoord + vec2(1.0); // Flip texcoords\n    vec2 textureOffset = 1.0 / textureSize;\n\n    vec2 ghostVec = (vec2(0.5) - texcoord) * dispersal;\n    vec2 haloVec = normalize(ghostVec) * haloWidth;\n\n    vec3 distortion = vec3(-textureOffset.x * distortion, 0.0, textureOffset.x * distortion);\n    //Sample ghost\n    vec4 result = vec4(0.0);\n    for (int i = 0; i < SAMPLE_NUMBER; i++)\n    {\n        vec2 offset = fract(texcoord + ghostVec * float(i));\n\n        float weight = length(vec2(0.5) - offset) / length(vec2(0.5));\n        weight = pow(1.0 - weight, 10.0);\n\n        result += textureDistorted(offset, normalize(ghostVec), distortion) * weight;\n    }\n\n    result *= texture2D(lensColor, vec2(length(vec2(0.5) - texcoord)) / length(vec2(0.5)));\n    //Sample halo\n    float weight = length(vec2(0.5) - fract(texcoord + haloVec)) / length(vec2(0.5));\n    weight = pow(1.0 - weight, 10.0);\n    vec2 offset = fract(texcoord + haloVec);\n    result += textureDistorted(offset, normalize(ghostVec), distortion) * weight;\n\n    gl_FragColor = result;\n}\n@end';});


define('qtek/shader/source/compositor/blend.essl',[],function () { return '@export buildin.compositor.blend\n// Blend at most 4 textures\n#ifdef TEXTURE1_ENABLED\nuniform sampler2D texture1;\nuniform float weight1 : 1.0;\n#endif\n#ifdef TEXTURE2_ENABLED\nuniform sampler2D texture2;\nuniform float weight2 : 1.0;\n#endif\n#ifdef TEXTURE3_ENABLED\nuniform sampler2D texture3;\nuniform float weight3 : 1.0;\n#endif\n#ifdef TEXTURE4_ENABLED\nuniform sampler2D texture4;\nuniform float weight4 : 1.0;\n#endif\n\nvarying vec2 v_Texcoord;\n\nvoid main()\n{\n    vec3 tex = vec3(0.0);\n    #ifdef TEXTURE1_ENABLED\n        tex += texture2D(texture1, v_Texcoord).rgb * weight1;\n    #endif\n    #ifdef TEXTURE2_ENABLED\n        tex += texture2D(texture2, v_Texcoord).rgb * weight2;\n    #endif\n    #ifdef TEXTURE3_ENABLED\n        tex += texture2D(texture3, v_Texcoord).rgb * weight3;\n    #endif\n    #ifdef TEXTURE4_ENABLED\n        tex += texture2D(texture4, v_Texcoord).rgb * weight4;\n    #endif\n\n    gl_FragColor = vec4(tex, 1.0);\n}\n@end';});


define('qtek/shader/source/compositor/fxaa.essl',[],function () { return '// https://github.com/mitsuhiko/webgl-meincraft/blob/master/assets/shaders/fxaa.glsl\n@export buildin.compositor.fxaa\n\nuniform sampler2D texture;\nuniform vec2 viewportSize : [512, 512];\n\nvarying vec2 v_Texcoord;\n\n#define FXAA_REDUCE_MIN   (1.0/128.0)\n#define FXAA_REDUCE_MUL   (1.0/8.0)\n#define FXAA_SPAN_MAX     8.0\n\nvoid main()\n{\n    vec2 resolution = 1.0 / viewportSize;\n    vec3 rgbNW = texture2D( texture, ( gl_FragCoord.xy + vec2( -1.0, -1.0 ) ) * resolution ).xyz;\n    vec3 rgbNE = texture2D( texture, ( gl_FragCoord.xy + vec2( 1.0, -1.0 ) ) * resolution ).xyz;\n    vec3 rgbSW = texture2D( texture, ( gl_FragCoord.xy + vec2( -1.0, 1.0 ) ) * resolution ).xyz;\n    vec3 rgbSE = texture2D( texture, ( gl_FragCoord.xy + vec2( 1.0, 1.0 ) ) * resolution ).xyz;\n    vec4 rgbaM  = texture2D( texture,  gl_FragCoord.xy  * resolution );\n    vec3 rgbM  = rgbaM.xyz;\n    float opacity  = rgbaM.w;\n\n    vec3 luma = vec3( 0.299, 0.587, 0.114 );\n\n    float lumaNW = dot( rgbNW, luma );\n    float lumaNE = dot( rgbNE, luma );\n    float lumaSW = dot( rgbSW, luma );\n    float lumaSE = dot( rgbSE, luma );\n    float lumaM  = dot( rgbM,  luma );\n    float lumaMin = min( lumaM, min( min( lumaNW, lumaNE ), min( lumaSW, lumaSE ) ) );\n    float lumaMax = max( lumaM, max( max( lumaNW, lumaNE) , max( lumaSW, lumaSE ) ) );\n\n    vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\n    float dirReduce = max( ( lumaNW + lumaNE + lumaSW + lumaSE ) * ( 0.25 * FXAA_REDUCE_MUL ), FXAA_REDUCE_MIN );\n\n    float rcpDirMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + dirReduce );\n    dir = min( vec2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX),\n          max( vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n                dir * rcpDirMin)) * resolution;\n\n    vec3 rgbA = texture2D( texture, gl_FragCoord.xy  * resolution + dir * ( 1.0 / 3.0 - 0.5 ) ).xyz;\n    rgbA += texture2D( texture, gl_FragCoord.xy  * resolution + dir * ( 2.0 / 3.0 - 0.5 ) ).xyz;\n    rgbA *= 0.5;\n\n    vec3 rgbB = texture2D( texture, gl_FragCoord.xy  * resolution + dir * -0.5 ).xyz;\n    rgbB += texture2D( texture, gl_FragCoord.xy  * resolution + dir * 0.5 ).xyz;\n    rgbB *= 0.25;\n    rgbB += rgbA * 0.5;\n\n    float lumaB = dot( rgbB, luma );\n\n    if ( ( lumaB < lumaMin ) || ( lumaB > lumaMax ) )\n    {\n\n        gl_FragColor = vec4( rgbA, opacity );\n\n    } else {\n\n        gl_FragColor = vec4( rgbB, opacity );\n\n    }\n}\n\n@end';});

/**
 * @export{Object} library
 */
define('qtek/shader/library',['require','../Shader','../core/util','./source/basic.essl','./source/lambert.essl','./source/phong.essl','./source/physical.essl','./source/wireframe.essl','./source/skybox.essl','./source/util.essl','./source/prez.essl','./source/shadowmap.essl','./source/compositor/vertex.essl','./source/compositor/coloradjust.essl','./source/compositor/blur.essl','./source/compositor/lum.essl','./source/compositor/lut.essl','./source/compositor/output.essl','./source/compositor/hdr.essl','./source/compositor/lensflare.essl','./source/compositor/blend.essl','./source/compositor/fxaa.essl'],function(require) {

    var Shader = require("../Shader");
    var util = require('../core/util');

    _library = {};

    _pool = {};

    /** 
     * ### Builin shaders
     * + buildin.basic
     * + buildin.lambert
     * + buildin.phong
     * + buildin.physical
     * + buildin.wireframe
     * 
     * @namespace qtek.shader.library
     */
    /**
     *
     * Get shader from library. use shader name and option as hash key.
     * 
     * @param {string} name
     * @param {Object|string|Array.<string>} [option]
     * @return {qtek.Shader}
     * 
     * @memberOf qtek.shader.library
     * @example
     *     qtek.shader.library.get("buildin.phong", "diffuseMap", "normalMap");
     *     qtek.shader.library.get("buildin.phong", ["diffuseMap", "normalMap"]);
     *     qtek.shader.library.get("buildin.phong", {
     *         textures : ["diffuseMap"],
     *         vertexDefines : {},
     *         fragmentDefines : {}
     *     });
     */
    function get(name, option) {
        var enabledTextures = [];
        var vertexDefines = {};
        var fragmentDefines = {};
        if (typeof(option) === "string") {
            enabledTextures = Array.prototype.slice.call(arguments, 1);
        }
        else if (Object.prototype.toString.call(option) == '[object Object]') {
            enabledTextures = option.textures || [];
            vertexDefines = option.vertexDefines || {};
            fragmentDefines = option.fragmentDefines || {};
        } 
        else if(option instanceof Array) {
            enabledTextures = option;
        }
        var vertexDefineKeys = Object.keys(vertexDefines);
        var fragmentDefineKeys = Object.keys(fragmentDefines);
        enabledTextures.sort(); 
        vertexDefineKeys.sort();
        fragmentDefineKeys.sort();

        var keyArr = [name];
        keyArr = keyArr.concat(enabledTextures);
        for (var i = 0; i < vertexDefineKeys.length; i++) {
            keyArr.push(vertexDefines[vertexDefineKeys[i]]);
        }
        for (var i = 0; i < fragmentDefineKeys.length; i++) {
            keyArr.push(fragmentDefines[fragmentDefineKeys[i]]);
        }
        var key = keyArr.join('_');

        if (_pool[key]) {
            return _pool[key];
        } else {
            var source = _library[name];
            if (!source) {
                console.error('Shader "'+name+'"'+' is not in the library');
                return;
            }
            var shader = new Shader({
                "vertex" : source.vertex,
                "fragment" : source.fragment
            });
            for (var i = 0; i < enabledTextures.length; i++) {
                shader.enableTexture(enabledTextures[i]);
            }
            for (var name in vertexDefines) {
                shader.define('vertex', name, vertexDefines[name]);
            }
            for (var name in fragmentDefines) {
                shader.define('fragment', name, fragmentDefines[name]);
            }
            _pool[key] = shader;
            return shader;
        }
    }

    /**
     * @memberOf qtek.shader.library
     * @param  {string} name
     * @param  {string} vertex - Vertex shader code
     * @param  {string} fragment - Fragment shader code
     */
    function template(name, vertex, fragment) {
        _library[name] = {
            vertex : vertex,
            fragment : fragment
        }
    }

    /**
     * @memberOf qtek.shader.library
     */
    function clear() {
        _pool = {};
    }

    // Some build in shaders
    Shader['import'](require('./source/basic.essl'));
    Shader['import'](require('./source/lambert.essl'));
    Shader['import'](require('./source/phong.essl'));
    Shader['import'](require('./source/physical.essl'));
    Shader['import'](require('./source/wireframe.essl'));
    Shader['import'](require('./source/skybox.essl'));
    Shader['import'](require('./source/util.essl'));
    Shader['import'](require('./source/prez.essl'));

    Shader['import'](require('./source/shadowmap.essl'));

    template("buildin.basic", Shader.source("buildin.basic.vertex"), Shader.source("buildin.basic.fragment"));
    template("buildin.lambert", Shader.source("buildin.lambert.vertex"), Shader.source("buildin.lambert.fragment"));
    template("buildin.phong", Shader.source("buildin.phong.vertex"), Shader.source("buildin.phong.fragment"));
    template("buildin.wireframe", Shader.source("buildin.wireframe.vertex"), Shader.source("buildin.wireframe.fragment"));
    template("buildin.skybox", Shader.source("buildin.skybox.vertex"), Shader.source("buildin.skybox.fragment"));
    template("buildin.prez", Shader.source("buildin.prez.vertex"), Shader.source("buildin.prez.fragment"));
    template("buildin.physical", Shader.source("buildin.physical.vertex"), Shader.source("buildin.physical.fragment"));

    // Some build in shaders
    Shader['import'](require('./source/compositor/vertex.essl'));
    Shader['import'](require('./source/compositor/coloradjust.essl'));
    Shader['import'](require('./source/compositor/blur.essl'));
    Shader['import'](require('./source/compositor/lum.essl'));
    Shader['import'](require('./source/compositor/lut.essl'));
    Shader['import'](require('./source/compositor/output.essl'));
    Shader['import'](require('./source/compositor/hdr.essl'));
    Shader['import'](require('./source/compositor/lensflare.essl'));
    Shader['import'](require('./source/compositor/blend.essl'));
    Shader['import'](require('./source/compositor/fxaa.essl'));

    return {
        get : get,
        template : template,
        clear: clear
    }
});
define('qtek/texture/TextureCube',['require','../Texture','../core/glinfo','../core/glenum','../core/util'],function(require) {

    var Texture = require('../Texture');
    var glinfo = require('../core/glinfo');
    var glenum = require('../core/glenum');
    var util = require('../core/util');

    var targetMap = {
        'px' : 'TEXTURE_CUBE_MAP_POSITIVE_X',
        'py' : 'TEXTURE_CUBE_MAP_POSITIVE_Y',
        'pz' : 'TEXTURE_CUBE_MAP_POSITIVE_Z',
        'nx' : 'TEXTURE_CUBE_MAP_NEGATIVE_X',
        'ny' : 'TEXTURE_CUBE_MAP_NEGATIVE_Y',
        'nz' : 'TEXTURE_CUBE_MAP_NEGATIVE_Z',
    }

    /**
     * @constructor qtek.texture.TextureCube
     * @extends qtek.Texture
     *
     * @example
     *     ...
     *     var mat = new qtek.Material({
     *         shader: qtek.shader.library.get('buildin.phong', 'environmentMap')
     *     });
     *     var envMap = new qtek.texture.TextureCube();
     *     envMap.load({
     *         'px': 'assets/textures/sky/px.jpg',
     *         'nx': 'assets/textures/sky/nx.jpg'
     *         'py': 'assets/textures/sky/py.jpg'
     *         'ny': 'assets/textures/sky/ny.jpg'
     *         'pz': 'assets/textures/sky/pz.jpg'
     *         'nz': 'assets/textures/sky/nz.jpg'
     *     });
     *     mat.set('environmentMap', envMap);
     *     ...
     *     envMap.success(function() {
     *         // Wait for the sky texture loaded
     *         animation.on('frame', function(frameTime) {
     *             renderer.render(scene, camera);
     *         });
     *     });
     */
    var TextureCube = Texture.derive(function() {
        return /** @lends qtek.texture.TextureCube# */{
            /**
             * @type {Object}
             * @property {HTMLImageElement|HTMLCanvasElemnet} px
             * @property {HTMLImageElement|HTMLCanvasElemnet} nx
             * @property {HTMLImageElement|HTMLCanvasElemnet} py
             * @property {HTMLImageElement|HTMLCanvasElemnet} ny
             * @property {HTMLImageElement|HTMLCanvasElemnet} pz
             * @property {HTMLImageElement|HTMLCanvasElemnet} nz
             */
            image : {
                px : null,
                nx : null,
                py : null,
                ny : null,
                pz : null,
                nz : null
            },
            /**
             * @type {Object}
             * @property {Uint8Array} px
             * @property {Uint8Array} nx
             * @property {Uint8Array} py
             * @property {Uint8Array} ny
             * @property {Uint8Array} pz
             * @property {Uint8Array} nz
             */
            pixels : {
                px : null,
                nx : null,
                py : null,
                ny : null,
                pz : null,
                nz : null
            }
       }
    }, {
        update : function(_gl) {

            _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, this._cache.get("webgl_texture"));

            this.beforeUpdate(_gl);

            var glFormat = this.format;
            var glType = this.type;

            _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_S, this.wrapS);
            _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_T, this.wrapT);

            _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_MAG_FILTER, this.magFilter);
            _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_MIN_FILTER, this.minFilter);
            
            var anisotropicExt = glinfo.getExtension(_gl, "EXT_texture_filter_anisotropic");
            if (anisotropicExt && this.anisotropic > 1) {
                _gl.texParameterf(_gl.TEXTURE_CUBE_MAP, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic);
            }

            // Fallback to float type if browser don't have half float extension
            if (glType === 36193) {
                var halfFloatExt = glinfo.getExtension(_gl, 'OES_texture_half_float');
                if (!halfFloatExt) {
                    glType = glenum.FLOAT;
                }
            }

            for (var target in this.image) {
                var img = this.image[target];
                if (img) {
                    _gl.texImage2D(_gl[targetMap[target]], 0, glFormat, glFormat, glType, img);
                }
                else {
                    _gl.texImage2D(_gl[targetMap[target]], 0, glFormat, this.width, this.height, 0, glFormat, glType, this.pixels[target]);
                }
            }

            if (!this.NPOT && this.useMipmap) {
                _gl.generateMipmap(_gl.TEXTURE_CUBE_MAP);
            }

            _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, null);
        },
        /**
         * @param  {WebGLRenderingContext} _gl
         * @memberOf qtek.texture.TextureCube.prototype
         */
        generateMipmap : function(_gl) {
            _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, this._cache.get("webgl_texture"));
            _gl.generateMipmap(_gl.TEXTURE_CUBE_MAP);    
        },
        bind : function(_gl) {

            _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, this.getWebGLTexture(_gl));
        },
        unbind : function(_gl) {
            _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, null);
        },
        // Overwrite the isPowerOfTwo method
        isPowerOfTwo : function() {
            if (this.image.px) {
                return isPowerOfTwo(this.image.px.width)
                        && isPowerOfTwo(this.image.px.height);
            } else {
                return isPowerOfTwo(this.width)
                        && isPowerOfTwo(this.height);
            }

            function isPowerOfTwo(value) {
                return value & (value-1) === 0
            }
        },
        isRenderable : function() {
            if (this.image.px) {
                return isImageRenderable(this.image.px) &&
                       isImageRenderable(this.image.nx) &&
                       isImageRenderable(this.image.py) &&
                       isImageRenderable(this.image.ny) &&
                       isImageRenderable(this.image.pz) &&
                       isImageRenderable(this.image.nz);
            } else {
                return this.width && this.height;
            }
        },
        load : function(imageList) {
            var loading = 0;
            var self = this;
            util.each(imageList, function(src, target){
                var image = new Image();
                image.onload = function() {
                    loading --;
                    if (loading === 0){
                        self.dirty();
                        self.trigger("success", self);
                    }
                    image.onload = null;
                }
                image.onerror = function() {
                    loading --;
                    image.onerror = null;
                }
                
                loading++;
                image.src = src;
                self.image[target] = image;
            });

            return this;
        }
    });

    function isImageRenderable(image) {
        return image.nodeName === "CANVAS" ||
                image.complete;
    }

    return TextureCube;
});
define('qtek/Material',['require','./core/Base','./Shader','./core/util','./core/glenum','./Texture','./texture/Texture2D','./texture/TextureCube'],function(require) {

    var Base = require("./core/Base");
    var Shader = require("./Shader");
    var util = require("./core/util");
    var glenum = require("./core/glenum");
    var Texture = require('./Texture');
    var Texture2D = require('./texture/Texture2D');
    var TextureCube = require('./texture/TextureCube');

    /**
     * #constructor qtek.Material
     * @extends qtek.core.Base
     */
    var Material = Base.derive(
    /** @lends qtek.Material# */
    {
        /**
         * @type {string}
         */
        name : '',
        
        /**
         * @type {Object}
         */
        uniforms : null,

        /**
         * @type {qtek.Shader}
         */
        shader : null,

        /**
         * @type {boolean}
         */
        depthTest : true,

        /**
         * @type {boolean}
         */
        depthMask : true,

        /**
         * @type {boolean}
         */
        transparent : false,
        /**
         * Blend func is a callback function when the material 
         * have custom blending
         * The gl context will be the only argument passed in tho the
         * blend function
         * Detail of blend function in WebGL:
         * http://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf
         *
         * Example :
         * function(_gl) {
         *  _gl.blendEquation(_gl.FUNC_ADD);
         *  _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);
         * }
         */
        blend : null,

        // shadowTransparentMap : null

        _enabledUniforms : null,
    }, function() {
        if (!this.name) {
            this.name = 'MATERIAL_' + this.__GUID__;
        }
        if (this.shader) {
            this.attachShader(this.shader);
        }
    },
    /** @lends qtek.Material.prototype */
    {

        bind : function(_gl, prevMaterial) {

            var slot = 0;

            var sameShader = prevMaterial && prevMaterial.shader === this.shader;
            // Set uniforms
            for (var u = 0; u < this._enabledUniforms.length; u++) {
                var symbol = this._enabledUniforms[u];
                var uniform = this.uniforms[symbol];
                // When binding two materials with the same shader
                // Many uniforms will be be set twice even if they have the same value
                // So add a evaluation to see if the uniform is really needed to be set
                // 
                // TODO Small possibility enabledUniforms are not the same
                if (sameShader) {
                    if (prevMaterial.uniforms[symbol].value === uniform.value) {
                        continue;
                    }
                }

                if (uniform.value === undefined) {
                    console.warn('Uniform value "' + symbol + '" is undefined');
                    continue;
                }
                else if (uniform.value === null) {
                    // if (uniform.type == 't') {
                    //     // PENDING
                    //     _gl.bindTexture(_gl.TEXTURE_2D, null);
                    //     _gl.bindTexture(_gl.TEXTURE_CUBE, null);
                    // }
                    continue;
                }
                else if (uniform.value instanceof Array
                    && ! uniform.value.length) {
                    continue;
                }
                else if (uniform.value instanceof Texture) {
                    var res = this.shader.setUniform(_gl, '1i', symbol, slot);
                    if (!res) { // Texture is not enabled
                        continue;
                    }
                    var texture = uniform.value;
                    _gl.activeTexture(_gl.TEXTURE0 + slot);
                    // Maybe texture is not loaded yet;
                    if (texture.isRenderable()) {
                        texture.bind(_gl);
                    } else {
                        // Bind texture to null
                        texture.unbind(_gl);
                    }

                    slot++;
                }
                else if (uniform.value instanceof Array) {
                    if (uniform.value.length === 0) {
                        continue;
                    }
                    // Texture Array
                    var exampleValue = uniform.value[0];

                    if (exampleValue instanceof Texture) {
                        if (!this.shader.hasUniform(symbol)) {
                            continue;
                        }

                        var arr = [];
                        for (var i = 0; i < uniform.value.length; i++) {
                            var texture = uniform.value[i];
                            _gl.activeTexture(_gl.TEXTURE0 + slot);
                            // Maybe texture is not loaded yet;
                            if (texture.isRenderable()) {
                                texture.bind(_gl);
                            } else {
                                texture.unbind(_gl);
                            }

                            arr.push(slot++);
                        }

                        this.shader.setUniform(_gl, '1iv', symbol, arr);
                    } else {
                        this.shader.setUniform(_gl, uniform.type, symbol, uniform.value);
                    }
                }
                else{
                    this.shader.setUniform(_gl, uniform.type, symbol, uniform.value);
                }
            }
        },

        /**
         * @param {string} symbol
         * @param {number|array|qtek.Texture|ArrayBufferView} value
         */
        setUniform : function(symbol, value) {
            var uniform = this.uniforms[symbol];
            if (uniform) {
                uniform.value = value;
            }
        },

        /**
         * @param {Object} obj
         */
        setUniforms : function(obj) {
            for (var key in obj) {
                var val = obj[key];
                this.setUniform(key, val);
            }
        },

        /**
         * Enable a uniform
         * It only have effect on the uniform exists in shader. 
         * @param  {string} symbol
         */
        enableUniform : function(symbol) {
            if (this.uniforms[symbol] && !this.isUniformEnabled(symbol)) {
                this._enabledUniforms.push(symbol);
            }
        },

        /**
         * Disable a uniform
         * It will not affect the uniform state in the shader. Because the shader uniforms is parsed from shader code with naive regex. When using micro to disable some uniforms in the shader. It will still try to set these uniforms in each rendering pass. We can disable these uniforms manually if we need this bit performance improvement. Mostly we can simply ignore it.
         * @param  {string} symbol
         */
        disableUniform : function(symbol) {
            var idx = this._enabledUniforms.indexOf(symbol);
            if (idx >= 0) {
                this._enabledUniforms.splice(idx, 1);
            }
        },

        /**
         * @param  {string}  symbol
         * @return {boolean}
         */
        isUniformEnabled : function(symbol) {
            return this._enabledUniforms.indexOf(symbol) >= 0;
        },

        /**
         * Alias of setUniform and setUniforms
         * @param {object|string} symbol
         * @param {number|array|qtek.Texture|ArrayBufferView} [value]
         */
        set : function(symbol, value) {
            if (typeof(symbol) === 'object') {
                for (var key in symbol) {
                    var val = symbol[key];
                    this.set(key, val);
                }
            } else {
                var uniform = this.uniforms[symbol];
                if (uniform) {
                    uniform.value = value;
                }
            }
        },
        /**
         * Get uniform value
         * @param  {string} symbol
         * @return {number|array|qtek.Texture|ArrayBufferView}
         */
        get : function(symbol) {
            var uniform = this.uniforms[symbol];
            if (uniform) {
                return uniform.value;
            } else {
                // console.warn('Uniform '+symbol+' not exist');
            }
        },
        /**
         * Attach a shader instance
         * @param  {qtek.Shader} shader
         * @param  {boolean} keepUniform If try to keep uniform value
         */
        attachShader : function(shader, keepUniform) {
            var originalUniforms = this.uniforms;
            this.uniforms = shader.createUniforms();
            this.shader = shader;
            
            this._enabledUniforms = Object.keys(this.uniforms);

            if (keepUniform) {
                for (var symbol in originalUniforms) {
                    if (this.uniforms[symbol]) {
                        this.uniforms[symbol].value = originalUniforms[symbol].value;
                    }
                }
            }
        },

        /**
         * Detach a shader instance
         */
        detachShader : function() {
            this.shader = null;
            this.uniforms = {};
        },

        dispose : function() {
            //TODO
        }
    });

    return Material;
});
define('qtek/Renderer',['require','./core/Base','./core/util','./Light','./Mesh','./Texture','./core/glinfo','./core/glenum','./math/BoundingBox','./math/Matrix4','./Shader','./shader/library','./Material','./math/Vector3','./math/Vector2','glmatrix'],function(require) {

    var Base = require("./core/Base");
    var util = require("./core/util");
    var Light = require("./Light");
    var Mesh = require("./Mesh");
    var Texture = require("./Texture");
    var glinfo = require('./core/glinfo');
    var glenum = require('./core/glenum');
    var BoundingBox = require('./math/BoundingBox');
    var Matrix4 = require('./math/Matrix4');
    var Shader = require('./Shader');
    var shaderLibrary = require('./shader/library');
    var Material = require('./Material');
    var Vector3 = require('./math/Vector3');
    var Vector2 = require('./math/Vector2');

    var glMatrix = require("glmatrix");
    var mat4 = glMatrix.mat4;
    var vec3 = glMatrix.vec3;
    var vec4 = glMatrix.vec4;

    var glid = 0;

    var preZPassShader = shaderLibrary.get('buildin.prez');
    var preZPassMaterial = new Material({
        shader : preZPassShader
    });

    var errorShader = {};

    /**
     * @constructor qtek.Renderer
     */
    var Renderer = Base.derive(function() {
        return /** @lends qtek.Renderer# */ {

            /**
             * @type {HTMLCanvasElement}
             */
            canvas : null,

            /**
             * Canvas width, set by resize method
             * @type {number}
             * @readonly
             */
            width : 100,

            /**
             * Canvas width, set by resize method
             * @type {number}
             * @readonly
             */
            height : 100,

            /**
             * Device pixel ratio, set by setDevicePixelRatio method
             * Specially for high defination display
             * @see http://www.khronos.org/webgl/wiki/HandlingHighDPI
             * @type {number}
             * @readonly
             */
            devicePixelRatio : window.devicePixelRatio || 1.0,

            /**
             * Clear color
             * @type {number[]}
             */
            color : [0.0, 0.0, 0.0, 0.0],
            
            /**
             * Default:
             *     _gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT | _gl.STENCIL_BUFFER_BIT
             * @type {number}
             */
            clear : 17664,  

            // Settings when getting context
            // http://www.khronos.org/registry/webgl/specs/latest/#2.4

            /**
             * If enable alpha, default true
             * @type {boolean}
             */
            alhpa : true,
            /**
             * If enable depth buffer, default true
             * @type {boolean}
             */
            depth : true,
            /**
             * If enable stencil buffer, default false
             * @type {boolean}
             */
            stencil : false,
            /**
             * If enable antialias, default true
             * @type {boolean}
             */
            antialias : true,
            /**
             * If enable premultiplied alpha, default true
             * @type {boolean}
             */
            premultipliedAlpha : true,
            /**
             * If preserve drawing buffer, default false
             * @type {boolean}
             */
            preserveDrawingBuffer : false,
            /**
             * If throw context error, usually turned on in debug mode
             * @type {boolean}
             */
            throwError: true,
            /**
             * WebGL Context created from given canvas
             * @type {WebGLRenderingContext}
             */
            gl : null,
            /**
             * Renderer viewport, read-only, can be set by setViewport method
             * @type {{x: number, y: number, width: number, height: number}}
             */
            viewport : {},

            _viewportSettings : [],
            _clearSettings : [],

            _sceneRendering : null
        }
    }, function() {

        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
        try {
            var opts = {
                alhpa : this.alhpa,
                depth : this.depth,
                stencil : this.stencil,
                antialias : this.antialias,
                premultipliedAlpha : this.premultipliedAlpha,
                preserveDrawingBuffer : this.preserveDrawingBuffer
            }
            
            this.gl = this.canvas.getContext('webgl', opts)
                || this.canvas.getContext('experimental-webgl', opts);

            if (!this.gl) {
                throw new Error();
            }
            
            this.gl.__GLID__ = glid++;

            this.width = this.canvas.width; 
            this.height = this.canvas.height;
            this.resize(this.width, this.height);

            glinfo.initialize(this.gl);
        }
        catch(e) {
            if (this.throwError) {
                throw "Error creating WebGL Context";
            } else {
                this.trigger('error', "Error creating WebGL Context");
            }
        }
    },
    /** @lends qtek.Renderer.prototype. **/
    {
        /**
         * Resize the canvas
         * @param {number} width
         * @param {number} height
         */
        resize : function(width, height) {
            var canvas = this.canvas;
            // http://www.khronos.org/webgl/wiki/HandlingHighDPI
            // set the display size of the canvas.
            if (typeof(width) !== 'undefined') {
                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
                // set the size of the drawingBuffer
                canvas.width = width * this.devicePixelRatio;
                canvas.height = height * this.devicePixelRatio;

                this.width = width;
                this.height = height;
            } else {
                this.width = canvas.width / this.devicePixelRatio;
                this.height = canvas.height / this.devicePixelRatio;
            }

            this.setViewport(0, 0, canvas.width, canvas.height);
        },

        /**
         * Set devicePixelRatio
         * @param {number} devicePixelRatio
         */
        setDevicePixelRatio : function(devicePixelRatio) {
            this.devicePixelRatio = devicePixelRatio;
            this.resize(this.width, this.height);
        },

        /**
         * Set rendering viewport
         * @param {number|{x:number,y:number,width:number,height:number}} x
         * @param {number} [y]
         * @param {number} [width]
         * @param {number} [height]
         */
        setViewport : function(x, y, width, height) {

            if (typeof(x) === "object") {
                var obj = x;
                x = obj.x;
                y = obj.y;
                width = obj.width;
                height = obj.height;
            }
            this.gl.viewport(x, y, width, height);

            this.viewport = {
                x : x,
                y : y,
                width : width,
                height : height
            }
        },

        /**
         * Push current viewport into a stack
         */
        saveViewport : function() {
            this._viewportSettings.push(this.viewport);
        },

        /**
         * Pop viewport from stack, restore in the renderer
         */
        restoreViewport : function() {
            if (this._viewportSettings.length > 0) {
                this.setViewport(this._viewportSettings.pop());
            }
        },

        /**
         * Push current clear into a stack
         */
        saveClear : function() {
            this._clearSettings.push(this.clear);
        },

        /**
         * Pop clear from stack, restore in the renderer
         */
        restoreClear : function() {
            if (this._clearSettings.length > 0) {
                this.clear = this._clearSettings.pop();   
            }
        },
        /**
         * Render the scene in camera to the screen or binded offline framebuffer
         * @param  {qtek.Scene}       scene
         * @param  {qtek.Camera}      camera
         * @param  {boolean}     [notUpdateScene] If not call the scene.update methods in the rendering, default true
         * @param  {boolean}     [preZ]           If use preZ optimization, default false
         * @return {IRenderInfo}
         */
        render : function(scene, camera, notUpdateScene, preZ) {
            var _gl = this.gl;

            this._sceneRendering = scene;

            var color = this.color;

            if (this.clear) {
                _gl.clearColor(color[0], color[1], color[2], color[3]);
                _gl.clear(this.clear);
            }

            // If the scene have been updated in the prepass like shadow map
            // There is no need to update it again
            if (!notUpdateScene) {
                scene.update(false);
            }
            if (!camera.scene) {
                camera.update(true);
            }

            var opaqueQueue = scene.opaqueQueue;
            var transparentQueue = scene.transparentQueue;
            var sceneMaterial = scene.material;

            scene.trigger('beforerender', this, scene, camera);
            // Sort render queue
            // Calculate the object depth
            if (transparentQueue.length > 0) {
                var worldViewMat = mat4.create();
                var posViewSpace = vec3.create();
                for (var i = 0; i < transparentQueue.length; i++) {
                    var node = transparentQueue[i];
                    mat4.multiply(worldViewMat, camera.viewMatrix._array, node.worldTransform._array);
                    vec3.transformMat4(posViewSpace, node.position._array, worldViewMat);
                    node.__depth = posViewSpace[2];
                }
            }
            opaqueQueue.sort(Renderer.opaqueSortFunc);
            transparentQueue.sort(Renderer.transparentSortFunc);

            // Render Opaque queue
            scene.trigger("beforerender:opaque", this, opaqueQueue);

            // Reset the scene bounding box;
            camera.sceneBoundingBoxLastFrame.min.set(Infinity, Infinity, Infinity);
            camera.sceneBoundingBoxLastFrame.max.set(-Infinity, -Infinity, -Infinity);

            _gl.disable(_gl.BLEND);
            _gl.enable(_gl.DEPTH_TEST);
            var opaqueRenderInfo = this.renderQueue(opaqueQueue, camera, sceneMaterial, preZ);

            scene.trigger("afterrender:opaque", this, opaqueQueue, opaqueRenderInfo);
            scene.trigger("beforerender:transparent", this, transparentQueue);

            // Render Transparent Queue
            _gl.enable(_gl.BLEND);
            var transparentRenderInfo = this.renderQueue(transparentQueue, camera, sceneMaterial);

            scene.trigger("afterrender:transparent", this, transparentQueue, transparentRenderInfo);
            var renderInfo = {}
            for (name in opaqueRenderInfo) {
                renderInfo[name] = opaqueRenderInfo[name] + transparentRenderInfo[name];
            }

            scene.trigger('afterrender', this, scene, camera, renderInfo);
            return renderInfo;
        },

        /**
         * Render a single renderable list in camera in sequence
         * @param  {qtek.Renderable[]} queue            List of all renderables.
         *                                         Best to be sorted by Renderer.opaqueSortFunc or Renderer.transparentSortFunc
         * @param  {qtek.Camera}       camera         
         * @param  {qtek.Material}     [globalMaterial] globalMaterial will override the material of each renderable
         * @param  {boolean}      [preZ]           If use preZ optimization, default false
         * @return {IRenderInfo}
         */
        renderQueue : function(queue, camera, globalMaterial, preZ) {
            var renderInfo = {
                faceNumber : 0,
                vertexNumber : 0,
                drawCallNumber : 0,
                meshNumber : 0
            };

            // Calculate view and projection matrix
            mat4.copy(matrices.VIEW, camera.viewMatrix._array);
            mat4.copy(matrices.PROJECTION, camera.projectionMatrix._array);
            mat4.multiply(matrices.VIEWPROJECTION, camera.projectionMatrix._array, matrices.VIEW);
            mat4.copy(matrices.VIEWINVERSE, camera.worldTransform._array);
            mat4.invert(matrices.PROJECTIONINVERSE, matrices.PROJECTION);
            mat4.invert(matrices.VIEWPROJECTIONINVERSE, matrices.VIEWPROJECTION);

            var _gl = this.gl;
            var scene = this._sceneRendering;
            
            var prevMaterial;
            var prevShader;
                
            // Status 
            var depthTest, depthMask;
            var culling, cullFace, frontFace;

            var culledRenderQueue;
            if (preZ) {
                culledRenderQueue = [];
                preZPassShader.bind(_gl);
                _gl.colorMask(false, false, false, false);
                _gl.depthMask(true);
                for (var i = 0; i < queue.length; i++) {
                    var renderable = queue[i];
                    var worldM = renderable.worldTransform._array;
                    var geometry = renderable.geometry;
                    mat4.multiply(matrices.WORLDVIEW, matrices.VIEW , worldM);
                    mat4.multiply(matrices.WORLDVIEWPROJECTION, matrices.VIEWPROJECTION , worldM);

                    if (geometry.boundingBox) {
                        if (!this._frustumCulling(renderable, camera)) {
                            continue;
                        }
                    }
                    if (renderable.skeleton) {  // Skip skinned mesh
                        continue;
                    }
                    if (renderable.cullFace !== cullFace) {
                        cullFace = renderable.cullFace;
                        _gl.cullFace(cullFace);
                    }
                    if (renderable.frontFace !== frontFace) {
                        frontFace = renderable.frontFace;
                        _gl.frontFace(frontFace);
                    }
                    if (renderable.culling !== culling) {
                        culling = renderable.culling;
                        culling ? _gl.enable(_gl.CULL_FACE) : _gl.disable(_gl.CULL_FACE)
                    }

                    var semanticInfo = preZPassShader.matrixSemantics.WORLDVIEWPROJECTION;
                    preZPassShader.setUniform(_gl, semanticInfo.type, semanticInfo.symbol, matrices.WORLDVIEWPROJECTION);
                    renderable.render(_gl, preZPassMaterial);
                    culledRenderQueue.push(renderable);
                }
                _gl.depthFunc(_gl.LEQUAL);
                _gl.colorMask(true, true, true, true);
                _gl.depthMask(false);
            } else {
                culledRenderQueue = queue;
            }

            for (var i =0; i < culledRenderQueue.length; i++) {
                var renderable = culledRenderQueue[i];
                var material = globalMaterial || renderable.material;
                var shader = material.shader;
                var geometry = renderable.geometry;

                var worldM = renderable.worldTransform._array;
                // All matrices ralated to world matrix will be updated on demand;
                mat4.copy(matrices.WORLD, worldM);
                mat4.multiply(matrices.WORLDVIEW, matrices.VIEW , worldM);
                mat4.multiply(matrices.WORLDVIEWPROJECTION, matrices.VIEWPROJECTION , worldM);
                if (shader.matrixSemantics.WORLDINVERSE ||
                    shader.matrixSemantics.WORLDINVERSETRANSPOSE) {
                    mat4.invert(matrices.WORLDINVERSE, worldM);
                }
                if (shader.matrixSemantics.WORLDVIEWINVERSE ||
                    shader.matrixSemantics.WORLDVIEWINVERSETRANSPOSE) {
                    mat4.invert(matrices.WORLDVIEWINVERSE, matrices.WORLDVIEW);
                }
                if (shader.matrixSemantics.WORLDVIEWPROJECTIONINVERSE ||
                    shader.matrixSemantics.WORLDVIEWPROJECTIONINVERSETRANSPOSE) {
                    mat4.invert(matrices.WORLDVIEWPROJECTIONINVERSE, matrices.WORLDVIEWPROJECTION);
                }
                if (geometry.boundingBox && ! preZ) {
                    if (!this._frustumCulling(renderable, camera)) {
                        continue;
                    }
                }

                if (prevShader !== shader) {
                    // Set lights number
                    if (scene && scene.isShaderLightNumberChanged(shader)) {
                        scene.setShaderLightNumber(shader);
                    }

                    var errMsg = shader.bind(_gl);
                    if (errMsg) {

                        if (errorShader[shader.__GUID__]) {
                            continue;
                        }
                        errorShader[shader.__GUID__] = true;

                        if (this.throwError) {
                            throw new Error(errMsg);
                        } else {
                            this.trigger('error', errMsg);
                        }
                    }

                    // Set lights uniforms
                    // TODO needs optimized
                    if (scene) {
                        scene.setLightUniforms(shader, _gl);
                    }
                    prevShader = shader;
                }
                if (prevMaterial !== material) {
                    if (!preZ) {
                        if (material.depthTest !== depthTest) {
                            material.depthTest ? 
                                _gl.enable(_gl.DEPTH_TEST) : 
                                _gl.disable(_gl.DEPTH_TEST);
                            depthTest = material.depthTest;
                        }
                        if (material.depthMask !== depthMask) {
                            _gl.depthMask(material.depthMask);
                            depthMask = material.depthMask;
                        }
                    }
                    material.bind(_gl, prevMaterial);
                    prevMaterial = material;

                    // TODO cache blending
                    if (material.transparent) {
                        if (material.blend) {
                            material.blend(_gl);
                        } else {    // Default blend function
                            _gl.blendEquationSeparate(_gl.FUNC_ADD, _gl.FUNC_ADD);
                            _gl.blendFuncSeparate(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA, _gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);
                        } 
                    }
                }

                var matrixSemanticKeys = shader.matrixSemanticKeys;
                for (var k = 0; k < matrixSemanticKeys.length; k++) {
                    var semantic = matrixSemanticKeys[k];
                    var semanticInfo = shader.matrixSemantics[semantic];
                    var matrix = matrices[semantic];
                    if (semanticInfo.isTranspose) {
                        var matrixNoTranspose = matrices[semanticInfo.semanticNoTranspose];
                        mat4.transpose(matrix, matrixNoTranspose);
                    }
                    shader.setUniform(_gl, semanticInfo.type, semanticInfo.symbol, matrix);
                }

                if (renderable.cullFace !== cullFace) {
                    cullFace = renderable.cullFace;
                    _gl.cullFace(cullFace);
                }
                if (renderable.frontFace !== frontFace) {
                    frontFace = renderable.frontFace;
                    _gl.frontFace(frontFace);
                }
                if (renderable.culling !== culling) {
                    culling = renderable.culling;
                    culling ? _gl.enable(_gl.CULL_FACE) : _gl.disable(_gl.CULL_FACE)
                }

                var objectRenderInfo = renderable.render(_gl, globalMaterial);

                if (objectRenderInfo) {
                    renderInfo.faceNumber += objectRenderInfo.faceNumber;
                    renderInfo.vertexNumber += objectRenderInfo.vertexNumber;
                    renderInfo.drawCallNumber += objectRenderInfo.drawCallNumber;
                    renderInfo.meshNumber ++;
                }
            }

            return renderInfo;
        },

        _frustumCulling : (function() {
            // Frustum culling
            // http://www.cse.chalmers.se/~uffe/vfc_bbox.pdf
            var cullingBoundingBox = new BoundingBox();
            var cullingMatrix = new Matrix4();
            return function(renderable, camera) {
                var geoBBox = renderable.geometry.boundingBox;
                cullingMatrix._array = matrices.WORLDVIEW;
                cullingBoundingBox.copy(geoBBox);
                cullingBoundingBox.applyTransform(cullingMatrix);

                // Passingly update the scene bounding box
                // TODO : exclude very large mesh like ground plane or terrain ?
                camera.sceneBoundingBoxLastFrame.union(cullingBoundingBox);

                if (renderable.frustumCulling)  {
                    if (!cullingBoundingBox.intersectBoundingBox(camera.frustum.boundingBox)) {
                        return false;
                    }

                    cullingMatrix._array = matrices.PROJECTION;
                    if (
                        cullingBoundingBox.max._array[2] > 0 &&
                        cullingBoundingBox.min._array[2] < 0
                    ) {
                        // Clip in the near plane
                        cullingBoundingBox.max._array[2] = -1e-20;
                    }
                    
                    cullingBoundingBox.applyProjection(cullingMatrix);

                    var min = cullingBoundingBox.min._array;
                    var max = cullingBoundingBox.max._array;
                    
                    if (
                        max[0] < -1 || min[0] > 1
                        || max[1] < -1 || min[1] > 1
                        || max[2] < -1 || min[2] > 1
                    ) {
                        return false;
                    }   
                }
                return true;
            }
        })(),

        /**
         * Dispose given scene, including all geometris, textures and shaders in the scene
         * @param {qtek.Scene} scene
         */
        disposeScene : function(scene) {
            this.disposeNode(scene);
            scene.dispose();
        },

        /**
         * Dispose given node, including all geometries, textures and shaders attached on it or its descendant
         * @param {qtek.Node} node
         */
        disposeNode : function(root) {
            var materials = {};
            var _gl = this.gl;

            root.traverse(function(node) {
                if (node.geometry) {
                    node.geometry.dispose(_gl);
                }
                if (node.material) {
                    materials[node.material.__GUID__] = node.material;
                }
                if (node.dispose) {
                    node.dispose(_gl);
                }
            });
            for (var guid in materials) {
                var mat = materials[guid];
                mat.shader.dispose(_gl);
                for (var name in mat.uniforms) {
                    var val = mat.uniforms[name].value;
                    if (!val ) {
                        continue;
                    }
                    if (val instanceof Texture) {
                        val.dispose(_gl);
                    }
                    else if (val instanceof Array) {
                        for (var i = 0; i < val.length; i++) {
                            if (val[i] instanceof Texture) {
                                val[i].dispose(_gl);
                            }
                        }
                    }
                }
            }
            root._children = [];
        },

        /**
         * Dispose given shader
         * @param {qtek.Shader} shader
         */
        disposeShader : function(shader) {
            shader.dispose(this.gl);
        },

        /**
         * Dispose given geometry
         * @param {qtek.Geometry} geometry
         */
        disposeGeometry : function(geometry) {
            geometry.dispose(this.gl);
        },

        /**
         * Dispose given texture
         * @param {qtek.Texture} texture
         */
        disposeTexture : function(texture) {
            texture.dispose(this.gl);
        },

        /**
         * Dispose given frame buffer
         * @param {qtek.FrameBuffer} frameBuffer
         */
        disposeFrameBuffer : function(frameBuffer) {
            frameBuffer.dispose(this.gl);
        },
        
        /**
         * Dispose renderer
         */
        dispose: function() {
            glinfo.dispose(this.gl);
        },

        /**
         * Convert screen coords to normalized device coordinates(NDC)
         * Screen coords can get from mouse event, it is positioned relative to canvas element
         * NDC can be used in ray casting with Camera.prototype.castRay methods
         * 
         * @param  {number}       x
         * @param  {number}       y
         * @param  {qtek.math.Vector2} [out]
         * @return {qtek.math.Vector2}
         */
        screenToNdc : function(x, y, out) {
            if (!out) {
                out = new Vector2();
            }
            // Invert y;
            y = this.height - y;

            out._array[0] = (x - this.viewport.x) / this.viewport.width;
            out._array[0] = out._array[0] * 2 - 1;
            out._array[1] = (y - this.viewport.y) / this.viewport.height;
            out._array[1] = out._array[1] * 2 - 1;

            return out;
        }
    })

    /**
     * Opaque renderables compare function
     * @param  {qtek.Renderable} x
     * @param  {qtek.Renderable} y
     * @return {boolean}
     * @static
     */
    Renderer.opaqueSortFunc = function(x, y) {
        // Priority shader -> material -> geometry
        if (x.material.shader === y.material.shader) {
            if (x.material === y.material) {
                return x.geometry.__GUID__ - y.geometry.__GUID__;
            }
            return x.material.__GUID__ - y.material.__GUID__;
        }
        return x.material.shader.__GUID__ - y.material.shader.__GUID__;
    }

    /**
     * Transparent renderables compare function
     * @param  {qtek.Renderable} a
     * @param  {qtek.Renderable} b
     * @return {boolean}
     * @static
     */
    Renderer.transparentSortFunc = function(x, y) {
        // Priority depth -> shader -> material -> geometry
        if (x.__depth === y.__depth) {
            if (x.material.shader === y.material.shader) {
                if (x.material === y.material) {
                    return x.geometry.__GUID__ - y.geometry.__GUID__;
                }
                return x.material.__GUID__ - y.material.__GUID__;
            }
            return x.material.shader.__GUID__ - y.material.shader.__GUID__;
        }
        // Depth is negative
        // So farther object has smaller depth value
        return x.__depth - y.__depth
    }

    // Temporary variables
    var matrices = {
        'WORLD' : mat4.create(),
        'VIEW' : mat4.create(),
        'PROJECTION' : mat4.create(),
        'WORLDVIEW' : mat4.create(),
        'VIEWPROJECTION' : mat4.create(),
        'WORLDVIEWPROJECTION' : mat4.create(),

        'WORLDINVERSE' : mat4.create(),
        'VIEWINVERSE' : mat4.create(),
        'PROJECTIONINVERSE' : mat4.create(),
        'WORLDVIEWINVERSE' : mat4.create(),
        'VIEWPROJECTIONINVERSE' : mat4.create(),
        'WORLDVIEWPROJECTIONINVERSE' : mat4.create(),

        'WORLDTRANSPOSE' : mat4.create(),
        'VIEWTRANSPOSE' : mat4.create(),
        'PROJECTIONTRANSPOSE' : mat4.create(),
        'WORLDVIEWTRANSPOSE' : mat4.create(),
        'VIEWPROJECTIONTRANSPOSE' : mat4.create(),
        'WORLDVIEWPROJECTIONTRANSPOSE' : mat4.create(),
        'WORLDINVERSETRANSPOSE' : mat4.create(),
        'VIEWINVERSETRANSPOSE' : mat4.create(),
        'PROJECTIONINVERSETRANSPOSE' : mat4.create(),
        'WORLDVIEWINVERSETRANSPOSE' : mat4.create(),
        'VIEWPROJECTIONINVERSETRANSPOSE' : mat4.create(),
        'WORLDVIEWPROJECTIONINVERSETRANSPOSE' : mat4.create()
    };

    Renderer.COLOR_BUFFER_BIT = glenum.COLOR_BUFFER_BIT
    Renderer.DEPTH_BUFFER_BIT = glenum.DEPTH_BUFFER_BIT
    Renderer.STENCIL_BUFFER_BIT = glenum.STENCIL_BUFFER_BIT

    return Renderer;
});
define('qtek/math/Plane',['require','./Vector3','glmatrix'],function(require) {

    var Vector3 = require('./Vector3');
    var glmatrix = require('glmatrix');
    var vec3 = glmatrix.vec3;
    var mat4 = glmatrix.mat4;
    var vec4 = glmatrix.vec4;

    /**
     * @constructor
     * @alias qtek.math.Plane
     * @param {qtek.math.Vector3} [normal]
     * @param {number} [distance]
     */
    var Plane = function(normal, distance) {
        /**
         * Normal of the plane
         * @type {qtek.math.Vector3}
         */
        this.normal = normal || new Vector3(0, 1, 0);

        /**
         * Constant of the plane equation, used as distance to the origin
         * @type {number}
         */
        this.distance = distance || 0;
    }

    Plane.prototype = {

        constructor : Plane,

        /**
         * Distance from given point to plane
         * @param  {qtek.math.Vector3} point
         * @return {number}
         */
        distanceToPoint : function(point) {
            return vec3.dot(point._array, this.normal._array) - this.distance;
        },

        /**
         * Calculate the projection on the plane of point
         * @param  {qtek.math.Vector3} point
         * @param  {qtek.math.Vector3} out
         * @return {qtek.math.Vector3}
         */
        projectPoint : function(point, out) {
            if (!out) {
                out = new Vector3();
            }
            var d = this.distanceToPoint(point);
            vec3.scaleAndAdd(out._array, point._array, this.normal._array, -d);
            out._dirty = true;
            return out;
        },

        /**
         * Normalize the plane's normal and calculate distance
         */
        normalize : function() {
            var invLen = 1 / vec3.len(this.normal._array);
            vec3.scale(this.normal._array, invLen);
            this.distance *= invLen;
        },

        /**
         * If the plane intersect a frustum
         * @param  {qtek.math.Frustum} Frustum
         * @return {boolean}
         */
        intersectFrustum : function(frustum) {
            // Check if all coords of frustum is on plane all under plane
            var coords = frustum.vertices;
            var normal = this.normal._array;
            var onPlane = vec3.dot(coords[0]._array, normal) > this.distance;
            for (var i = 1; i < 8; i++) {
                if ((vec3.dot(coords[i]._array, normal) > this.distance) != onPlane) {
                    return true;
                } 
            }
        },

        /**
         * Calculate the intersection point between plane and a given line
         * @method
         * @param {qtek.math.Vector3} start start point of line
         * @param {qtek.math.Vector3} end end point of line
         * @param {qtek.math.Vector3} [out]
         * @return {qtek.math.Vector3}
         */
        intersectLine : (function() {
            var rd = vec3.create();
            return function(start, end, out) {
                var d0 = this.distanceToPoint(start);
                var d1 = this.distanceToPoint(end);
                if ((d0 > 0 && d1 > 0) || (d0 < 0 && d1 < 0)) {
                    return null;
                }
                // Ray intersection
                var pn = this.normal._array;
                var d = this.distance;
                var ro = start._array;
                // direction
                vec3.sub(rd, end._array, start._array);
                vec3.normalize(rd, rd);

                var divider = vec3.dot(pn, rd);
                // ray is parallel to the plane
                if (divider == 0) {
                    return null;
                }
                if (!out) {
                    out = new Vector3();
                }
                var t = (vec3.dot(pn, ro) - d) / divider;
                vec3.scaleAndAdd(out._array, ro, rd, -t);
                out._dirty = true;
                return out;
            };
        })(),

        /**
         * Apply an affine transform matrix to plane
         * @method
         * @return {qtek.math.Matrix4}
         */
        applyTransform : (function() {
            var inverseTranspose = mat4.create();
            var normalv4 = vec4.create();
            var pointv4 = vec4.create();
            pointv4[3] = 1;
            return function(m4) {
                m4 = m4._array;
                // Transform point on plane
                vec3.scale(pointv4, this.normal._array, this.distance);
                vec4.transformMat4(pointv4, pointv4, m4);
                this.distance = vec3.dot(pointv4, this.normal._array);
                // Transform plane normal
                mat4.invert(inverseTranspose, m4);
                mat4.transpose(inverseTranspose, inverseTranspose);
                normalv4[3] = 0;
                vec3.copy(normalv4, this.normal._array);
                vec4.transformMat4(normalv4, normalv4, inverseTranspose);
                vec3.copy(this.normal._array, normalv4);
            }
        })(),

        /**
         * Copy from another plane
         * @param  {qtek.math.Vector3} plane
         */
        copy : function(plane) {
            vec3.copy(this.normal._array, plane.normal._array);
            this.normal._dirty = true;
            this.distance = plane.distance;
        },

        /**
         * Clone a new plane
         * @return {qtek.math.Plane}
         */
        clone : function() {
            var plane = new Plane();
            plane.copy(this);
            return plane;
        }
    }

    return Plane;
});
define('qtek/math/Frustum',['require','./Vector3','./BoundingBox','./Plane','glmatrix'],function(require) {

    var Vector3 = require('./Vector3');
    var BoundingBox = require('./BoundingBox');
    var Plane = require('./Plane');
    var glmatrix = require('glmatrix');

    var vec3 = glmatrix.vec3;

    /**
     * @constructor
     * @alias qtek.math.Frustum
     */
    var Frustum = function() {

        /**
         * Eight planes to enclose the frustum
         * @type {qtek.math.Plane[]}
         */
        this.planes = [];

        for (var i = 0; i < 6; i++) {
            this.planes.push(new Plane());
        }

        /**
         * Bounding box of frustum
         * @type {qtek.math.BoundingBox}
         */
        this.boundingBox = new BoundingBox();

        /**
         * Eight vertices of frustum
         * @type {Float32Array[]}
         */
        this.vertices = [];
        for (var i = 0; i < 8; i++) {
            this.vertices[i] = vec3.fromValues(0, 0, 0);
        }
    };

    Frustum.prototype = {

        // http://web.archive.org/web/20120531231005/http://crazyjoke.free.fr/doc/3D/plane%20extraction.pdf
        /**
         * Set frustum from a projection matrix
         * @param {qtek.math.Matrix4} projectionMatrix
         */
        setFromProjection : function(projectionMatrix) {

            var planes = this.planes;
            var m = projectionMatrix._array;
            var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
            var m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7];
            var m8 = m[8], m9 = m[9], m10 = m[10], m11 = m[11];
            var m12 = m[12], m13 = m[13], m14 = m[14], m15 = m[15];

            // Update planes
            vec3.set(planes[0].normal._array, m3 - m0, m7 - m4, m11 - m8);
            planes[0].distance = -(m15 - m12);
            planes[0].normalize();

            vec3.set(planes[1].normal._array, m3 + m0, m7 + m4, m11 + m8);
            planes[1].distance = -(m15 + m12);
            planes[1].normalize();
            
            vec3.set(planes[2].normal._array, m3 + m1, m7 + m5, m11 + m9);
            planes[2].distance = -(m15 + m13);
            planes[2].normalize();
            
            vec3.set(planes[3].normal._array, m3 - m1, m7 - m5, m11 - m9);
            planes[3].distance = -(m15 - m13);
            planes[3].normalize();
            
            vec3.set(planes[4].normal._array, m3 - m2, m7 - m6, m11 - m10);
            planes[4].distance = -(m15 - m14);
            planes[4].normalize();
            
            vec3.set(planes[5].normal._array, m3 + m2, m7 + m6, m11 + m10);
            planes[5].distance = -(m15 + m14);
            planes[5].normalize();

            // Perspective projection
            if (m15 === 0)  {
                var aspect = m5 / m0;
                var zNear = -m14 / (m10 - 1);
                var zFar = -m14 / (m10 + 1);
                var farY = -zFar / m5;
                var nearY = -zNear / m5;
                // Update bounding box
                this.boundingBox.min.set(-farY * aspect, -farY, zFar);
                this.boundingBox.max.set(farY * aspect, farY, zNear);
                // update vertices
                var vertices = this.vertices;
                //--- min z
                // min x
                vec3.set(vertices[0], -farY * aspect, -farY, zFar);
                vec3.set(vertices[1], -farY * aspect, farY, zFar);
                // max x
                vec3.set(vertices[2], farY * aspect, -farY, zFar);
                vec3.set(vertices[3], farY * aspect, farY, zFar);
                //-- max z
                vec3.set(vertices[4], -nearY * aspect, -nearY, zNear);
                vec3.set(vertices[5], -nearY * aspect, nearY, zNear);
                vec3.set(vertices[6], nearY * aspect, -nearY, zNear);
                vec3.set(vertices[7], nearY * aspect, nearY, zNear);
            } else { // Orthographic projection
                var left = (-1 - m12) / m0;
                var right = (1 - m12) / m0;
                var top = (1 - m13) / m5;
                var bottom = (-1 - m13) / m5;
                var near = (-1 - m14) / m10;
                var far = (1 - m14) / m10;

                this.boundingBox.min.set(left, bottom, far);
                this.boundingBox.max.set(right, top, near);
                // Copy the vertices from bounding box directly
                for (var i = 0; i < 8; i++) {
                    vec3.copy(this.vertices[i], this.boundingBox.vertices[i]);
                }
            }
        },

        /**
         * Apply a affine transform matrix and set to the given bounding box
         * @method
         * @param {qtek.math.BoundingBox}
         * @param {qtek.math.Matrix4}
         * @return {qtek.math.BoundingBox}
         */
        getTransformedBoundingBox : (function() {
            
            var tmpVec3 = vec3.create();

            return function(bbox, matrix) {
                var vertices = this.vertices;

                var m4 = matrix._array;
                var _min = bbox.min._array;
                var _max = bbox.max._array;
                var v = vertices[0];
                vec3.transformMat4(tmpVec3, v, m4);
                vec3.copy(_min, tmpVec3);
                vec3.copy(_max, tmpVec3);

                for (var i = 1; i < 8; i++) {
                    v = vertices[i];
                    vec3.transformMat4(tmpVec3, v, m4);

                    _min[0] = Math.min(tmpVec3[0], _min[0]);
                    _min[1] = Math.min(tmpVec3[1], _min[1]);
                    _min[2] = Math.min(tmpVec3[2], _min[2]);

                    _max[0] = Math.max(tmpVec3[0], _max[0]);
                    _max[1] = Math.max(tmpVec3[1], _max[1]);
                    _max[2] = Math.max(tmpVec3[2], _max[2]);
                }

                bbox.min._dirty = true;
                bbox.max._dirty = true;

                return bbox;
            };
        }) ()
    }
    return Frustum;
});
define('qtek/math/Ray',['require','../core/Base','./Vector3','glmatrix'],function(require) {

    var Base = require('../core/Base');
    var Vector3 = require('./Vector3');
    var glMatrix = require('glmatrix');
    var vec3 = glMatrix.vec3;
    
    var EPSILON = 1e-5;

    /**
     * @constructor
     * @alias qtek.math.Ray
     * @param {qtek.math.Vector3} [origin]
     * @param {qtek.math.Vector3} [direction]
     */
    var Ray = function(origin, direction) {
        /**
         * @type {qtek.math.Vector3}
         */
        this.origin = origin || new Vector3();
        /**
         * @type {qtek.math.Vector3}
         */
        this.direction = direction || new Vector3();
    }
    Ray.prototype = {
        
        constructor : Ray,

        // http://www.siggraph.org/education/materials/HyperGraph/raytrace/rayplane_intersection.htm
        /**
         * Calculate intersection point between ray and a give plane
         * @param  {qtek.math.Plane} plane
         * @param  {qtek.math.Vector3} [out]
         * @return {qtek.math.Vector3}
         */
        intersectPlane : function(plane, out) {
            var pn = plane.normal._array;
            var d = plane.distance;
            var ro = this.origin._array;
            var rd = this.direction._array;

            var divider = vec3.dot(pn, rd);
            // ray is parallel to the plane
            if (divider == 0) {
                return null;
            }
            if (!out) {
                out = new Vector3();
            }
            var t = (vec3.dot(pn, ro) - d) / divider;
            vec3.scaleAndAdd(out._array, ro, rd, -t);
            out._dirty = true;
            return out;
        },

        /**
         * Mirror the ray against plane
         * @param  {qtek.math.Plane} plane
         */
        mirrorAgainstPlane : function(plane) {
            // Distance to plane
            var d = vec3.dot(plane.normal._array, this.direction._array);
            vec3.scaleAndAdd(this.direction._array, this.direction._array, plane.normal._array, -d * 2);
            this.direction_dirty = true;
        },

        // http://www.scratchapixel.com/lessons/3d-basic-lessons/lesson-7-intersecting-simple-shapes/ray-box-intersection/
        /**
         * Calculate intersection point between ray and bounding box
         * @param {qtek.math.BoundingBox} bbox
         * @param {qtek.math.Vector3}
         * @return {qtek.math.Vector3}
         */
        intersectBoundingBox: function(bbox, out) {
            var dir = this.direction._array;
            var origin = this.origin._array;
            var min = bbox.min._array;
            var max = bbox.max._array;

            var invdirx = 1 / dir[0];
            var invdiry = 1 / dir[1];
            var invdirz = 1 / dir[2];

            var tmin, tmax, tymin, tymax, tzmin, tzmax;
            if (invdirx >= 0) {
                tmin = (min[0] - origin[0]) * invdirx;
                tmax = (max[0] - origin[0]) * invdirx;
            } else {
                tmax = (min[0] - origin[0]) * invdirx;
                tmin = (max[0] - origin[0]) * invdirx;
            }
            if (invdiry >= 0) {
                tymin = (min[1] - origin[1]) * invdiry;
                tymax = (max[1] - origin[1]) * invdiry;
            } else {
                tymax = (min[1] - origin[1]) * invdiry;
                tymin = (max[1] - origin[1]) * invdiry;
            }

            if ((tmin > tymax) || (tymin > tmax)) {
                return null;
            }

            if (tymin > tmin || tmin !== tmin) {
                tmin = tymin;
            }
            if (tymax < tmax || tmax !== tmax) {
                tmax = tymax;
            }

            if (invdirz >= 0) {
                tzmin = (min[2] - origin[2]) * invdirz;
                tzmax = (max[2] - origin[2]) * invdirz;
            } else {
                tzmax = (min[2] - origin[2]) * invdirz;
                tzmin = (max[2] - origin[2]) * invdirz;
            }

            if ((tmin > tzmax) || (tzmin > tmax)) {
                return null;
            }

            if (tzmin > tmin || tmin !== tmin) {
                tmin = tzmin;
            }
            if (tzmax < tmax || tmax !== tmax) {
                tmax = tzmax;
            }
            if (tmax < 0) {
                return null;
            }

            var t = tmin >= 0 ? tmin : tmax;

            if (!out) {
                out = new Vector3();
            }
            vec3.scaleAndAdd(out._array, origin, dir, t);
            return out;
        },

        // http://en.wikipedia.org/wiki/Möller–Trumbore_intersection_algorithm
        /**
         * Calculate intersection point between ray and three triangle vertices
         * @param {qtek.math.Vector3} a
         * @param {qtek.math.Vector3} b
         * @param {qtek.math.Vector3} c
         * @param {boolean}           singleSided, CW triangle will be ignored
         * @param {qtek.math.Vector3} out
         * @return {qtek.math.Vector3}
         */
        intersectTriangle : (function() {
            
            var eBA = vec3.create();
            var eCA = vec3.create();
            var AO = vec3.create();
            var vCross = vec3.create();

            return function(a, b, c, singleSided, out) {
                var dir = this.direction._array;
                var origin = this.origin._array;
                a = a._array;
                b = b._array;
                c = c._array;

                vec3.sub(eBA, b, a);
                vec3.sub(eCA, c, a);

                vec3.cross(vCross, eCA, dir);

                var det = vec3.dot(eBA, vCross);

                if (singleSided) {
                    if (det > -EPSILON) {
                        return null;
                    }
                }
                else {
                    if (det > -EPSILON && det < EPSILON) {
                        return null;
                    }
                }

                vec3.sub(AO, origin, a);
                var u = vec3.dot(vCross, AO) / det;
                if (u < 0 || u > 1) {
                    return null;
                }

                vec3.cross(vCross, eBA, AO);
                var v = vec3.dot(dir, vCross) / det;

                if (v < 0 || v > 1 || (u + v > 1)) {
                    return null;
                }

                vec3.cross(vCross, eBA, eCA);
                var t = -vec3.dot(AO, vCross) / det;

                if (t < 0) {
                    return null;
                }

                if (!out) {
                    out = new Vector3();
                }
                vec3.scaleAndAdd(out._array, origin, dir, t);

                return out;
            }
        })(),

        /**
         * Apply an affine transform matrix to the ray
         * @return {qtek.math.Matrix4} matrix
         */
        applyTransform: function(matrix) {
            Vector3.add(this.direction, this.direction, this.origin);
            Vector3.transformMat4(this.origin, this.origin, matrix);
            Vector3.transformMat4(this.direction, this.direction, matrix);

            Vector3.sub(this.direction, this.direction, this.origin);
            Vector3.normalize(this.direction, this.direction);
        },

        /**
         * Copy values from another ray
         * @param {qtek.math.Ray} ray
         */
        copy: function(ray) {
            Vector3.copy(this.origin, ray.origin);
            Vector3.copy(this.direction, ray.direction);
        },

        /**
         * Clone a new ray
         * @return {qtek.math.Ray}
         */
        clone: function() {
            var ray = new Ray();
            ray.copy(this);
            return ray;
        }
    };

    return Ray;
});
define('qtek/Camera',['require','./Node','./math/Matrix4','./math/Frustum','./math/BoundingBox','./math/Ray','glmatrix'],function(require) {

    var Node = require("./Node");
    var Matrix4 = require("./math/Matrix4");
    var Frustum = require("./math/Frustum");
    var BoundingBox = require("./math/BoundingBox");
    var Ray = require("./math/Ray");

    var glMatrix = require('glmatrix');
    var mat4 = glMatrix.mat4;
    var vec3 = glMatrix.vec3;
    var vec4 = glMatrix.vec4;

    /**
     * @constructor qtek.Camera
     * @extends qtek.Node
     */
    var Camera = Node.derive(function() {
        return /** @lends qtek.Camera# */ {
            /**
             * Camera projection matrix
             * @type {qtek.math.Matrix4}
             */
            projectionMatrix : new Matrix4(),

            /**
             * Inverse of camera projection matrix
             * @type {qtek.math.Matrix4}
             */
            invProjectionMatrix : new Matrix4(),

            /**
             * View matrix, equal to inverse of camera's world matrix
             * @type {qtek.math.Matrix4}
             */
            viewMatrix : new Matrix4(),

            /**
             * Camera frustum in view space
             * @type {qtek.math.Frustum}
             */
            frustum : new Frustum(),

            /**
             * Scene bounding box in view space.
             * Used when camera needs to adujst the near and far plane automatically
             * so that the view frustum contains the visible objects as tightly as possible.
             * Notice:
             *  It is updated after rendering (in the step of frustum culling passingly). So may be not so accurate, but saves a lot of calculation
             *  
             * @type {qtek.math.BoundingBox}
             */
            //TODO : In case of one camera to multiple scenes
            sceneBoundingBoxLastFrame : new BoundingBox()
        }
    }, function() {
        this.update(true);
    },
    /** @lends qtek.Camera.prototype */
    {
        
        update : function(force) {
            Node.prototype.update.call(this, force);
            mat4.invert(this.viewMatrix._array, this.worldTransform._array);
            
            this.updateProjectionMatrix();
            mat4.invert(this.invProjectionMatrix._array, this.projectionMatrix._array);

            this.frustum.setFromProjection(this.projectionMatrix);
        },
        /**
         * Update projection matrix, called after update
         */
        updateProjectionMatrix : function(){},

        /**
         * Cast a picking ray from camera near plane to far plane
         * @method
         * @param {qtek.math.Vector2} ndc
         * @param {qtek.math.Ray} [out]
         * @return {qtek.math.Ray}
         */
        castRay : (function() {
            var v4 = vec4.create();
            return function(ndc, out) {
                var ray = out !== undefined ? out : new Ray();
                var x = ndc._array[0];
                var y = ndc._array[1];
                vec4.set(v4, x, y, -1, 1);
                vec4.transformMat4(v4, v4, this.invProjectionMatrix._array);
                vec4.transformMat4(v4, v4, this.worldTransform._array);
                vec3.scale(ray.origin._array, v4, 1 / v4[3]);

                vec4.set(v4, x, y, 1, 1);
                vec4.transformMat4(v4, v4, this.invProjectionMatrix._array);
                vec4.transformMat4(v4, v4, this.worldTransform._array);
                vec3.scale(v4, v4, 1 / v4[3]);
                vec3.sub(ray.direction._array, v4, ray.origin._array);

                vec3.normalize(ray.direction._array, ray.direction._array);
                ray.direction._dirty = true;
                ray.origin._dirty = true;
                
                return ray;
            }
        })()

        /**
         * @method
         * @name clone
         * @return {qtek.Camera}
         * @memberOf qtek.Camera.prototype
         */
    });

    return Camera;
});
define('qtek/camera/Orthographic',['require','../Camera'],function(require) {

    var Camera = require('../Camera');
    /**
     * @constructor qtek.camera.Orthographic
     * @extends qtek.Camera
     */
    var Orthographic = Camera.derive(
    /** @lends qtek.camera.Orthographic# */
    {
        /**
         * @type {number}
         */
        left : -1,
        /**
         * @type {number}
         */
        right : 1,
        /**
         * @type {number}
         */
        near : -1,
        /**
         * @type {number}
         */
        far : 1,
        /**
         * @type {number}
         */
        top : 1,
        /**
         * @type {number}
         */
        bottom : -1
    },
    /** @lends qtek.camera.Orthographic.prototype */
    {
        
        updateProjectionMatrix : function() {
            this.projectionMatrix.ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
        },
        /**
         * @return {qtek.camera.Orthographic}
         */
        clone: function() {
            var camera = Camera.prototype.clone.call(this);
            camera.left = this.left;
            camera.right = this.right;
            camera.near = this.near;
            camera.far = this.far;
            camera.top = this.top;
            camera.bottom = this.bottom;

            return camera;
        }
    });

    return Orthographic;
} );
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
define('qtek/Scene',['require','./Node','./Light','glmatrix','./math/BoundingBox'],function(require) {

    

    var Node = require('./Node');
    var Light = require('./Light');
    var glMatrix = require("glmatrix");
    var BoundingBox = require('./math/BoundingBox');
    var mat4 = glMatrix.mat4;
    var vec3 = glMatrix.vec3;

    /**
     * @constructor qtek.Scene
     * @extends qtek.Node
     */
    var Scene = Node.derive(function() {
        return /** @lends qtek.Scene# */ {
            /**
             * Global material of scene
             * @type {Material}
             */
            material : null,

            /**
             * @type {boolean}
             */
            autoUpdate : true,

            /**
             * Opaque renderable list, it will be updated automatically
             * @type {Renderable[]}
             * @readonly
             */
            opaqueQueue : [],

            /**
             * Opaque renderable list, it will be updated automatically
             * @type {Renderable[]}
             * @readonly
             */
            transparentQueue : [],

            // Properties to save the light information in the scene
            // Will be set in the render function
            lights : [],
            
            _lightUniforms : {},

            _lightNumber : {
                'POINT_LIGHT' : 0,
                'DIRECTIONAL_LIGHT' : 0,
                'SPOT_LIGHT' : 0,
                'AMBIENT_LIGHT' : 0
            },

            _opaqueObjectCount : 0,
            _transparentObjectCount : 0,

            _nodeRepository : {}
        }
    }, function() {
        this.scene = this;
    }, 
    /** @lends qtek.Scene.prototype. */
    {
        /**
         * Add node to scene
         * @param {Node} node
         */
        addToScene : function(node) {
            if (node.name) {
                this._nodeRepository[node.name] = node;
            }
        },

        /**
         * Remove node from scene
         * @param {Node} node
         */
        removeFromScene : function(node) {
            if (node.name) {
                delete this._nodeRepository[node.name];
            }
        },

        /**
         * Get node by name
         * @param  {string} name
         * @return {Node}
         */
        getNode : function(name) {
            return this._nodeRepository[name];
        },

        update : function(force) {
            if (!(this.autoUpdate || force)) {
                return;
            }
            Node.prototype.update.call(this, force);

            var lights = this.lights;
            var opaqueQueue = this.opaqueQueue;
            var transparentQueue = this.transparentQueue;
            var sceneMaterialTransparent = this.material && this.material.transparent;

            this._opaqueObjectCount = 0;
            this._transparentObjectCount = 0;

            lights.length = 0;

            this._updateRenderQueue(this, sceneMaterialTransparent);

            this.opaqueQueue.length = this._opaqueObjectCount;
            this.transparentQueue.length = this._transparentObjectCount;

            // reset
            for (var type in this._lightNumber) {
                this._lightNumber[type] = 0;
            }
            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                this._lightNumber[light.type]++;
            }
            this._updateLightUniforms();
        },

        // Traverse the scene and add the renderable
        // object to the render queue
        _updateRenderQueue : function(parent, sceneMaterialTransparent) {
            if (!parent.visible) {
                return;
            }
            
            for (var i = 0; i < parent._children.length; i++) {
                var child = parent._children[i];
                
                if (child instanceof Light) {
                    this.lights.push(child);
                }
                if (child.isRenderable()) {
                    if (child.material.transparent || sceneMaterialTransparent) {
                        this.transparentQueue[this._transparentObjectCount++] = child;
                    } else {
                        this.opaqueQueue[this._opaqueObjectCount++] = child;
                    }
                }
                if (child._children.length > 0) {
                    this._updateRenderQueue(child);
                }
            }
        },

        _updateLightUniforms : function() {
            var lights = this.lights;
            // Put the light cast shadow before the light not cast shadow
            lights.sort(lightSortFunc);

            var lightUniforms = this._lightUniforms;
            for (var symbol in lightUniforms) {
                lightUniforms[symbol].value.length = 0;
            }
            for (var i = 0; i < lights.length; i++) {
                
                var light = lights[i];
                
                for (symbol in light.uniformTemplates) {

                    var uniformTpl = light.uniformTemplates[symbol];
                    if (! lightUniforms[symbol]) {
                        lightUniforms[symbol] = {
                            type : "",
                            value : []
                        }
                    }
                    var value = uniformTpl.value(light);
                    var lu = lightUniforms[symbol];
                    lu.type = uniformTpl.type + "v";
                    switch (uniformTpl.type) {
                        case "1i":
                        case "1f":
                            lu.value.push(value);
                            break;
                        case "2f":
                        case "3f":
                        case "4f":
                            for (var j =0; j < value.length; j++) {
                                lu.value.push(value[j]);
                            }
                            break;
                        default:
                            console.error("Unkown light uniform type "+uniformTpl.type);
                    }
                }
            }
        },

        isShaderLightNumberChanged : function(shader) {
            return shader.lightNumber.POINT_LIGHT !== this._lightNumber.POINT_LIGHT
                || shader.lightNumber.DIRECTIONAL_LIGHT !== this._lightNumber.DIRECTIONAL_LIGHT
                || shader.lightNumber.SPOT_LIGHT !== this._lightNumber.SPOT_LIGHT
                || shader.lightNumber.AMBIENT_LIGHT !== this._lightNumber.AMBIENT_LIGHT
        },

        setShaderLightNumber : function(shader) {
            for (var type in this._lightNumber) {
                shader.lightNumber[type] = this._lightNumber[type];
            }
            shader.dirty();
        },

        setLightUniforms: function(shader, _gl) {
            for (var symbol in this._lightUniforms) {
                var lu = this._lightUniforms[symbol];
                shader.setUniform(_gl, lu.type, symbol, lu.value);
            }
        },

        /**
         * Dispose self, clear all the scene objects
         * But resources of gl like texuture, shader will not be disposed.
         * Mostly you should use disposeScene method in Renderer to do dispose.
         */
        dispose : function() {
            this.material = null;
            this.opaqueQueue = [];
            this.transparentQueue = [];

            this.lights = [];
            
            this._lightUniforms = {};

            this._lightNumber = {};
            this._nodeRepository = {};
        }
    });

    function lightSortFunc(a, b) {
        if (b.castShadow && !a.castShadow) {
            return true;
        }
    }

    return Scene;
});
/**
 *
 * PENDING: use perfermance hint and remove the array after the data is transfered?
 * static draw & dynamic draw?
 */
define('qtek/DynamicGeometry',['require','./Geometry','./core/util','./math/Vector3','./math/BoundingBox','./core/glenum','glmatrix'],function(require) {

    

    var Geometry = require("./Geometry");
    var util = require("./core/util");
    var Vector3 = require("./math/Vector3");
    var BoundingBox = require("./math/BoundingBox");
    var glenum = require("./core/glenum");
    var glMatrix = require("glmatrix");
    var vec3 = glMatrix.vec3;
    var vec2 = glMatrix.vec2;
    var mat2 = glMatrix.mat2;
    var mat4 = glMatrix.mat4;

    var arrSlice = Array.prototype.slice;

    /**
     * @constructor qtek.DynamicGeometry
     * @extends qtek.Geometry
     */
    var DynamicGeometry = Geometry.derive(function() {
        return /** @lends qtek.DynamicGeometry# */ {
            attributes : {
                 position : new Geometry.Attribute('position', 'float', 3, 'POSITION', true),
                 texcoord0 : new Geometry.Attribute('texcoord0', 'float', 2, 'TEXCOORD_0', true),
                 texcoord1 : new Geometry.Attribute('texcoord1', 'float', 2, 'TEXCOORD_1', true),
                 normal : new Geometry.Attribute('normal', 'float', 3, 'NORMAL', true),
                 tangent : new Geometry.Attribute('tangent', 'float', 4, 'TANGENT', true),
                 color : new Geometry.Attribute('color', 'float', 4, 'COLOR', true),
                 // Skinning attributes
                 // Each vertex can be bind to 4 bones, because the 
                 // sum of weights is 1, so the weights is stored in vec3 and the last
                 // can be calculated by 1-w.x-w.y-w.z
                 weight : new Geometry.Attribute('weight', 'float', 3, 'WEIGHT', true),
                 joint : new Geometry.Attribute('joint', 'float', 4, 'JOINT', true),
                 // For wireframe display
                 // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
                 barycentric : new Geometry.Attribute('barycentric', 'float', 3, null, true)
            },

            hint : glenum.DYNAMIC_DRAW,

            // Face is list of triangles, each face
            // is an array of the vertex indices of triangle
            
            /**
             * @type {array}
             */
            faces : [],
            
            _enabledAttributes : null,

            // Typed Array of each geometry chunk
            // [{
            //     attributeArrays:{
            //         position : TypedArray
            //     },
            //     indicesArray : null
            // }]
            _arrayChunks : []
        }
    }, 
    /** @lends qtek.DynamicGeometry.prototype */
    {
        updateBoundingBox : function() {
            if (!this.boundingBox) {
                this.boundingBox = new BoundingBox();
            }
            this.boundingBox.updateFromVertices(this.attributes.position.value);
        },
        // Overwrite the dirty method
        dirty : function(field) {
            if (!field) {
                this.dirty("indices");
                for (var name in this.attributes) {
                    this.dirty(name);
                }
                return;
            }
            this._cache.dirtyAll(field);

            this._cache.dirtyAll();

            this._enabledAttributes = null;
        },

        getVertexNumber : function() {
            return this.attributes.position.value.length;
        },

        getFaceNumber : function() {
            return this.faces.length;
        },

        isUseFace : function() {
            return this.useFace && (this.faces.length > 0);
        },

        isSplitted : function() {
            return this.getVertexNumber() > this.chunkSize;
        },
        
        isStatic : function() {
            return false;
        },

        createAttribute: function(name, type, size, semantic) {
            var attrib = new Geometry.Attribute(name, type, size, semantic, true);
            this.attributes[name] = attrib;
            this._attributeList.push(name);
            return attrib;
        },

        removeAttribute: function(name) {
            var idx = this._attributeList.indexOf(name);
            if (idx >= 0) {
                this._attributeList.splice(idx, 1);
                delete this.attributes[name];
                return true;
            }
            return false;
        },

        /**
         * Get enabled attributes map.
         * Attribute that has same vertex number with position is treated as an enabled attribute
         * @return {Object}
         */
        getEnabledAttributes : function() {
            // Cache
            if (this._enabledAttributes) {
                return this._enabledAttributes;
            }

            var result = {};
            var nVertex = this.getVertexNumber();

            for (var i = 0; i < this._attributeList.length; i++) {
                var name = this._attributeList[i];
                var attrib = this.attributes[name];
                if (attrib.value.length) {
                    if (attrib.value.length === nVertex) {
                        result[name] = attrib;
                    }
                }
            }

            this._enabledAttributes = result;

            return result;
        },

        _getDirtyAttributes : function() {

            var attributes = this.getEnabledAttributes();
            
            if (this._cache.miss('chunks')) {
                return attributes;
            } else {
                var result = {};
                var noDirtyAttributes = true;
                for (var name in attributes) {
                    var attrib = attributes[name];
                    if (this._cache.isDirty(name)) {
                        result[name] = attributes[name];
                        noDirtyAttributes = false;
                    }
                }
                if (! noDirtyAttributes) {
                    return result;
                }
            }
        },

        getChunkNumber : function() {
            return this._arrayChunks.length;
        },

        getBufferChunks : function(_gl) {

            this._cache.use(_gl.__GLID__);

            if (this._cache.isDirty()) {
                var dirtyAttributes = this._getDirtyAttributes();

                var isFacesDirty = this._cache.isDirty('indices');
                isFacesDirty = isFacesDirty && this.isUseFace();
                
                if (dirtyAttributes) {
                    this._updateAttributesAndIndicesArrays(dirtyAttributes, isFacesDirty);
                    this._updateBuffer(_gl, dirtyAttributes, isFacesDirty);

                    for (var name in dirtyAttributes) {
                        this._cache.fresh(name);
                    }
                    this._cache.fresh('indices');
                    this._cache.fresh();
                }
            }
            return this._cache.get("chunks");
        },

        _updateAttributesAndIndicesArrays : function(attributes, isFacesDirty) {

            var self = this
            var nVertex = this.getVertexNumber();
            
            var verticesReorganizedMap = [];
            var reorganizedFaces = [];

            var ArrayConstructors = {};
            for (var name in attributes) {
                // Type can be byte, ubyte, short, ushort, float
                switch(type) {
                    case "byte":
                        ArrayConstructors[name] = Int8Array;
                        break;
                    case "ubyte":
                        ArrayConstructors[name] = Uint8Array;
                        break;
                    case "short":
                        ArrayConstructors[name] = Int16Array;
                        break;
                    case "ushort":
                        ArrayConstructors[name] = Uint16Array;
                        break;
                    default:
                        ArrayConstructors[name] = Float32Array;
                        break;
                }
            }

            var newChunk = function(chunkIdx) {
                if (self._arrayChunks[chunkIdx]) {
                    return self._arrayChunks[chunkIdx];
                }
                var chunk = {
                    attributeArrays : {},
                    indicesArray : null
                };

                for (var name in attributes) {
                    chunk.attributeArrays[name] = null;
                }

                for (var i = 0; i < nVertex; i++) {
                    verticesReorganizedMap[i] = -1;
                }
                
                self._arrayChunks.push(chunk);
                return chunk;
            }

            var attribNameList = Object.keys(attributes);
            // Split large geometry into chunks because index buffer
            // only support uint16 which means each draw call can only
             // have at most 65535 vertex data
            if (nVertex > this.chunkSize && this.isUseFace()) {
                var vertexCursor = 0;
                var chunkIdx = 0;
                var currentChunk;

                var chunkFaceStart = [0];
                var vertexUseCount = [];

                for (i = 0; i < nVertex; i++) {
                    vertexUseCount[i] = -1;
                    verticesReorganizedMap[i] = -1;
                }
                if (isFacesDirty) {
                    for (i = 0; i < this.faces.length; i++) {
                        reorganizedFaces[i] = [0, 0, 0];
                    }
                }

                currentChunk = newChunk(chunkIdx);

                var vertexCount = 0;
                for (var i = 0; i < this.faces.length; i++) {
                    var face = this.faces[i];
                    var reorganizedFace = reorganizedFaces[i];

                    // newChunk
                    if (vertexCount+3 > this.chunkSize) {
                        chunkIdx++;
                        chunkFaceStart[chunkIdx] = i;
                        vertexCount = 0;
                        currentChunk = newChunk(chunkIdx);
                    }

                    for (var f = 0; f < 3; f++) {
                        var ii = face[f];
                        var isNew = verticesReorganizedMap[ii] === -1; 

                        for (var k = 0; k < attribNameList.length; k++) {
                            var name = attribNameList[k];
                            var attribArray = currentChunk.attributeArrays[name];
                            var values = attributes[name].value;
                            var size = attributes[name].size;
                            if (! attribArray) {
                                // Here use array to put data temporary because i can't predict
                                // the size of chunk precisely.
                                attribArray = currentChunk.attributeArrays[name] = [];
                            }
                            if (isNew) {
                                if (size === 1) {
                                    attribArray[vertexCount] = values[ii];
                                }
                                for (var j = 0; j < size; j++) {
                                    attribArray[vertexCount * size + j] = values[ii][j];
                                }
                            }
                        }
                        if (isNew) {
                            verticesReorganizedMap[ii] = vertexCount;
                            reorganizedFace[f] = vertexCount;
                            vertexCount++;
                        } else {
                            reorganizedFace[f] = verticesReorganizedMap[ii];
                        }
                    }
                }
                //Create typedArray from existed array
                for (var c = 0; c < this._arrayChunks.length; c++) {
                    var chunk = this._arrayChunks[c];
                    for (var name in chunk.attributeArrays) {
                        var array = chunk.attributeArrays[name];
                        if (array instanceof Array) {
                            chunk.attributeArrays[name] = new ArrayConstructors[name](array);
                        }
                    }
                }

                if (isFacesDirty) {
                    var chunkStart, chunkEnd, cursor, chunk;
                    for (var c = 0; c < this._arrayChunks.length; c++) {
                        chunkStart = chunkFaceStart[c];
                        chunkEnd = chunkFaceStart[c+1] || this.faces.length;
                        cursor = 0;
                        chunk = this._arrayChunks[c];
                        var indicesArray = chunk.indicesArray;
                        if (! indicesArray) {
                            indicesArray = chunk.indicesArray = new Uint16Array((chunkEnd-chunkStart)*3);
                        }

                        for (var i = chunkStart; i < chunkEnd; i++) {
                            indicesArray[cursor++] = reorganizedFaces[i][0];
                            indicesArray[cursor++] = reorganizedFaces[i][1];
                            indicesArray[cursor++] = reorganizedFaces[i][2];
                        }
                    }
                }
            } else {
                var chunk = newChunk(0);
                // Use faces
                if (isFacesDirty) {
                    var indicesArray = chunk.indicesArray;
                    if (! indicesArray) {
                        indicesArray = chunk.indicesArray = new Uint16Array(this.faces.length*3);
                    }
                    var cursor = 0;
                    for (var i = 0; i < this.faces.length; i++) {
                        indicesArray[cursor++] = this.faces[i][0];
                        indicesArray[cursor++] = this.faces[i][1];
                        indicesArray[cursor++] = this.faces[i][2];
                    }
                }
                for (var name in attributes) {
                    var values = attributes[name].value;
                    var type = attributes[name].type;
                    var size = attributes[name].size;
                    var attribArray = chunk.attributeArrays[name];
                    
                    var arrSize = nVertex * size;
                    if (! attribArray || attribArray.length !== arrSize) {
                        attribArray = new ArrayConstructors[name](arrSize);
                        chunk.attributeArrays[name] = attribArray;
                    }

                    if (size === 1) {
                        for (var i = 0; i < values.length; i++) {
                            attribArray[i] = values[i];
                        }
                    } else {
                        var cursor = 0;
                        for (var i = 0; i < values.length; i++) {
                            for (var j = 0; j < size; j++) {
                                attribArray[cursor++] = values[i][j];
                            }
                        }
                    }
                }
            }
        },

        _updateBuffer : function(_gl, dirtyAttributes, isFacesDirty) {
            var chunks = this._cache.get("chunks");
            var firstUpdate = false;
            if (! chunks) {
                chunks = [];
                // Intialize
                for (var i = 0; i < this._arrayChunks.length; i++) {
                    chunks[i] = {
                        attributeBuffers : [],
                        indicesBuffer : null
                    }
                }
                this._cache.put("chunks", chunks);
                firstUpdate = true;
            }
            for (var cc = 0; cc < this._arrayChunks.length; cc++) {
                var chunk = chunks[cc];
                if (! chunk) {
                    chunk = chunks[cc] = {
                        attributeBuffers : [],
                        indicesBuffer : null
                    }
                }
                var attributeBuffers = chunk.attributeBuffers;
                var indicesBuffer = chunk.indicesBuffer;
                
                var arrayChunk = this._arrayChunks[cc];
                var attributeArrays = arrayChunk.attributeArrays;
                var indicesArray = arrayChunk.indicesArray;

                var count = 0;
                var prevSearchIdx = 0;
                for (var name in dirtyAttributes) {
                    var attribute = dirtyAttributes[name];
                    var type = attribute.type;
                    var semantic = attribute.semantic;
                    var size = attribute.size;

                    var bufferInfo;
                    if (!firstUpdate) {
                        for (var i = prevSearchIdx; i < attributeBuffers.length; i++) {
                            if (attributeBuffers[i].name === name) {
                                bufferInfo = attributeBuffers[i];
                                prevSearchIdx = i + 1;
                                break;
                            }
                        }
                        if (!bufferInfo) {
                            for (var i = prevSearchIdx - 1; i >= 0; i--) {
                                if (attributeBuffers[i].name === name) {
                                    bufferInfo = attributeBuffers[i];
                                    prevSearchIdx = i;
                                    break;
                                }
                            }
                        }
                    }

                    var buffer;
                    if (bufferInfo) {
                        buffer = bufferInfo.buffer
                    } else {
                        buffer = _gl.createBuffer();
                    }
                    //TODO: Use BufferSubData?
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
                    _gl.bufferData(_gl.ARRAY_BUFFER, attributeArrays[name], this.hint);

                    attributeBuffers[count++] = new Geometry.AttributeBuffer(name, type, buffer, size, semantic);
                }
                attributeBuffers.length = count;

                if (isFacesDirty) {
                    if (! indicesBuffer) {
                        indicesBuffer = new Geometry.IndicesBuffer(_gl.createBuffer(), indicesArray.length);
                        chunk.indicesBuffer = indicesBuffer;
                    }
                    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, indicesBuffer.buffer);
                    _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, indicesArray, this.hint);   
                }
            }
        },

        generateVertexNormals : function() {
            var faces = this.faces;
            var len = faces.length;
            var positions = this.attributes.position.value;
            var normals = this.attributes.normal.value;
            var normal = vec3.create();

            var v21 = vec3.create(), v32 = vec3.create();

            for (var i = 0; i < normals.length; i++) {
                vec3.set(normals[i], 0.0, 0.0, 0.0);
            }
            for (var i = normals.length; i < positions.length; i++) {
                //Use array instead of Float32Array
                normals[i] = [0.0, 0.0, 0.0];
            }

            for (var f = 0; f < len; f++) {

                var face = faces[f];
                var i1 = face[0];
                var i2 = face[1];
                var i3 = face[2];
                var p1 = positions[i1];
                var p2 = positions[i2];
                var p3 = positions[i3];

                vec3.sub(v21, p1, p2);
                vec3.sub(v32, p2, p3);
                vec3.cross(normal, v21, v32);
                // Weighted by the triangle area
                vec3.add(normals[i1], normals[i1], normal);
                vec3.add(normals[i2], normals[i2], normal);
                vec3.add(normals[i3], normals[i3], normal);
            }
            for (var i = 0; i < normals.length; i++) {
                vec3.normalize(normals[i], normals[i]);
            }
        },

        generateFaceNormals : function() {
            if (! this.isUniqueVertex()) {
                this.generateUniqueVertex();
            }

            var faces = this.faces;
            var len = faces.length;
            var positions = this.attributes.position.value;
            var normals = this.attributes.normal.value;
            var normal = vec3.create();

            var v21 = vec3.create(), v32 = vec3.create();

            var isCopy = normals.length === positions.length;
            
            for (var i = 0; i < len; i++) {
                var face = faces[i];
                var i1 = face[0];
                var i2 = face[1];
                var i3 = face[2];
                var p1 = positions[i1];
                var p2 = positions[i2];
                var p3 = positions[i3];

                vec3.sub(v21, p1, p2);
                vec3.sub(v32, p2, p3);
                vec3.cross(normal, v21, v32);

                if (isCopy) {
                    vec3.copy(normals[i1], normal);
                    vec3.copy(normals[i2], normal);
                    vec3.copy(normals[i3], normal);
                } else {
                    normals[i1] = normals[i2] = normals[i3] = arrSlice.call(normal);
                }
            }
        },
        // "Mathmatics for 3D programming and computer graphics, third edition"
        // section 7.8.2
        // http://www.crytek.com/download/Triangle_mesh_tangent_space_calculation.pdf
        generateTangents : function() {
            
            var texcoords = this.attributes.texcoord0.value;
            var positions = this.attributes.position.value;
            var tangents = this.attributes.tangent.value;
            var normals = this.attributes.normal.value;

            var tan1 = [];
            var tan2 = [];
            var nVertex = this.getVertexNumber();
            for (var i = 0; i < nVertex; i++) {
                tan1[i] = [0.0, 0.0, 0.0];
                tan2[i] = [0.0, 0.0, 0.0];
            }

            var sdir = [0.0, 0.0, 0.0];
            var tdir = [0.0, 0.0, 0.0];
            for (var i = 0; i < this.faces.length; i++) {
                var face = this.faces[i],
                    i1 = face[0],
                    i2 = face[1],
                    i3 = face[2],

                    st1 = texcoords[i1],
                    st2 = texcoords[i2],
                    st3 = texcoords[i3],

                    p1 = positions[i1],
                    p2 = positions[i2],
                    p3 = positions[i3];

                var x1 = p2[0] - p1[0],
                    x2 = p3[0] - p1[0],
                    y1 = p2[1] - p1[1],
                    y2 = p3[1] - p1[1],
                    z1 = p2[2] - p1[2],
                    z2 = p3[2] - p1[2];

                var s1 = st2[0] - st1[0],
                    s2 = st3[0] - st1[0],
                    t1 = st2[1] - st1[1],
                    t2 = st3[1] - st1[1];

                var r = 1.0 / (s1 * t2 - t1 * s2);
                sdir[0] = (t2 * x1 - t1 * x2) * r;
                sdir[1] = (t2 * y1 - t1 * y2) * r; 
                sdir[2] = (t2 * z1 - t1 * z2) * r;

                tdir[0] = (s1 * x2 - s2 * x1) * r;
                tdir[1] = (s1 * y2 - s2 * y1) * r;
                tdir[2] = (s1 * z2 - s2 * z1) * r;

                vec3.add(tan1[i1], tan1[i1], sdir);
                vec3.add(tan1[i2], tan1[i2], sdir);
                vec3.add(tan1[i3], tan1[i3], sdir);
                vec3.add(tan2[i1], tan2[i1], tdir);
                vec3.add(tan2[i2], tan2[i2], tdir);
                vec3.add(tan2[i3], tan2[i3], tdir);
            }
            var tmp = [0, 0, 0, 0];
            var nCrossT = [0, 0, 0];
            for (var i = 0; i < nVertex; i++) {
                var n = normals[i];
                var t = tan1[i];

                // Gram-Schmidt orthogonalize
                vec3.scale(tmp, n, vec3.dot(n, t));
                vec3.sub(tmp, t, tmp);
                vec3.normalize(tmp, tmp);
                // Calculate handedness.
                vec3.cross(nCrossT, n, t);
                tmp[3] = vec3.dot(nCrossT, tan2[i]) < 0.0 ? -1.0 : 1.0;
                tangents[i] = tmp.slice();
            }
        },

        isUniqueVertex : function() {
            if (this.isUseFace()) {
                return this.getVertexNumber() === this.faces.length * 3;
            } else {
                return true;
            }
        },

        generateUniqueVertex : function() {

            var vertexUseCount = [];
            // Intialize with empty value, read undefined value from array
            // is slow
            // http://jsperf.com/undefined-array-read
            for (var i = 0; i < this.getVertexNumber(); i++) {
                vertexUseCount[i] = 0;
            }

            var cursor = this.getVertexNumber();
            var attributes = this.getEnabledAttributes();
            var faces = this.faces;

            var attributeNameList = Object.keys(attributes);

            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];
                for (var j = 0; j < 3; j++) {
                    var ii = face[j];
                    if (vertexUseCount[ii] > 0) {
                        for (var a = 0; a < attributeNameList.length; a++) {
                            var name = attributeNameList[a];
                            var array = attributes[name].value;
                            var size = attributes[name].size;
                            if (size === 1) {
                                array.push(array[ii]);
                            } else {
                                array.push(arrSlice.call(array[ii]));
                            }
                        }
                        face[j] = cursor;
                        cursor++;
                    }
                    vertexUseCount[ii]++;
                }
            }

            this.dirty();
        },

        // http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
        // http://en.wikipedia.org/wiki/Barycentric_coordinate_system_(mathematics)
        generateBarycentric : (function() {
            var a = [1, 0, 0],
                b = [0, 0, 1],
                c = [0, 1, 0];
            return function() {

                if (! this.isUniqueVertex()) {
                    this.generateUniqueVertex();
                }

                var array = this.attributes.barycentric.value;
                // Already existed;
                if (array.length == this.faces.length * 3) {
                    return;
                }
                var i1, i2, i3, face;
                for (var i = 0; i < this.faces.length; i++) {
                    face = this.faces[i];
                    i1 = face[0];
                    i2 = face[1];
                    i3 = face[2];
                    array[i1] = a;
                    array[i2] = b;
                    array[i3] = c;
                }
            }
        })(),

        convertToStatic : function(geometry) {
            this._updateAttributesAndIndicesArrays(this.getEnabledAttributes(), true);

            if (this._arrayChunks.length > 1) {
                console.warn('Large geometry will discard chunks when convert to StaticGeometry');
            }
            else if (this._arrayChunks.length === 0) {
                return geometry;
            }
            var chunk = this._arrayChunks[0];

            var attributes = this.getEnabledAttributes();
            for (var name in attributes) {
                var attrib = attributes[name];
                var geoAttrib = geometry.attributes[name];
                if (!geoAttrib) {
                    geoAttrib = geometry.attributes[name] = {
                        type : attrib.type,
                        size : attrib.size,
                        value : null
                    }
                    if (attrib.semantic) {
                        geoAttrib.semantic = attrib.semantic;
                    }
                }
                geoAttrib.value = chunk.attributeArrays[name];
            }
            geometry.faces = chunk.indicesArray;

            if (this.boundingBox) {
                geometry.boundingBox = new BoundingBox();
                geometry.boundingBox.min.copy(this.boundingBox.min);
                geometry.boundingBox.max.copy(this.boundingBox.max);
            }
            // PENDING : copy buffer ?
            return geometry
        },

        applyTransform : function(matrix) {
            
            if (this.boundingBox) {
                this.boundingBox.applyTransform(matrix);
            }

            var positions = this.attributes.position.value;
            var normals = this.attributes.normal.value;
            var tangents = this.attributes.tangent.value;

            matrix = matrix._array;
            for (var i = 0; i < positions.length; i++) {
                vec3.transformMat4(positions[i], positions[i], matrix);
            }
            // Normal Matrix
            var inverseTransposeMatrix = mat4.create();
            mat4.invert(inverseTransposeMatrix, matrix);
            mat4.transpose(inverseTransposeMatrix, inverseTransposeMatrix);

            for (var i = 0; i < normals.length; i++) {
                vec3.transformMat4(normals[i], normals[i], inverseTransposeMatrix);
            }

            for (var i = 0; i < tangents.length; i++) {
                vec3.transformMat4(tangents[i], tangents[i], inverseTransposeMatrix);
            }
        },

        dispose : function(_gl) {
            this._cache.use(_gl.__GLID__);
            var chunks = this._cache.get('chunks');
            if (chunks) {
                for (var c = 0; c < chunks.length; c++) {
                    var chunk = chunks[c];
                    for (var k = 0; k < chunk.attributeBuffers.length; k++) {
                        var attribs = chunk.attributeBuffers[k];
                        _gl.deleteBuffer(attribs.buffer);
                    }
                }
            }
            this._cache.deleteContext(_gl.__GLID__);
        }
    });
    
    return DynamicGeometry;
});
define('qtek/geometry/Plane',['require','../DynamicGeometry','../math/BoundingBox'],function(require) {

    var DynamicGeometry = require('../DynamicGeometry');
    var BoundingBox = require('../math/BoundingBox');

    /**
     * @constructor qtek.geometry.Plane
     * @extends qtek.DynamicGeometry
     * @param {Object} [opt]
     * @param {number} [opt.widthSegments]
     * @param {number} [opt.heightSegments]
     */
    var Plane = DynamicGeometry.derive(
    /** @lends qtek.geometry.Plane# */
    {
        /**
         * @type {number}
         */
        widthSegments : 1,
        /**
         * @type {number}
         */
        heightSegments : 1
    }, function() {
        this.build();
    },
    /** @lends qtek.geometry.Plane.prototype */
    {
        /**
         * Build plane geometry
         */
        build: function() {
            var heightSegments = this.heightSegments;
            var widthSegments = this.widthSegments;
            var positions = this.attributes.position.value;
            var texcoords = this.attributes.texcoord0.value;
            var normals = this.attributes.normal.value;
            var faces = this.faces;

            positions.length = 0;
            texcoords.length = 0;
            normals.length = 0;
            faces.length = 0;

            for (var y = 0; y <= heightSegments; y++) {
                var t = y / heightSegments;
                for (var x = 0; x <= widthSegments; x++) {
                    var s = x / widthSegments;

                    positions.push([2 * s - 1, 2 * t - 1, 0]);
                    if (texcoords) {
                        texcoords.push([s, t]);
                    }
                    if (normals) {
                        normals.push([0, 0, 1]);
                    }
                    if (x < widthSegments && y < heightSegments) {
                        var i = x + y * (widthSegments + 1);
                        faces.push([i, i + 1, i + widthSegments + 1]);
                        faces.push([i + widthSegments + 1, i + 1, i + widthSegments + 2]);
                    }
                }
            }

            this.boundingBox = new BoundingBox();
            this.boundingBox.min.set(-1, -1, 0);
            this.boundingBox.max.set(1, 1, 0);
        }
    })

    return Plane;
});
define('qtek/compositor/Pass',['require','../core/Base','../Scene','../camera/Orthographic','../geometry/Plane','../Shader','../Material','../Mesh','../Scene','../Texture','../core/glinfo','../core/glenum'],function(require) {

    var Base = require("../core/Base");
    var Scene = require("../Scene");
    var OrthoCamera = require('../camera/Orthographic');
    var Plane = require('../geometry/Plane');
    var Shader = require('../Shader');
    var Material = require('../Material');
    var Mesh = require('../Mesh');
    var Scene = require('../Scene');
    var Texture = require('../Texture');
    var glinfo = require('../core/glinfo');
    var glenum = require('../core/glenum');

    var planeGeo = new Plane();
    var mesh = new Mesh({
        geometry : planeGeo
    });
    var camera = new OrthoCamera();

    /**
     * @constructor qtek.compositor.Pass
     * @extends qtek.core.Base
     */
    var Pass = Base.derive(function() {
        return /** @lends qtek.compositor.Pass# */ {
            /**
             * Fragment shader string
             * @type {string}
             */
            fragment : "",

            /**
             * @type {Object}
             */
            outputs : null,

            /**
             * @type {qtek.Material}
             */
            material : null
        }
    }, function() {

        var shader = new Shader({
            vertex : Shader.source('buildin.compositor.vertex'),
            fragment : this.fragment
        })
        var material = new Material({
            shader : shader
        });
        shader.enableTexturesAll();

        this.material = material;

    },
    /** @lends qtek.compositor.Pass.prototype */
    {
        /**
         * @param {string} name
         * @param {} value
         */
        setUniform : function(name, value) {
            var uniform = this.material.uniforms[name];
            if (uniform) {
                uniform.value = value;
            }
        },
        /**
         * @param  {string} name
         * @return {}
         */
        getUniform : function(name) {
            var uniform = this.material.uniforms[name];
            if (uniform) {
                return uniform.value;
            }
        },
        /**
         * @param  {qtek.Texture} texture
         * @param  {number} attachment
         */
        attachOutput : function(texture, attachment) {
            if (!this.outputs) {
                this.outputs = {};
            }
            attachment = attachment || glenum.COLOR_ATTACHMENT0;
            this.outputs[attachment] = texture;
        },
        /**
         * @param  {qtek.Texture} texture
         */
        detachOutput : function(texture) {
            for (var attachment in this.outputs) {
                if (this.outputs[attachment] === texture) {
                    this.outputs[attachment] = null;
                }
            }
        },

        bind : function(renderer, frameBuffer) {
            
            if (this.outputs) {
                for (var attachment in this.outputs) {
                    var texture = this.outputs[attachment];
                    if (texture) {
                        frameBuffer.attach(renderer.gl, texture, attachment);
                    }
                }
                frameBuffer.bind(renderer);
            }
        },

        unbind : function(renderer, frameBuffer) {
            frameBuffer.unbind(renderer);
        },
        /**
         * @param  {qtek.Renderer} renderer
         * @param  {qtek.FrameBuffer} [frameBuffer]
         */
        render : function(renderer, frameBuffer) {

            var _gl = renderer.gl;

            mesh.material = this.material;

            if (frameBuffer) {
                this.bind(renderer, frameBuffer);
                // MRT Support in chrome
                // https://www.khronos.org/registry/webgl/sdk/tests/conformance/extensions/ext-draw-buffers.html
                var ext = glinfo.getExtension(_gl, "EXT_draw_buffers");
                if (ext) {
                    var bufs = [];
                    for (var attachment in this.outputs) {
                        attachment = +attachment;
                        if (attachment >= _gl.COLOR_ATTACHMENT0 && attachment <= _gl.COLOR_ATTACHMENT0 + 8) {
                            bufs.push(attachment);
                        }
                    }
                    ext.drawBuffersEXT(bufs);
                }
            }

            this.trigger("beforerender", this, renderer);
            // Don't clear in each pass, let the color overwrite the buffer
            _gl.disable(_gl.BLEND);
            _gl.clear(_gl.DEPTH_BUFFER_BIT);
            renderer.renderQueue([mesh], camera);
            this.trigger("afterrender", this, renderer);

            if (frameBuffer) {
                this.unbind(renderer, frameBuffer);
            }
        }
    })

    return Pass;
});
define('qtek/FrameBuffer',['require','./core/Base','./texture/Texture2D','./texture/TextureCube','./core/glinfo','./core/glenum','./core/Cache'],function(require) {
    
    
    
    var Base = require("./core/Base");
    var Texture2D = require("./texture/Texture2D");
    var TextureCube = require("./texture/TextureCube");
    var glinfo = require('./core/glinfo');
    var glenum = require("./core/glenum");
    var Cache = require("./core/Cache");

    /**
     * @constructor qtek.FrameBuffer
     * @extends qtek.core.Base
     */
    var FrameBuffer = Base.derive(
    /** @lends qtek.FrameBuffer# */
    {
        /**
         * If use depth buffer
         * @type {boolean}
         */
        depthBuffer : true,

        //Save attached texture and target
        _attachedTextures : null,

        _width : 0,
        _height : 0,
        _depthTextureAttached : false,

        _renderBufferWidth : 0,
        _renderBufferHeight : 0,

        _binded : false,
    }, function() {
        // Use cache
        this._cache = new Cache();

        this._attachedTextures = {};
    },
    
    /**@lends qtek.FrameBuffer.prototype. */
    {

        /**
         * Resize framebuffer.
         * It is not recommanded use this methods to change the framebuffer size because the size will still be changed when attaching a new texture
         * @param  {number} width
         * @param  {number} height
         */
        resize : function(width, height) {
            this._width = width;
            this._height = height;
        },

        /**
         * Bind the framebuffer to given renderer before rendering
         * @param  {qtek.Renderer} renderer
         */
        bind : function(renderer) {

            var _gl = renderer.gl;

            if (!this._binded) {
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.getFrameBuffer(_gl));
                this._binded = true;
            }

            this._cache.put("viewport", renderer.viewport);
            renderer.setViewport(0, 0, this._width, this._height);
            // Create a new render buffer
            if (this._cache.miss("renderbuffer") && this.depthBuffer && ! this._depthTextureAttached) {
                this._cache.put("renderbuffer", _gl.createRenderbuffer());
            }
            if (! this._depthTextureAttached && this.depthBuffer) {

                var width = this._width;
                var height = this._height;
                var renderbuffer = this._cache.get('renderbuffer');

                if (width !== this._renderBufferWidth
                     || height !== this._renderBufferHeight) {
                    _gl.bindRenderbuffer(_gl.RENDERBUFFER, renderbuffer);
                    _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, width, height);
                    this._renderBufferWidth = width;
                    this._renderBufferHeight = height;
                    _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);                 
                }
                if (! this._cache.get("renderbuffer_attached")) {
                    _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, renderbuffer);
                    this._cache.put("renderbuffer_attached", true);
                }
            }
        },
        /**
         * Unbind the frame buffer after rendering
         * @param  {qtek.Renderer} renderer
         */
        unbind : function(renderer) {
            var _gl = renderer.gl;
            
            _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
            this._binded = false;

            this._cache.use(_gl.__GLID__);
            var viewport = this._cache.get("viewport");
            // Reset viewport;
            if (viewport) {
                renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
            }

            // Because the data of texture is changed over time,
            // Here update the mipmaps of texture each time after rendered;
            for (var attachment in this._attachedTextures) {
                var texture = this._attachedTextures[attachment];
                if (! texture.NPOT && texture.useMipmap) {
                    var target = texture instanceof TextureCube ? _gl.TEXTURE_CUBE_MAP : _gl.TEXTURE_2D;
                    _gl.bindTexture(target, texture.getWebGLTexture(_gl));
                    _gl.generateMipmap(target);
                    _gl.bindTexture(target, null);
                }
            }
        },

        getFrameBuffer : function(_gl) {

            this._cache.use(_gl.__GLID__);

            if (this._cache.miss("framebuffer")) {
                this._cache.put("framebuffer", _gl.createFramebuffer());
            }

            return this._cache.get("framebuffer");
        },

        /**
         * Attach a texture(RTT) to the framebuffer
         * @param  {WebGLRenderingContext} _gl
         * @param  {qtek.Texture} texture
         * @param  {number} [attachment]
         * @param  {number} [target]
         * @param  {number} [mipmapLevel]
         */
        attach : function(_gl, texture, attachment, target, mipmapLevel) {

            if (! texture.width) {
                throw new Error("The texture attached to color buffer is not a valid.");
            }

            if (!this._binded) {
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.getFrameBuffer(_gl));
                this._binded = true;
            }

            this._width = texture.width;
            this._height = texture.height;

            // If the depth_texture extension is enabled, developers
            // Can attach a depth texture to the depth buffer
            // http://blog.tojicode.com/2012/07/using-webgldepthtexture.html
            attachment = attachment || _gl.COLOR_ATTACHMENT0;
            target = target || _gl.TEXTURE_2D;
            mipmapLevel = mipmapLevel || 0;
            
            if (attachment === _gl.DEPTH_ATTACHMENT) {

                var extension = glinfo.getExtension(_gl, "WEBGL_depth_texture");

                if (!extension) {
                    console.error(" Depth texture is not supported by the browser ");
                    return;
                }
                if (texture.format !== glenum.DEPTH_COMPONENT) {
                    console.error("The texture attached to depth buffer is not a valid.");
                    return;
                }
                this._cache.put("renderbuffer_attached", false);
                this._depthTextureAttached = true;
            }

            this._attachedTextures[attachment] = texture;

            _gl.framebufferTexture2D(_gl.FRAMEBUFFER, attachment, target, texture.getWebGLTexture(_gl), mipmapLevel);
        },

        detach : function() {},
        /**
         * Dispose
         * @param  {WebGLRenderingContext} _gl
         */
        dispose : function(_gl) {
            this._cache.use(_gl.__GLID__);

            if (this._cache.get("renderbuffer"))
                _gl.deleteRenderbuffer(this._cache.get("renderbuffer"));
            if (this._cache.get("framebuffer"))
                _gl.deleteFramebuffer(this._cache.get("framebuffer"));

            this._cache.deleteContext(_gl.__GLID__);
        }
    });

    FrameBuffer.COLOR_ATTACHMENT0 = glenum.COLOR_ATTACHMENT0;
    FrameBuffer.DEPTH_ATTACHMENT = glenum.DEPTH_ATTACHMENT;
    FrameBuffer.STENCIL_ATTACHMENT = glenum.STENCIL_ATTACHMENT;
    FrameBuffer.DEPTH_STENCIL_ATTACHMENT = glenum.DEPTH_STENCIL_ATTACHMENT;

    return FrameBuffer;
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
define('qtek/core/request',['require'],function(require) {

    function get(options) {

        var xhr = new XMLHttpRequest();

        xhr.open("get", options.url);
        // With response type set browser can get and put binary data
        // https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Sending_and_Receiving_Binary_Data
        // Default is text, and it can be set
        // arraybuffer, blob, document, json, text
        xhr.responseType = options.responseType || "text";

        if (options.onprogress) {
            //https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Using_XMLHttpRequest
            xhr.onprogress = function(e) {
                if (e.lengthComputable) {
                    var percent = e.loaded / e.total;
                    options.onprogress(percent, e.loaded, e.total);
                } else {
                    options.onprogress(null);
                }
            }
        }
        xhr.onload = function(e) {
            options.onload && options.onload(xhr.response);
        }
        if (options.onerror) {
            xhr.onerror = options.onerror;
        }
        xhr.send(null);
    }

    return {
        get : get
    }
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
define( 'qtek-2d/qtek-2d',['require','qtek-2d/CanvasRenderer','qtek-2d/Gradient','qtek-2d/LinearGradient','qtek-2d/Node','qtek-2d/Pattern','qtek-2d/RadialGradient','qtek-2d/Style','qtek-2d/context/BezierCurveSegment','qtek-2d/context/CanvasElement','qtek-2d/context/CanvasImage','qtek-2d/context/CanvasPath','qtek-2d/context/CanvasPointCloud','qtek-2d/context/CanvasSubpath','qtek-2d/context/Context2D','qtek-2d/context/DeferredPainter','qtek-2d/context/DrawingStyle','qtek-2d/context/Geometry2D','qtek-2d/context/ImagePrimitive','qtek-2d/context/LineSegment','qtek-2d/context/Painter','qtek-2d/context/PathPrimitive','qtek-2d/context/PointCloudPrimitive','qtek-2d/context/Polygon','qtek-2d/context/Primitive','qtek-2d/context/States','qtek-2d/context/tool/CachedList','qtek-2d/context/tool/GJK','qtek-2d/context/tool/ImageAtlas','qtek-2d/context/tool/SplayTree','qtek-2d/context/tool/Triangulation2','qtek-2d/context/tool/color','qtek-2d/context/tool/math','qtek-2d/loader/SVG','qtek-2d/picking/Box','qtek-2d/picking/Pixel','qtek-2d/shape/Circle','qtek-2d/shape/Ellipse','qtek-2d/shape/Image','qtek-2d/shape/Line','qtek-2d/shape/Path','qtek-2d/shape/Polygon','qtek-2d/shape/Rectangle','qtek-2d/shape/RoundedRectangle','qtek-2d/shape/SVGPath','qtek-2d/shape/Text','qtek-2d/shape/TextBox','qtek-2d/util'],function(require){
    
    var exportsObject = {
	"CanvasRenderer": require('qtek-2d/CanvasRenderer'),
	"Gradient": require('qtek-2d/Gradient'),
	"LinearGradient": require('qtek-2d/LinearGradient'),
	"Node": require('qtek-2d/Node'),
	"Pattern": require('qtek-2d/Pattern'),
	"RadialGradient": require('qtek-2d/RadialGradient'),
	"Style": require('qtek-2d/Style'),
	"context": {
		"BezierCurveSegment": require('qtek-2d/context/BezierCurveSegment'),
		"CanvasElement": require('qtek-2d/context/CanvasElement'),
		"CanvasImage": require('qtek-2d/context/CanvasImage'),
		"CanvasPath": require('qtek-2d/context/CanvasPath'),
		"CanvasPointCloud": require('qtek-2d/context/CanvasPointCloud'),
		"CanvasSubpath": require('qtek-2d/context/CanvasSubpath'),
		"Context2D": require('qtek-2d/context/Context2D'),
		"DeferredPainter": require('qtek-2d/context/DeferredPainter'),
		"DrawingStyle": require('qtek-2d/context/DrawingStyle'),
		"Geometry2D": require('qtek-2d/context/Geometry2D'),
		"ImagePrimitive": require('qtek-2d/context/ImagePrimitive'),
		"LineSegment": require('qtek-2d/context/LineSegment'),
		"Painter": require('qtek-2d/context/Painter'),
		"PathPrimitive": require('qtek-2d/context/PathPrimitive'),
		"PointCloudPrimitive": require('qtek-2d/context/PointCloudPrimitive'),
		"Polygon": require('qtek-2d/context/Polygon'),
		"Primitive": require('qtek-2d/context/Primitive'),
		"States": require('qtek-2d/context/States'),
		"tool": {
			"CachedList": require('qtek-2d/context/tool/CachedList'),
			"GJK": require('qtek-2d/context/tool/GJK'),
			"ImageAtlas": require('qtek-2d/context/tool/ImageAtlas'),
			"SplayTree": require('qtek-2d/context/tool/SplayTree'),
			"Triangulation2": require('qtek-2d/context/tool/Triangulation2'),
			"color": require('qtek-2d/context/tool/color'),
			"math": require('qtek-2d/context/tool/math')
		}
	},
	"loader": {
		"SVG": require('qtek-2d/loader/SVG')
	},
	"picking": {
		"Box": require('qtek-2d/picking/Box'),
		"Pixel": require('qtek-2d/picking/Pixel')
	},
	"shape": {
		"Circle": require('qtek-2d/shape/Circle'),
		"Ellipse": require('qtek-2d/shape/Ellipse'),
		"Image": require('qtek-2d/shape/Image'),
		"Line": require('qtek-2d/shape/Line'),
		"Path": require('qtek-2d/shape/Path'),
		"Polygon": require('qtek-2d/shape/Polygon'),
		"Rectangle": require('qtek-2d/shape/Rectangle'),
		"RoundedRectangle": require('qtek-2d/shape/RoundedRectangle'),
		"SVGPath": require('qtek-2d/shape/SVGPath'),
		"Text": require('qtek-2d/shape/Text'),
		"TextBox": require('qtek-2d/shape/TextBox')
	},
	"util": require('qtek-2d/util')
};
    
    return exportsObject;
});
define('qtek-2d', ['qtek-2d/qtek-2d'], function (main) { return main; });


qtek2d = require('qtek/2d/qtek-2d');

for(var name in qtek2d){
    _exports[name] = qtek2d[name];
}

});