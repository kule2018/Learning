function remove(arr, item) {
    if (arr.length) {
        var index = arr.indexOf(item);
        if (index > -1) {
            return arr.splice(index, 1);
        }
    }
}

/**
 * Parse simple path.
 */
var bailRE = /[^\w.$]/;
function parsePath(path) {
    if (bailRE.test(path)) {
        return;
    }
    var segments = path.split('.');
    return function (obj) {
        for (var i = 0; i < segments.length; i++) {
            if (!obj) return;
            obj = obj[segments[i]];
        }
        return obj;
    };
}

/**
 * Check if a string starts with $ or _
 */
function isReserved(str) {
    var c = (str + '').charCodeAt(0);
    return c === 0x24 || c === 0x5F;
}

function noop() {}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var uid = 0;

var Dep = function () {
    function Dep() {
        classCallCheck(this, Dep);

        this.id = uid++;
        this.subs = [];
    }

    createClass(Dep, [{
        key: 'addSubs',
        value: function addSubs(watcher) {
            this.subs.push(watcher);
        }
    }, {
        key: 'removeSub',
        value: function removeSub(watcher) {
            remove(this.subs, watcher);
        }
    }, {
        key: 'depend',
        value: function depend() {
            if (Dep.target) {
                var watcher = Dep.target;
                this.addSubs(watcher);
            }
        }
    }, {
        key: 'notify',
        value: function notify() {
            var subs = this.subs.slice();
            for (var i = 0, l = subs.length; i < l; i++) {
                subs[i].update();
            }
        }
    }]);
    return Dep;
}();


Dep.target = null;
var targetStack = [];

function pushTarget(_target) {
    if (Dep.target) targetStack.push(Dep.target);
    Dep.target = _target;
}

function popTarget() {
    Dep.target = targetStack.pop();
}

/**
 * 观察数据变化
 */
var Observer = function () {
    function Observer(value) {
        classCallCheck(this, Observer);

        this.value = value;
        this.walk(value);
    }

    createClass(Observer, [{
        key: "walk",
        value: function walk(obj) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                defineReactive(obj, keys[i]);
            }
        }
    }]);
    return Observer;
}();
/**
 * 观察数据
 * @param {*} value 
 */
function observe(value) {
    var ob = new Observer(value);
    return ob;
}

/**
 * 定义响应式
 * @param {} obj 
 * @param {*} key 
 */
function defineReactive(obj, key) {
    console.log("defineReactive  obj -> " + obj + " , key -> " + key);
    var property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
        return;
    }

    var val = void 0;
    // cater for pre-defined getter/setters
    var getter = property && property.get;
    var setter = property && property.set;
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key];
    }

    var dep = new Dep();

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function get$$1() {
            var value = getter ? getter.call(obj) : val;
            if (Dep.target) {
                dep.depend();
            }
            return value;
        },
        set: function set$$1(newVal) {
            var value = getter ? getter.call(obj) : val;
            if (newVal === value || newVal !== newVal && value !== value) {
                return;
            }
            if (setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }
            dep.notify();
        }
    });
}

var Watcher = function () {
    function Watcher(options) {
        classCallCheck(this, Watcher);
        var vm = options.vm,
            cb = options.cb,
            expOrFn = options.expOrFn;

        this.vm = vm;
        this.expOrFn = expOrFn;
        this.cb = cb;
        this.getter = parsePath(this.expOrFn);
        this.value = this.get();
    }

    createClass(Watcher, [{
        key: 'update',
        value: function update() {
            var value = this.get();
            var oldValue = this.value;
            this.value = value;
            this.cb.call(this.vm, value, oldValue);
        }
    }, {
        key: 'get',
        value: function get$$1() {
            pushTarget(this);
            var vm = this.vm;
            var value = this.getter.call(vm, vm);
            popTarget();
            return value;
        }
    }, {
        key: 'teardown',
        value: function teardown() {}
    }]);
    return Watcher;
}();

/**
 * Vin类
 */

var Vin = function () {
    function Vin(options) {
        classCallCheck(this, Vin);

        this.init(options);
    }

    createClass(Vin, [{
        key: 'init',
        value: function init(options) {
            console.log('init');
            this.$options = options;
            this.initData();

            var watchers = this.$options.watch;
            this.initWatch(this, watchers);
        }
    }, {
        key: 'initData',
        value: function initData() {
            var data = this.$options.data;
            var vm = this;
            vm._data = data;
            var keys = Object.keys(data);
            var i = keys.length;
            while (i--) {
                var key = keys[i];
                if (!isReserved(key)) {
                    proxy(vm, '_data', key);
                }
            }
            observe(data);
        }
    }, {
        key: 'initWatch',
        value: function initWatch(vm, watch) {
            for (var key in watch) {
                var handler = watch[key];
                createWatcher(vm, key, handler);
            }
        }
    }, {
        key: '$watch',
        value: function $watch(expOrFn, cb) {
            var vm = this;
            var watcher = new Watcher({ vm: vm, cb: cb, expOrFn: expOrFn });
            return function unwatchFn() {
                watcher.teardown();
            };
        }
    }]);
    return Vin;
}();

var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
};

function proxy(target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter() {
        return this[sourceKey][key];
    };
    sharedPropertyDefinition.set = function proxySetter(val) {
        this[sourceKey][key] = val;
    };
    Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createWatcher(vm, expOrFn, handler) {
    return vm.$watch(expOrFn, handler);
}

export default Vin;
