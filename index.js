'use strict';

const PORT = process.env.PORT || 5001;

var async       = require('async');
var debug       = require('debug')('main');
var express     = require('express');
var bodyParser  = require('body-parser');
var CardBlob    = require('./lib/factories/CardBlob');
var cardSources = require('./lib/cardSources.js');
var app         = express();
var server;

var cardSaveQueue = async.queue(function (blob, callback) {
  debug('Saving card: ' + blob.meta.id);

  blob.saveAndCommit()
  .then(function (msg) {
    debug('Committed blob update with message "' + msg);
    callback();
  }, function (err) {
    debug(err);
    callback();
  })
}, 1);

app.use(bodyParser.json());
app.post('/card', function cardPost (req, res) {
  var blob = CardBlob(req.body);
  debug('Got request: ' + blob.meta.id);
  cardSaveQueue.push(blob);
  res.send('OK');
});
app.get('/querySelector', function (req, res) {
  debug('Got querySelector request');
  debug(req.query.selector);
  cardSources.querySelector(req.query.selector)
  .then(function (cardnames) {
    res.json(cardnames);
  }, debug);
});

server = app.listen(PORT, function () {
  var host, port;

  host = server.address().port;
  port = server.address().port;

  debug('Example app listening at http://localhost:%s', port);
});

