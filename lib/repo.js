var debug  = require('debug')('RepoUtils');
var glob   = require('glob');
var rimraf = require('rimraf');

module.exports = function RepoUtil (app) {
  const REPO = app.get('repo'); 
  const TEST = app.get('test'); 

  function deleteCard (orgId, cardId) {
    return getCardPath(orgId, cardId)
    .then(function (_path) {
      // Don't rimraf if running tests
      if (TEST) { return !!_path; }

      !!_path && rimraf(_path, function (err) {
        if (err) {
          return Promise.reject(err);
        }
        return true;
      });
    });
  };

  function getCardPath (orgId, cardId) {
    var cardBasePath = [
      REPO.path,
      'orgs',
      orgId,
      'custom'
    ].join('/');

    return new Promise(function (resolve, reject) {
      return glob(cardBasePath + '/**/' + cardId, function (err, paths) {
        if (err) {
          return reject(err);
        }
        return resolve(paths.length ? paths[0] : false);
      });
    });
  };

  return {
    deleteCard:  deleteCard,
    getCardPath: getCardPath,
  };
};

