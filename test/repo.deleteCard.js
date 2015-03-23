var app        = require('..');
var deleteCard = require('../lib/repo')(app).deleteCard;
var should     = require('should');

describe('repo.deleteCard', function () {
  var repoBasePath = app.get('repo').path;

  it('deletes card within org', function (done) {
    deleteCard('testOrgId', 'testCoreCloneId')
    .then(function (res) {
      res.should.be.ok;
      done();
    });
  });

  it('returns false if card not found within org', function (done) {
    deleteCard('testOrgId', 'nonExistantCardId')
    .then(function (res) {
      res.should.be.falsy;
      done();
    });
  });

  it('returns false if org not found', function (done) {
    deleteCard('nonExistantTestOrgId', 'cardId')
    .then(function (res) {
      res.should.be.falsy;
      done();
    });
  });
});

