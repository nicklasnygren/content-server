const REPO_DIR = './repo';

var debug      = require('debug')('git');
var assign     = require('object-assign');
var Repository = require('nodegit').Repository;
var Commit     = require('nodegit').Commit;
var Signature  = require('nodegit').Signature;

module.exports = {
  commitBlob: function (pathInfo, blob) {
    var msg       = getCommitMessage(pathInfo, blob);;
    var committer = getSignature(blob);
    debug('Committing blob...');

    return Repository.open(REPO_DIR)
    .then(function (repo) {
      return new Promise(function (resolve, reject) {
        repo.createCommitOnHead(
          pathInfo.path,
          committer,
          committer,
          msg,
          function (err, oid) {
            if (err) {
              debug(err);
            }
            resolve(oid.toString());
          }
        );
      });
    })
    .then(function (hash) {
      debug(`Created commit with hash ${hash}`);
      return msg;
    });
  }
};

function getCommitMessage (pathInfo, blob) {
  var id = formatPath(blob.getParentString() + '.' + blob.meta.id);
  var verb = pathInfo.createdNewDir ? 'create' : 'update';
  return `${verb}(${id}): on org ${blob.meta.org}`;
};

function formatPath (rawPath) {
  res = rawPath;
  res = res.toLowerCase();
  res = res.replace(/\s+/g, '_');
  return res;
};

function getSignature (blob) {
  debug (blob.meta);
  return Signature.now(
    blob.meta.committer.name,
    blob.meta.committer.email
  );
};

