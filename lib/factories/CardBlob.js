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

      return git.diff.bool()
      .then(function (hasDiff) {
        if (!hasDiff) {
          return Promise.reject('Did not commit, since there was no patch to apply');
        }
        return git.commit[method](pathInfo.path, blob.meta.committer, msg)
      })
      .then(function () {
        latestOrgId = blob.meta.org;
        latestCommitMsg = msg;
        return msg;
      });
    })
  };

  return blob;
}());

function getCommitMessage (pathInfo, blob) {
  var cardName, verb;
  if (blob.meta.isLegacy) {
    return 'Export org ' + blob.meta.org;
  }
  verb = pathInfo.createdNewDir ? 'clone' : 'update';
  try {
    cardName = blob.source.meta.label;
  }
  catch (err) {
    debug(err);
    cardName = formatPath(blob.getParentString() + '.' + blob.meta.id);
  }
  return (
`${verb}(${cardName})

Clone Id: ${blob.meta.id}
Org Id:   ${blob.meta.org}`
  );
};

function formatPath (rawPath) {
  var res = rawPath;
  res = res.toLowerCase();
  res = res.replace(/\s+/g, '_');
  return res;
};

function CardBlobFactory (requestBody) {
  return assign(Object.create(CardBlob), requestBody);
};
CardBlobFactory.getCommitMessage = getCommitMessage;

module.exports = CardBlobFactory;
