'use strict'

const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const pg = require('pg')
const handler = require('../../../lib/functions/ffoi-process').handler
const event = require('../../events/ffoi-event.json')
const { it, describe, beforeEach, afterEach, after } = exports.lab = Lab.script();
const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')
const ffoi = require('../../../lib/models/ffoi')
// start up Sinon sandbox
const sinon = require('sinon')

describe('handler', () => {
  let sandbox;
  let s3Stub;
  let pgStub;
  let parseXmlStub;
  let saveStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    s3Stub = sandbox.stub(s3, 'getObject');
    pgStub = sandbox.stub(pg.Pool.prototype, 'end');
    parseXmlStub = sandbox.stub(util, 'parseXml');
    saveStub = sandbox.stub(ffoi, 'save');
  });

  afterEach(() => {
    sandbox.reset();
  });

  after(() => {
    sandbox.restore();
  });


  it('should handle event and return result', async () => {
    s3Stub.resolves({ Body: 'test body' });
    parseXmlStub.resolves('parsed xml');
    saveStub.resolves('save response');
    pgStub.resolves();

    const result = await handler(event);

    sinon.assert.calledOnce(s3Stub);
    sinon.assert.calledOnce(parseXmlStub);
    sinon.assert.calledOnce(saveStub);
    sinon.assert.calledOnce(pgStub);
    expect(result).to.equal('save response');
  });

  // it('should handle errors', async () => {
  //   const error = new Error('test error');
  //   s3Stub.rejects(error);

  //   try {
  //     await handler(event);
  //   } catch (err) {
  //     sinon.assert.calledOnce(s3Stub);
  //     sinon.assert.calledOnce(parseXmlStub);
  //     sinon.assert.notCalled(saveStub);
  //     sinon.assert.notCalled(pgStub);
  //     expect(err).to.equal(error);
  //   }
  // });
});
