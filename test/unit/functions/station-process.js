const Lab = require('@hapi/lab')
const { it, describe, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const handler = require('../../../lib/functions/station-process').handler
const event = require('../../events/station-event.json')
const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')
const station = require('../../../lib/models/station')
const { Client } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon')

describe('handler', () => {
  let sandbox
  let s3Stub
  let clientStub
  let clientEndStub
  let parseCsvStub
  let saveToDbStub
  let saveToObjectsStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    s3Stub = sandbox.stub(s3, 'getObject')
    clientStub = sandbox.stub(Client.prototype, 'connect')
    clientEndStub = sandbox.stub(Client.prototype, 'end')
    parseCsvStub = sandbox.stub(util, 'parseCsv')
    saveToDbStub = sandbox.stub(station, 'saveToDb')
    saveToObjectsStub = sandbox.stub(station, 'saveToObjects')
    // Initialize your event here
  })

  afterEach(() => {
    sandbox.restore()
    s3Stub.restore()
    parseCsvStub.restore()
    clientStub.restore()
    clientEndStub.restore()
    saveToDbStub.restore()
    saveToObjectsStub.restore()
  })

  it('should handle event and return result', async () => {
    s3Stub.resolves({ Body: 'test body' })
    parseCsvStub.resolves('parsed csv')
    clientStub.resolves()
    clientEndStub.resolves()
    saveToDbStub.resolves('save to db response')
    saveToObjectsStub.resolves('save to s3 response')

    const result = await handler(event)

    sinon.assert.calledOnce(s3Stub)
    sinon.assert.calledOnce(parseCsvStub)
    sinon.assert.calledOnce(clientStub)
    sinon.assert.calledOnce(clientEndStub)
    sinon.assert.calledOnce(saveToDbStub)
    sinon.assert.calledOnce(saveToObjectsStub)
    expect(result).to.equal({ saveStationsToDb: 'save to db response', saveStationsToS3: 'save to s3 response' })
  })

  it('station process handler should handle errors', { timeout: 15000 }, async () => {
    const error = new Error('test error')
    s3Stub.rejects(error)

    try {
      await handler(event)
    } catch (err) {
      sinon.assert.calledOnce(s3Stub)
      sinon.assert.notCalled(parseCsvStub)
      sinon.assert.notCalled(clientStub)
      sinon.assert.notCalled(clientEndStub)
      sinon.assert.notCalled(saveToDbStub)
      sinon.assert.notCalled(saveToObjectsStub)
      expect(err).to.equal(error)
    }
  })
})
