var assign = require('object-assign');

var blob = (function () {
  var _blob = {};

}());

module.exports = function parseBlob (requestBody) {
  res = assign({}, requestBody);

  Object.defineProperty(res, 'parentId', {
    get: function () {
      var type = this.meta.isCustom ? 'custom' : 'core';
      return type + '.' + this.meta.parentId;
    }
  });

  return res;
};

