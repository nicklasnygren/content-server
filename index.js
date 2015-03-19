const DEFAULT_PORT = 5001;

var debug   = require('debug')('main');
var express = require('express');
var bodyParser = require('body-parser');
var parseBlob = require('./lib/parseBlob');
var app     = express();
var server;

app.use(bodyParser.json());
app.post('/', onPost)

function onPost (req, res) {
  res.send('Got payload');
  debug(parseBlob(req.body));
};

server = app.listen(DEFAULT_PORT, function () {
  var host, port;

  host = server.address().port;
  port = server.address().port;

  debug('Example app listening at http://localhost:%s', port);
});

