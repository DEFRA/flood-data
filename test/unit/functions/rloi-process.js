const Lab = require('@hapi/lab')
const { it, describe, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const handler = require('../../../lib/functions/rloi-process').handler
const event = require('../../events/fwis-event.json')
const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')
const rloi = require('../../../lib/models/rloi')
const { Pool } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon')

describe('handler', () => {
  let sandbox
  let s3Stub
  let poolStub
  let parseXmlStub
  let saveStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    s3Stub = sandbox.stub(s3, 'getObject')
    poolStub = sandbox.stub(Pool.prototype, 'end')
    parseXmlStub = sandbox.stub(util, 'parseXml')
    saveStub = sandbox.stub(rloi, 'save')
    // Initialize your event here
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should handle event and return result', async () => {
    s3Stub.resolves({ Body: 'test body' })
    parseXmlStub.resolves('parsed xml')
    saveStub.resolves('save response')
    poolStub.resolves()

    const result = await handler(event)

    sinon.assert.calledOnce(s3Stub)
    sinon.assert.calledOnce(parseXmlStub)
    sinon.assert.calledOnce(saveStub)
    sinon.assert.calledOnce(poolStub)

    expect(result).to.equal('save response')
  })

  it('should handle errors', async () => {
    const error = new Error('test error')
    s3Stub.rejects(error)

    try {
      await handler(event)
    } catch (err) {
      sinon.assert.calledOnce(s3Stub)
      sinon.assert.notCalled(parseXmlStub)
      sinon.assert.notCalled(saveStub)
      sinon.assert.notCalled(poolStub)
      expect(err).to.equal(error)
    }
  })
})
