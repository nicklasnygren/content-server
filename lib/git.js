const REPO_DIR   = './repo';
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

var debug = require('debug')('git');
var Git   = require('nodegit');

function gitCommitHead (path, committer, msg) {
  if (!(committer instanceof Git.Signature)) {
    committer = getSignature(committer);
  }

  return Git.Repository.open(REPO_DIR)
  .then(function (repo) {
    return repo.createCommitOnHead(
      path,
      committer,
      committer,
      msg
    );
  });
};

function gitCommitAmend (path, committer, msg) {
  var repo, index, tree;

  if (!(committer instanceof Git.Signature)) {
    committer = getSignature(committer);
  }

  return Git.Repository.open(REPO_DIR)
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
    return index.removeAll();
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

function gitDiff () {
  var repo, tree, index, res;

  return Git.Repository.open(REPO_DIR)
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
    return index.removeAll();
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
    head: gitCommitHead,
    amend: gitCommitAmend
  },
  diff: {
    diff: gitDiff,
    bool: gitDiffBoolean
  }
};

function getSignature (authorObj) {
  return Git.Signature.now(
    authorObj.name,
    authorObj.email
  );
};

