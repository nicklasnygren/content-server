const DEFAULT_PORT = 5001;

var debug      = require('debug')('main');
var express    = require('express');
var bodyParser = require('body-parser');
var parseBlob  = require('./lib/parseBlob');
var pathUtils  = require('./lib/pathUtils.js');
var git        = require('./lib/git');
var app        = express();
var server, latestOrgId;

app.use(bodyParser.json());
app.post('/', onPost)

function onPost (req, res) {
  res.send('Got payload');
  var blob = parseBlob(req.body);
  var path = pathUtils(blob);
  var msg;

  path.save()
  .then(function (pathInfo) {
    var method;

    msg = getCommitMessage(pathInfo, blob);;
    debug('Saved blob files to' + pathInfo.path);

    if (latestOrgId === blob.meta.org) {
      method = 'amend';
      debug('Amending blob...');
    }
    else {
      method = 'head';
      debug('Committing blob...');
    }

    return git.commit[method](pathInfo.path, blob.meta.committer, msg);
  })
  .then(function () {
    latestOrgId = blob.meta.org;
    debug(`Committed blob diff with message "${msg}"`);
  });
};

server = app.listen(DEFAULT_PORT, function () {
  var host, port;

  host = server.address().port;
  port = server.address().port;

  debug('Example app listening at http://localhost:%s', port);
});

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
