var app     = require('..');
var request = require('supertest');
var should  = require('should');

describe('endpoints', function () {
  var payload = {
    items: [{
      org: 'testOrgId',
      id: 'testCoreCloneId'
    }],
    meta: {
      committer: {
        name: 'Test Name',
        email: 'name@test.org'
      }
    }
  };

  var deleteOrgPayload = {
    org: 'testOrgId',
    meta: {
      committer: {
        name: 'Test Name',
        email: 'name@test.org'
      }
    }
  };

  it ('POST /card/delete', function (done) {
    request(app)
    .post('/card/delete')
    .send(payload)
    .expect(200)
    .end(done);
  });

  it('POST /org/delete', function(done) {
    request(app)
    .post('/org/delete')
    .send(deleteOrgPayload)
    .expect(200)
    .end(done);
  });
});

