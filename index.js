const DEFAULT_PORT = 5001;

var debug      = require('debug')('main');
var express    = require('express');
var bodyParser = require('body-parser');
var parseBlob  = require('./lib/parseBlob');
var pathUtils  = require('./lib/pathUtils.js');
var app        = express();
var server;

app.use(bodyParser.json());
app.post('/', onPost)

function onPost (req, res) {
  res.send('Got payload');
  var blob = parseBlob(req.body);
  var path = pathUtils(blob);
  path.save()
  .then(function (_path) {
    debug('Saved blob files to' + _path);
  });
};

server = app.listen(DEFAULT_PORT, function () {
  var host, port;

  host = server.address().port;
  port = server.address().port;

  debug('Example app listening at http://localhost:%s', port);
});

