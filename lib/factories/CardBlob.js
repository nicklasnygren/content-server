var debug        = require('debug')('CardBlob');
var assign       = require('object-assign');
var CardBlobPath = require('../factories/CardBlobPath');
var git          = require('../git');
var latestCommitMsg, latestOrgId;

var CardBlob = (function () {
  var blob = {};

  blob.getSource = function (property) {
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

  blob.getParentString = function () {
    if (this.meta.isLegacy) {
      return 'legacy';
    }
    var type = this.meta.isCustom ? 'custom' : 'core';
    return type + '.' + this.meta.parentId;
  };

  blob.saveAndCommit = function () {
    var blob = this;
    var path  = CardBlobPath(this);

    return path.save()
    .then(function (pathInfo) {
      var msg = getCommitMessage(pathInfo, blob);
      var method;

      debug('Saved blob files to ' + pathInfo.path);

      if (latestOrgId === blob.meta.org && latestCommitMsg === msg) {
        method = 'amend';
        debug('Amending blob...');
      }
      else {
        method = 'head';
        debug('Committing blob...');
      }

      return git.commit[method](pathInfo.path, blob.meta.committer, msg)
      .then(function () {
        latestOrgId = blob.meta.org;
        latestCommitMsg = msg;
        return msg;
      });
    })
  };

  return blob;
}());

module.exports = function parseBlob (requestBody) {
  return assign(Object.create(CardBlob), requestBody);
};

function getCommitMessage (pathInfo, blob) {
  if (blob.meta.isLegacy) {
    return 'Export org ' + blob.meta.org;
  }
  var id = formatPath(blob.getParentString() + '.' + blob.meta.id);
  var verb = pathInfo.createdNewDir ? 'create' : 'update';
  return `${verb}(${id}): on org ${blob.meta.org}`;
};

function formatPath (rawPath) {
  var res = rawPath;
  res = res.toLowerCase();
  res = res.replace(/\s+/g, '_');
  return res;
};
