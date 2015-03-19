const REPO_DIR = './repo';

var debug      = require('debug')('git');
var assign     = require('object-assign');

// Git utils
var Repository = require('nodegit').Repository;
var Signature  = require('nodegit').Signature;
var latestOrgId, latestCommit;

module.exports = {
  commitBlob: function (pathInfo, blob) {
    var msg       = getCommitMessage(pathInfo, blob);;
    var committer = getSignature(blob);
    var repo;
    debug('Committing blob...');

    return Repository.open(REPO_DIR)
    .then(function (_repo) {
      var index, treeOid;
      repo = _repo;
      if (latestCommit && latestOrgId === blob.meta.org) {
        debug('Same orgId as last blob. Amending HEAD...');
        return repo.openIndex()
        .then(function(index_) {
          index = index_;
          index.read(1);
          return index.addAll();
        })
        .then(function() {
          index.write();
          return index.writeTree();
        })
        .then(function (_treeOid) {
          treeOid = _treeOid;
          return latestCommit.parents();
        })
        .then(function (parents) {
          try {
            debug(parents);
            return repo.createCommit(
              'HEAD',
              committer,
              committer,
              msg + ' (edit)',
              treeOid,
              parents
            );
          } catch (err) {
            debug(err);
          }
        });
      }
      else {
        return repo.createCommitOnHead(
          pathInfo.path,
          committer,
          committer,
          msg
        );
      }
    })
    .then(function (oid) {
      latestOrgId = blob.meta.org;
      repo.getCommit(oid.toString())
      .then(function (commit) {
        latestCommit = commit;
      });
      return oid.toString();
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

