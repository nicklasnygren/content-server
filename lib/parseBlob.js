var assign = require('object-assign');

var blob = (function () {
  var _blob = {};

  _blob.getSource = function (property) {
    var data = this.source[property];
    var res;
    if (typeof data === 'object') {
      res = JSON.stringify(data, null, 2);
    }
    else {
      res = data;
    }
    return res;
  };

  _blob.getParentString = function () {
    var type = this.meta.isCustom ? 'custom' : 'core';
    return type + '.' + this.meta.parentId;
  };

  return _blob;
}());

module.exports = function parseBlob (requestBody) {
  res = assign(blob, requestBody);

  return res;
};

