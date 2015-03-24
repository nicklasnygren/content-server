var CardBlobFactory  = require('../lib/factories/CardBlob');
var getCommitMessage = CardBlobFactory.getCommitMessage;
var should           = require('should');

var blobDataWithLabel = {
  meta: {
    org: 'testOrgId',
    id: 'testCardId'
  },
  source: {
    meta: {
      label: 'testCard',
      parentId: 'testParentId'
    }
  }
};

describe('factories.CardBlob.getCommitMessage', function () {
  var blobWithLabel, blobWithoutLabel;

  beforeEach(function () {
    blobWithLabel    = CardBlobFactory(blobDataWithLabel);
    blobWithoutLabel = CardBlobFactory(blobDataWithoutLabel);
  });

  it('tags commit message with "create" if a new dir was created', function () {
    var res  = getCommitMessage({createdNewDir: true}, blobWithLabel);
    res.should.be.exactly(
      ['clone(testCard)'
      ,''
      ,'Clone Id: testCardId'
      ,'Org Id:   testOrgId'].join('\n')
    );
  });

  it('tags commit message with "update" if a new dir was not created', function () {
    var res  = getCommitMessage({createdNewDir: false}, blobWithLabel);
    res.should.be.exactly(
      ['update(testCard)'
      ,''
      ,'Clone Id: testCardId'
      ,'Org Id:   testOrgId'].join('\n')
    );
  });
});

