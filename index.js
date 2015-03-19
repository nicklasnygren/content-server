const DEFAULT_PORT = 5001;

var debug      = require('debug')('main');
var express    = require('express');
var bodyParser = require('body-parser');
var parseBlob  = require('./lib/parseBlob');
var pathUtils  = require('./lib/pathUtils.js');
var git        = require('./lib/git');
var app        = express();
var server;

app.use(bodyParser.json());
app.post('/', onPost)

function onPost (req, res) {
  res.send('Got payload');
  var blob = parseBlob(req.body);
  var path = pathUtils(blob);
  path.save()
  .then(function (pathInfo) {
    debug('Saved blob files to' + pathInfo.path);

    return git.commitBlob(pathInfo, blob);
  })
  .then(function (commitMsg) {
    debug(`Committed blob update with message "${commitMsg}"`);
  });
};

server = app.listen(DEFAULT_PORT, function () {
  var host, port;

  host = server.address().port;
  port = server.address().port;

  debug('Example app listening at http://localhost:%s', port);
});

