const REPO_DIR   = './repo';
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

var debug      = require('debug')('git');
var Repository = require('nodegit').Repository;
var Signature  = require('nodegit').Signature;
var Diff       = require('nodegit').Diff;

function gitDiff () {
  var repo, tree, index, res;

  return Repository.open(REPO_DIR)
  .then(function (_repo) {
    repo = _repo;
    return repo.openIndex()
  })
  .then(function(_index) {
    index = _index;
    index.read(1);
    return index.addAll();
  })
  .then(function() {
    index.write();
    return index.writeTree();
  })
  .then(function (treeOid) {
    return repo.getTree(treeOid);
  })
  .then(function (_tree) {
    tree = _tree;
    return repo.getHeadCommit();
  })
  .then(function (latestCommit) {
    return latestCommit.getTree();
  })
  .then(function (_tree) {
    return tree.diff(_tree);
  })
  .then(function (_diff) {
    res = _diff;
    return index.removeAll();
  })
  .then(function () {
    return res;
  });
};

function gitDiffBoolean () {
  return gitDiff()
  .then(function (diff) {
    return !!diff.patches().length;
  });
};

module.exports = {
  commit: {

    // Create a new commit and update HEAD ref
    head: function (path, committer, msg) {
      if (!(committer instanceof Signature)) {
        committer = getSignature(committer);
      }

      return Repository.open(REPO_DIR)
      .then(function (repo) {
        return repo.createCommitOnHead(
          path,
          committer,
          committer,
          msg
        );
      });
    },

    // Amend HEAD ref
    amend: function (path, committer, msg) {
      var repo, index, tree;

      if (!(committer instanceof Signature)) {
        committer = getSignature(committer);
      }

      return Repository.open(REPO_DIR)
      .then(function (_repo) {
        repo = _repo;
        return repo.openIndex()
      })
      .then(function(index_) {
        index = index_;
        index.read(1);
        return index.addAll();
      })
      .then(function() {
        index.write();
        return index.writeTree();
      })
      .then(function (treeOid) {
        return repo.getTree(treeOid);
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
  },
  diff: {
    diff: gitDiff,
    bool: gitDiffBoolean
  }
};

function getSignature (authorObj) {
  return Signature.now(
    authorObj.name,
    authorObj.email
  );
};

