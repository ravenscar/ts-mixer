"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var isClass = require("is-class");
/**
 * Utility function that returns the full chain of prototypes (excluding Object.prototype) from the given prototype.
 * The order will be [proto, protoParent, protoGrandparent, ...]
 */
function getProtoChain(proto) {
    var protoChain = [];
    while (proto !== Object.prototype) {
        protoChain.push(proto);
        proto = Object.getPrototypeOf(proto);
    }
    return protoChain;
}
/**
 * Utility function that works like `Object.apply`, but copies properties with getters and setters properly as well.
 * Additionally gives the option to exclude properties by name.
 */
function copyProps(dest, src, exclude) {
    if (exclude === void 0) { exclude = []; }
    var props = Object.getOwnPropertyDescriptors(src);
    for (var _i = 0, exclude_1 = exclude; _i < exclude_1.length; _i++) {
        var prop = exclude_1[_i];
        delete props[prop];
    }
    Object.defineProperties(dest, props);
}
function createMixinClass(Base) {
    var ingredients = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        ingredients[_i - 1] = arguments[_i];
    }
    // Start building a class that represents the mixture of the given Base and Class
    var Mixed = /** @class */ (function (_super) {
        __extends(Mixed, _super);
        function Mixed() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _this = _super.apply(this, args) || this;
            for (var _a = 0, ingredients_1 = ingredients; _a < ingredients_1.length; _a++) {
                var constructor = ingredients_1[_a];
                // If the constructor is a callable JS function, we would prefer to apply it directly to `this`,
                if (!isClass(constructor))
                    constructor.apply(_this, args);
                // but if it's an ES6 class, we can't call it directly so we have to instantiate it and copy props
                else
                    copyProps(_this, new (constructor.bind.apply(constructor, [void 0].concat(args)))());
            }
            return _this;
        }
        return Mixed;
    }(Base));
    return Mixed;
}
function copyPrototypes(Mixed) {
    var ingredients = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        ingredients[_i - 1] = arguments[_i];
    }
    // Apply prototypes, including those up the chain
    var mixedClassProto = Mixed.prototype, appliedPrototypes = [];
    for (var _a = 0, ingredients_2 = ingredients; _a < ingredients_2.length; _a++) {
        var item = ingredients_2[_a];
        var protoChain = getProtoChain(item.prototype);
        // Apply the prototype chain in reverse order, so that old methods don't override newer ones; also make sure
        // that the same prototype is never applied more than once.
        for (var i = protoChain.length - 1; i >= 0; i--) {
            var newProto = protoChain[i];
            if (appliedPrototypes.indexOf(newProto) === -1) {
                copyProps(mixedClassProto, protoChain[i], ['constructor']);
                appliedPrototypes.push(newProto);
            }
        }
    }
}
function copyStatics(Mixed) {
    var ingredients = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        ingredients[_i - 1] = arguments[_i];
    }
    var _loop_1 = function (constructor) {
        var _loop_2 = function (prop) {
            if (!Mixed.hasOwnProperty(prop)) {
                Object.defineProperty(Mixed, prop, {
                    get: function () { return constructor[prop]; },
                    set: function (val) { constructor[prop] = val; },
                    enumerable: true,
                    configurable: false
                });
            }
        };
        for (var prop in constructor) {
            _loop_2(prop);
        }
    };
    // Mix static properties by linking to the original static props with getters/setters
    for (var _a = 0, ingredients_3 = ingredients; _a < ingredients_3.length; _a++) {
        var constructor = ingredients_3[_a];
        _loop_1(constructor);
    }
}
function Mixin() {
    var ingredients = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        ingredients[_i] = arguments[_i];
    }
    var Mixed = createMixinClass.apply(void 0, [/** @class */ (function () {
            function class_1() {
            }
            return class_1;
        }())].concat(ingredients));
    copyPrototypes.apply(void 0, [Mixed].concat(ingredients));
    copyStatics.apply(void 0, [Mixed].concat(ingredients));
    return Mixed;
}
exports.Mixin = Mixin;
function Augment(Base, Extra) {
    var Mixed = createMixinClass(Base, Extra);
    copyPrototypes(Base, Extra);
    copyStatics(Base, Extra);
    return Mixed;
}
exports.Augment = Augment;
/**
 * A decorator version of the `Mixin` function.  You'll want to use this instead of `Mixin` for mixing generic classes.
 */
var mix = function () {
    var ingredients = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        ingredients[_i] = arguments[_i];
    }
    // @ts-ignore
    return function (decoratedClass) { return Mixin.apply(void 0, (ingredients.concat([decoratedClass]))); };
};
exports.mix = mix;
/**
* A decorator version of the `Augment` function.  You'll want to use this instead of `Augment` for mixing generic classes.
*/
var base = function () {
    var ingredients = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        ingredients[_i] = arguments[_i];
    }
    return function (decoratedClass) {
        if (ingredients.length === 0) {
            return Mixin(decoratedClass);
        }
        var Base = ingredients.shift();
        // @ts-ignore
        var Mixed = Mixin.apply(void 0, (ingredients.concat([decoratedClass])));
        return Augment(Base, Mixed);
    };
};
exports.base = base;
