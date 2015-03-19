const REPO_DIR          = './repo';

const TEMPLATE_FILENAME = 'template.html';
const QUERY_FILENAME    = 'query.js';
const META_FILENAME     = 'meta.json';
const SETTINGS_FILENAME = 'settings.json';

var fs = require('fs');
var debug = require('debug')('path');

module.exports = function (blob) {
  debug(blob);
  var orgId = blob.meta.org;
  var cloneId = blob.meta.id;
  var cloneParent = blob.meta.parentId;

  var orgPath      = getOrgPath(orgId);
  var customPath   = orgPath + '/custom';
  var clonePath    = customPath + '/' + blob.getParentString();
  var instancePath = clonePath + '/' + cloneId;

  function createBlobDir () {
    debug('creating blob path');
    return safeCreateDir(orgPath)
    .then(function () {
      return safeCreateDir(customPath);
    })
    .then(function () {
      return safeCreateDir(clonePath);
    })
    .then(function () {
      return safeCreateDir(instancePath);
    })
    .then(function () {
      return instancePath;
    });
  };

  function save () {
    debug('writing blob files');

    return createBlobDir()
    .then(function () {
      return Promise.all([
        writeFile(getFilePath(META_FILENAME),     blob.getSource('meta')),
        writeFile(getFilePath(SETTINGS_FILENAME), blob.getSource('settings')),
        writeFile(getFilePath(QUERY_FILENAME),    blob.getSource('query')),
        writeFile(getFilePath(TEMPLATE_FILENAME), blob.getSource('template'))
      ]);
    })
    .then(function () {
      return instancePath;
    });
  };

  function getFilePath (file) {
    return instancePath + '/' + file;
  };

  return {
    createBlobDir: createBlobDir,
    save: save,
  };
};

function getOrgPath (orgId) {
  return REPO_DIR + '/' + orgId;
};

function safeCreateDir (path) {
  return new Promise(function (resolve, reject) {
    fs.mkdir(formatPath(path), function (err) {
      if (err) {
        debug(err);
      }
      resolve();
    });
  });
};

function writeFile (path, data) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(formatPath(path), data, function (err) {
      if (err) {
        debug(err);
      }
      resolve();
    });
  });
};

function formatPath (rawPath) {
  res = rawPath;
  res = res.toLowerCase();
  res = res.replace(/\s+/g, '_');
  return res;
};

