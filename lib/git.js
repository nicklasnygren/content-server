const REPO_DIR = './repo';

var debug      = require('debug')('git');
var assign     = require('object-assign');

// Git utils
var Repository = require('nodegit').Repository;
var Signature  = require('nodegit').Signature;
var Commit  = require('nodegit').Commit;
var latestOrgId, latestCommit;

module.exports = {
  commitBlob: function (pathInfo, blob) {
    var msg       = getCommitMessage(pathInfo, blob);;
    var committer = getSignature(blob);
    var repo;
    debug('Committing blob...');

    return Repository.open(REPO_DIR)
    .then(function (_repo) {
      var index, tree;
      repo = _repo;

      if (latestOrgId === blob.meta.org) {
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
          return repo.getTree(_treeOid);
        })
        .then(function (_tree) {
          tree = _tree;
          return repo.getHeadCommit();
        })
        .then(function (latestCommit) {
          try {
            return latestCommit.amend(
              tree.id(),
              'HEAD',
              committer,
              committer,
              'UTF-8',
              msg,
              tree
            );
          } catch (err) {
            debug(err);
          }
        }, debug);
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

