// json-patch.js 0.3
// (c) 2013 Joachim Wester
// MIT license

module jsonpatch {

  var objOps = {
    add: function(obj,key) {
      obj[key] = this.value;
      return true;
    },
    remove: function(obj,key) {
      delete obj[key];
      return true;
    },
    replace: function(obj,key) {
       obj[key] = this.value;
       return true;
    },
    move: function(obj,key,tree) {
      var temp : any = {op:"_get",path:this.from};
      apply(tree,[temp]);
      apply(tree,[{op:"remove",path:this.from}]);
      apply(tree,[{op:"add",path:this.path,value:temp.value}]);
      return true;
    },
    copy: function(obj,key,tree) {
      var temp : any = {op:"_get",path:this.from};
      apply(tree,[temp]);
      apply(tree,[{op:"add",path:this.path,value:temp.value}]);
      return true;
    },
    test: function(obj,key) {
      return(JSON.stringify(obj[key])===JSON.stringify(this.value));
    },
    _get: function(obj,key) { this.value = obj[key]; }
  };

  var arrOps = {
    add: function(arr,i) { arr.splice(i,0,this.value); },
    remove: function(arr,i) { arr.splice(i,1); },
    replace: function(arr,i) { arr[i] = this.value; },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
  };

  /// Apply a json-patch operation on an object tree
  export function apply( tree : any, patches : any[], listen?:any ) : bool {
    var result = false;
    patches.forEach( function( patch : any ) {
      // Find the object
      var keys = patch.path.split('/');
      var obj = tree;
      var t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
      var len = keys.length;
      while (true) {
        if (Array.isArray(obj)) { //http://jsperf.com/isarray-shim/4
          var index = parseInt(keys[t], 10);
          t++;
          if (t >= len) {
            result = arrOps[patch.op].call(patch,obj,index,tree); // Apply patch
            break;
          }
          obj = obj[index];
        }
        else {
          var key = keys[t];
          if (key.indexOf('~') != -1)
            key = key.replace('~1', '/').replace('~0', '~'); // escape chars
          t++;
          if (t >= len) {
            result = objOps[patch.op].call(patch,obj,key,tree); // Apply patch
            break;
          }
          obj = obj[key];
        }
      }
    });
    return result;
  }
}