/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
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
var _hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(obj, key) {
    return _hasOwnProperty.call(obj, key);
}
export function _objectKeys(obj) {
    if (Array.isArray(obj)) {
        var keys = new Array(obj.length);
        for (var k = 0; k < keys.length; k++) {
            keys[k] = "" + k;
        }
        return keys;
    }
    if (Object.keys) {
        return Object.keys(obj);
    }
    var keys = [];
    for (var i in obj) {
        if (hasOwnProperty(obj, i)) {
            keys.push(i);
        }
    }
    return keys;
}
;
/**
* Deeply clone the object.
* https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
* @param  {any} obj value to clone
* @return {any} cloned obj
*/
export function _deepClone(obj) {
    switch (typeof obj) {
        case "object":
            return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
        case "undefined":
            return null; //this is how JSON.stringify behaves for array items
        default:
            return obj; //no need to clone primitives
    }
}
//3x faster than cached /^\d+$/.test(str)
export function isInteger(str) {
    var i = 0;
    var len = str.length;
    var charCode;
    while (i < len) {
        charCode = str.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) {
            i++;
            continue;
        }
        return false;
    }
    return true;
}
/**
* Escapes a json pointer path
* @param path The raw pointer
* @return the Escaped path
*/
export function escapePathComponent(path) {
    if (path.indexOf('/') === -1 && path.indexOf('~') === -1)
        return path;
    return path.replace(/~/g, '~0').replace(/\//g, '~1');
}
/**
 * Unescapes a json pointer path
 * @param path The escaped pointer
 * @return The unescaped path
 */
export function unescapePathComponent(path) {
    return path.replace(/~1/g, '/').replace(/~0/g, '~');
}
export function _getPathRecursive(root, obj) {
    var found;
    for (var key in root) {
        if (hasOwnProperty(root, key)) {
            if (root[key] === obj) {
                return escapePathComponent(key) + '/';
            }
            else if (typeof root[key] === 'object') {
                found = _getPathRecursive(root[key], obj);
                if (found != '') {
                    return escapePathComponent(key) + '/' + found;
                }
            }
        }
    }
    return '';
}
export function getPath(root, obj) {
    if (root === obj) {
        return '/';
    }
    var path = _getPathRecursive(root, obj);
    if (path === '') {
        throw new Error("Object not found in root");
    }
    return '/' + path;
}
/**
* Recursively checks whether an object has any undefined values inside.
*/
export function hasUndefined(obj) {
    if (obj === undefined) {
        return true;
    }
    if (obj) {
        if (Array.isArray(obj)) {
            for (var i = 0, len = obj.length; i < len; i++) {
                if (hasUndefined(obj[i])) {
                    return true;
                }
            }
        }
        else if (typeof obj === "object") {
            var objKeys = _objectKeys(obj);
            var objKeysLength = objKeys.length;
            for (var i = 0; i < objKeysLength; i++) {
                if (hasUndefined(obj[objKeys[i]])) {
                    return true;
                }
            }
        }
    }
    return false;
}
function patchErrorMessageFormatter(message, args) {
    var messageParts = [message];
    for (var key in args) {
        var value = typeof args[key] === 'object' ? JSON.stringify(args[key], null, 2) : args[key]; // pretty print
        if (typeof value !== 'undefined') {
            messageParts.push(key + ": " + value);
        }
    }
    return messageParts.join('\n');
}
var PatchError = /** @class */ (function (_super) {
    __extends(PatchError, _super);
    function PatchError(message, name, index, operation, tree) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, patchErrorMessageFormatter(message, { name: name, index: index, operation: operation, tree: tree })) || this;
        _this.name = name;
        _this.index = index;
        _this.operation = operation;
        _this.tree = tree;
        Object.setPrototypeOf(_this, _newTarget.prototype); // restore prototype chain, see https://stackoverflow.com/a/48342359
        _this.message = patchErrorMessageFormatter(message, { name: name, index: index, operation: operation, tree: tree });
        return _this;
    }
    return PatchError;
}(Error));
export { PatchError };
// exported for use in jasmine test
export var PROTO_ERROR_MSG = 'JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README';
export function isValidExtendedOpId(xid) {
    return typeof xid === 'string' && xid.length >= 3 && xid.indexOf('x-') === 0;
}
;
;
/**
 * attach/remove source tree to/from target tree at appropriate path.
 * modifies targetObj (in place) by reference.
 *
 * This is necessary to deal with JS "by value" semantics
 */
export function _graftTree(sourceObj, targetObj, pathComponents) {
    if (pathComponents.comps.length === 0) {
        // no changes
        return;
    }
    // traverse document trees until at the appropriate parent level
    var graftTgt = targetObj;
    var graft = sourceObj;
    var graftKey = '';
    // single component is top-level key
    if (pathComponents.comps.length === 1) {
        graftKey = pathComponents.comps[0];
        if (pathComponents.modType === 'graft') {
            graftTgt[graftKey] = graft[graftKey];
        }
        else {
            // top-level prune is a "best guess" that the provided key was removed from
            // the top-level object (we have no visibility into what the extended
            // operator has actually done since it comes from "user-space";
            // external to the extension api)
            // NOTE: pruning is here only to allow the extension api to
            // emulate the RFC api; user-defined operations may perform complex
            // removals, but they may not be visible during the prune process.
            // It is recommended that the user stick to the RFC 'remove' operation
            // and not implemennt their own removal operations in extended-space;
            // or at least limit removal to the provided path, and not perform other mutations
            // combined with removals
            if (Array.isArray(targetObj)) {
                graftTgt.splice(~~graftKey, 1);
            }
            else {
                delete graftTgt[graftKey];
            }
        }
        return;
    }
    for (var i = 0; i < pathComponents.comps.length; i++) {
        graftKey = pathComponents.comps[i];
        graft = graft[graftKey];
        // if there is no value in the target obj at the current key,
        // than this is a graft point
        if (pathComponents.modType === 'graft' && graftTgt[graftKey] === undefined) {
            // if both target and source are undefined - No Op
            if (graft === undefined) {
                return;
            }
            break;
        }
        // there was a removal; the graft point needs to be the 2nd to last path comp
        // a.k.a. the parent obj of the pruned key
        // in order to preserve additional structure that was not pruned
        if (i === pathComponents.comps.length - 2) {
            break;
        }
        graftTgt = graftTgt[graftKey];
    }
    // graft
    graftTgt[graftKey] = graft;
}
