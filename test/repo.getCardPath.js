var app         = require('..');
var getCardPath = require('../lib/repo')(app).getCardPath;
var should      = require('should');

describe('repo.getCardPath', function () {
  var repoBasePath = app.get('repo').path;

  it('gets path to card within org', function (done) {
    getCardPath('testOrgId', 'testCoreCloneId')
    .then(function (res) {
      res.should.be.ok;
      res.should.be.a.String;
      done();
    });
  });

  it('returns false if card not found within org', function (done) {
    getCardPath('testOrgId', 'nonExistantCardId')
    .then(function (res) {
      res.should.be.falsy;
      done();
    });
  });

  it('returns false if org not found', function (done) {
    getCardPath('nonExistantTestOrgId', 'cardId')
    .then(function (res) {
      res.should.be.falsy;
      done();
    });
  });
});

