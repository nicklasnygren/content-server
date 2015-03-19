const REPO_DIR = './repo';

var fs = require('fs');
var debug = require('debug')('path');

module.exports = function (blob) {
  debug(blob);
  var orgId = blob.meta.org;
  var cloneId = blob.meta.id;
  var cloneParent = blob.meta.parentId;

  function createBlobDir () {
    var orgPath      = getOrgPath(orgId);
    var customPath   = orgPath + '/custom';
    var clonePath    = customPath + '/' + blob.parentId;
    var instancePath = clonePath + '/' + cloneId;

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

  return {
    createBlobDir: createBlobDir
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

function formatPath (rawPath) {
  res = rawPath;
  res = res.toLowerCase();
  res = res.replace(/\s+/g, '_');
  return res;
};

