const REPO_DIR = './repo';

var fs    = require('fs');
var path  = require('path');
var glob  = require('glob');
var debug = require('debug')('cardSources');
var jsdom = require('jsdom');

function querySelector (selector) {
  var filenames, cardnames, templates, DOMTrees, res;

  return getAllCustomTemplates()
  .then(function (_filenames) {
    filenames = _filenames;

    return Promise.all(
      filenames.map(getCardLabelFromPath)
    );
  }, debug)
  .then(function (_cardnames) {
    cardnames = _cardnames;

    return Promise.all(
      filenames.map(readFileAsync)
    );
  }, debug)
  .then(function (_templates) {
    templates = _templates;

    return Promise.all(
      templates.map(getDOMFromMarkup)
    );
  }, debug)
  .then(function (_DOMTrees) {
    DOMTrees = _DOMTrees;

    return cardnames.map(function (cardname, idx) {
      return {
        orgId: getOrgIdFromPath(filenames[idx]),
        cardname: cardname
      };
    })
    .filter(function (card, idx) {
      var document = DOMTrees[idx];
      if (!document) {
        return false;
      }
      return !!document.querySelector(selector);
    });
  });
};

function getAllCustomTemplates () {
  return new Promise (function (resolve, reject) {
    // Glob ** won't crawl symlinks, so this query should be fine for now
    glob(REPO_DIR + '/orgs/**/template.html', function (err, filenames) {
      if (err) {
        return reject(err);
      }
      resolve(filenames);
    });
  });
};

function getCardLabelFromPath (_path) {
  var dir      = path.dirname(_path);
  var metaPath = dir + '/meta.json';

  return new Promise (function (resolve, reject) {
    fs.readFile(metaPath, function (err, contents) {
      var meta;
      if (err) {
        debug(err);
        return reject(err);
      }
      meta = JSON.parse(contents);
      resolve(meta.label);
    });
  });
};

function readFileAsync (path) {
  return new Promise (function (resolve, reject) {
    fs.readFile(path, function (err, contents) {
      if (err) {
        debug(err);
        return reject(err);
      }
      resolve(contents.toString());
    });
  });
};

function getDOMFromMarkup (markup) {
  return new Promise(function (resolve, reject) {
    jsdom.env(
      markup,
      function (err, window) {
        if (err) {
          return reject(err);
        }
        resolve(window.document);
      }
    );
  });
};

function getOrgIdFromPath (_path) {
  return _path.split('/')[3];
};

module.exports = {
  querySelector: querySelector
};

