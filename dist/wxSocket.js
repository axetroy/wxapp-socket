(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var WxSocket = (function () {
    function WxSocket(config) {
        this.config = config;
        this.ALL = 'ALL';
        this.retryCount = 0;
        this.listener = {};
        this.promiseMaps = {};
        this.socketOpen = false;
        this.messageQueue = [];
        this.config.retryInterval = this.config.retryInterval && this.config.retryInterval > 100 ? this.config.retryInterval : 3000;
        this.listen().connect().afterConnect();
    }
    /**
     * 发送消息
     * @param msg {*}
     * @param [config]  {*}
     * @returns {Promise<T>}
     */
    WxSocket.prototype.send = function (msg, config) {
        if (config === void 0) { config = {}; }
        var content = this.wrapMsg(msg);
        var WxSocket = this;
        return new Promise(function (resolve, reject) {
            WxSocket.promiseMaps[content.id] = {
                resolve: resolve,
                reject: reject,
                promise: this
            };
            // socket未连接上，先放到消息队列里面
            if (!WxSocket.socketOpen) {
                WxSocket.messageQueue.push({
                    content: content,
                    config: config,
                    timestamp: new Date().getTime()
                });
            }
            else {
                try {
                    wx.sendSocketMessage({
                        data: JSON.stringify(content),
                        success: function () {
                            WxSocket.finishRequest(content.id);
                            resolve();
                        },
                        fail: function () {
                            WxSocket.finishRequest(content.id);
                            reject();
                        }
                    });
                }
                catch (err) {
                    reject(err);
                    WxSocket.finishRequest(content.id);
                }
            }
        });
    };
    /**
     * 监听消息
     * @param typeOrCallBack
     * @param callback
     * @returns {()=>T[]}
     */
    WxSocket.prototype.on = function (typeOrCallBack, callback) {
        var _this = this;
        var type;
        switch (arguments.length) {
            case 1:
                type = this.ALL;
                callback = arguments[0];
                break;
            case 2:
                type = arguments[0];
                callback = arguments[1];
                break;
            default:
                throw new Error('Invalid argument');
        }
        if (!WxSocket.helper.isString(type))
            throw new Error('type argument must be a string');
        if (!WxSocket.helper.isFunction(callback))
            throw new Error('callback argument must be a function');
        this.listener[type] = this.listener[type] || [];
        this.listener[type].push(callback);
        var index = this.listener[type].length - 1;
        return function () {
            return _this.listener[type].splice(index, 1);
        };
    };
    WxSocket.prototype.listen = function () {
        var _this = this;
        wx.onSocketOpen(function () {
            console.info('WebSocket已连接');
            _this.retryCount = 0;
            _this.socketOpen = true;
            _this.messageQueue.forEach(function (queue) { return _this.send(queue.content, queue.config); });
            _this.messageQueue = [];
        });
        wx.onSocketError(function () {
            console.error('WebSocket连接打开失败，请检查！');
            _this.socketOpen = false;
        });
        return this;
    };
    WxSocket.prototype.connect = function () {
        wx.connectSocket({
            url: this.config.url,
            header: {
                'content-type': 'application/json'
            }
        });
        return this;
    };
    WxSocket.prototype.afterConnect = function () {
        var _this = this;
        wx.onSocketClose(function () {
            _this.socketOpen = false;
            setTimeout(function () { return _this.retry(); }, _this.config.retryInterval);
        });
        wx.onSocketMessage(function (_a) {
            var data = _a.data;
            try {
                data = JSON.parse(data);
            }
            catch (err) {
            }
            // resolve the request promise
            var deferred = _this.promiseMaps[data.id];
            if (data.id && deferred) {
                _this.finishRequest(data.id);
                deferred.resolve.call(deferred.promise, data);
            }
            var callbacks = [];
            for (var type in _this.listener) {
                if (_this.listener.hasOwnProperty(type)) {
                    data.type === type && (callbacks = _this.listener[type]);
                }
            }
            callbacks = (_this.listener[_this.ALL] || []).concat(callbacks);
            callbacks.forEach(function (func) { return typeof func === 'function' && func(data); });
        });
        return this;
    };
    /**
     * 包装消息
     * @param msg
     * @returns {*}
     * @private
     */
    WxSocket.prototype.wrapMsg = function (msg) {
        if (WxSocket.helper.isPlainObject(msg)) {
            if (msg.type) {
                !msg.id ? msg.id = WxSocket.helper.id : void 0;
                return msg;
            }
            else {
                return this.wrapMsg({ type: 'message', msg: msg, id: WxSocket.helper.id });
            }
        }
        else {
            return this.wrapMsg({ type: 'message', msg: msg, id: WxSocket.helper.id });
        }
    };
    WxSocket.prototype.finishRequest = function (requestID) {
        this.promiseMaps[requestID] = null;
        delete this.promiseMaps[requestID];
        return this;
    };
    /**
     * 断线重连
     * @returns {WxSocket}
     */
    WxSocket.prototype.retry = function () {
        // 服务器已经连上，或者超出了最大重连次数
        if (this.socketOpen || this.config.retryTimes > 0 && this.config.retryTimes <= this.retryCount)
            return;
        this.retryCount += 1;
        console.warn("\u7B2C[ " + this.retryCount + " ]\u6B21\u5C1D\u8BD5\u91CD\u8FDEWebSocket");
        this.connect();
        return this;
    };
    return WxSocket;
}());
WxSocket.helper = {
    messageIndex: 0,
    isFunction: function (any) {
        return typeof any === 'function';
    },
    isString: function (any) {
        return Object.prototype.toString.call(any) === '[object String]';
    },
    isObject: function (any) {
        return typeof any === 'object' && any !== null;
    },
    isPlainObject: function (any) {
        return Object.prototype.toString.call(any) === '[object Object]';
    },
    get nextId() {
        return this.messageIndex++;
    },
    get id() {
        return Date.now() + '.' + this.nextId;
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WxSocket;


/***/ })
/******/ ]);
});