var debug  = require('debug')('RepoUtils');
var glob   = require('glob');
var rimraf = require('rimraf');
var path   = require('path');

module.exports = function RepoUtil (app) {
  const REPO = app.get('repo'); 
  const TEST = app.get('test'); 

  function deleteCard (orgId, cardId) {
    return getCardPath(orgId, cardId)
    .then(function (_path) {
      // Don't rimraf if running tests
      if (TEST) { return !!_path; }

      return !!_path && rimraf(_path, function (err) {
        if (err) {
          return Promise.reject(err);
        }
        return true;
      });
    });
  }

  function getCardPath (orgId, cardId) {
    var cardBasePath = path.resolve([
      REPO.path,
      'orgs',
      orgId.toLowerCase(),
      'custom'
    ].join('/'));

    return new Promise(function (resolve, reject) {
      return glob(cardBasePath + '/**/' + cardId, function (err, paths) {
        if (err) {
          return reject(err);
        }
        return resolve(paths.length ? paths[0] : false);
      });
    });
  }

  function deleteOrg (orgId) {
    var _path = path.resolve([
      REPO.path,
      'orgs',
      orgId.toLowerCase()
    ].join('/'));

    return new Promise(function(resolve, reject) {
      if (TEST) { return resolve(!!_path); }

      return !!_path && rimraf(_path, function(err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  return {
    deleteCard:  deleteCard,
    getCardPath: getCardPath,
    deleteOrg:   deleteOrg
  };
};

