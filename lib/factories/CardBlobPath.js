const REPO_DIR          = './repo';
const TEMPLATE_FILENAME = 'template.html';
const QUERY_FILENAME    = 'query.js';
const META_FILENAME     = 'meta.json';
const SETTINGS_FILENAME = 'settings.json';

var fs     = require('fs');
var debug  = require('debug')('CardBlob.Path');
var mkdirp = require('mkdirp');

module.exports = function (blob) {
  var instancePath = formatPath([
    REPO_DIR,
    blob.meta.org,
    'custom',
    blob.getParentString(),
    blob.meta.id
  ].join('/'));

  function createBlobDir () {
    debug('creating blob path');
    return recursiveCreateDir(instancePath);
  };

  function save () {
    var createdNewDir;
    debug('writing blob files');

    return createBlobDir()
    .then(function (err) {
      createdNewDir = !!err;

      return Promise.all([
        writeFile(getFilePath(META_FILENAME),     blob.getSource('meta')),
        writeFile(getFilePath(SETTINGS_FILENAME), blob.getSource('settings')),
        writeFile(getFilePath(QUERY_FILENAME),    blob.getSource('query')),
        writeFile(getFilePath(TEMPLATE_FILENAME), blob.getSource('template'))
      ]);
    })
    .then(function () {
      return {
        path: instancePath,
        createdNewDir: createdNewDir
      };
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

function recursiveCreateDir (path) {
  return new Promise(function (resolve, reject) {
    mkdirp(path, function (err) {
      resolve(err);
    });
  });
};

function writeFile (path, data) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, data, function (err) {
      if (err) {
        debug(err);
      }
      resolve(err);
    });
  });
};

function formatPath (rawPath) {
  var res = rawPath;
  res = res.toLowerCase();
  res = res.replace(/\s+/g, '_');
  return res;
};

