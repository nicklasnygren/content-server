var app        = require('..');
var deleteOrg = require('../lib/repo')(app).deleteOrg;
var should     = require('should');

describe('repo.deleteOrg', function () {
  var repoBasePath = app.get('repo').path;

  it('deletes entire org folder', function (done) {
    deleteOrg('testOrgId')
    .then(function (res) {
      res.should.be.ok;
      done();
    });
  });

  it('returns false if org not found', function (done) {
    deleteOrg('nonExistantTestOrgId')
    .then(function (res) {
      res.should.be.falsy;
      done();
    });
  });
});

