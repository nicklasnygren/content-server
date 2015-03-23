'use strict';

const TEST = (process.env.NODE_ENV === 'test');
const PORT = process.env.PORT || 5001;
const REPO = {
  path: process.env.REPO || './repo'
};

var express     = require('express');
var app         = express();

app.set('port', PORT);
app.set('repo', REPO);
app.set('test', TEST);

var async       = require('async');
var debug       = require('debug')('main');
var bodyParser  = require('body-parser');
var CardBlob    = require('./lib/factories/CardBlob');
var cardSources = require('./lib/cardSources.js');
var repo        = require('./lib/repo')(app);
var git         = require('./lib/git');
var server, cardSaveQueue;

cardSaveQueue = async.queue(function (blob, callback) {
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

app.post('/card/delete', function cardDelete (req, res) {
  var blob = req.body;

  return Promise.all(
    blob.items.map(function (card) {
      return repo.deleteCard(card.org, card.id);
    })
  )
  .then(function () {
    return git.diff.bool();
  })
  .then(function (diff) {
    if (!diff) {
      debug('No diff... aborting commit.')
      return;
    }
    if (TEST) { return true; }
    return git.commit.head('*', blob.meta.committer, 'Delete card sources');
  })
  .then(function () {
    res.send('OK');
  });
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

module.exports = app;
