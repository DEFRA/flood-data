const Lab = require('@hapi/lab')
const { it, describe, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const handler = require('../../../lib/functions/rloi-refresh').handler
const station = require('../../../lib/models/station')
const rloi = require('../../../lib/models/rloi')
const { Client } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon')

describe('handler', () => {
  let sandbox
  let clientStub
  let clientEndStub
  let deleteOldStub
  let refreshStationMviewStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    clientStub = sandbox.stub(Client.prototype, 'connect')
    clientEndStub = sandbox.stub(Client.prototype, 'end')
    deleteOldStub = sandbox.stub(rloi, 'deleteOld')
    refreshStationMviewStub = sandbox.stub(station, 'refreshStationMview')
  })

  afterEach(() => {
    sandbox.restore()
    clientStub.restore()
  })

  it('should handle event and delete old records and refresh station view', async () => {
    clientStub.resolves()
    clientEndStub.resolves()
    deleteOldStub.resolves()
    refreshStationMviewStub.resolves()

    await handler()

    sinon.assert.calledOnce(clientStub)
    sinon.assert.calledOnce(clientEndStub)
    sinon.assert.calledOnce(deleteOldStub)
    sinon.assert.calledOnce(refreshStationMviewStub)
  })

  it('should handle errors', { timeout: 15000 }, async () => {
    const error = new Error('test error')
    clientStub.callsFake(() => {
      return Promise.reject(error)
    })

    try {
      await handler()
    } catch (err) {
      sinon.assert.calledThrice(clientStub)
      sinon.assert.callCount(clientEndStub, 2)
      sinon.assert.notCalled(deleteOldStub)
      sinon.assert.notCalled(refreshStationMviewStub)
      expect(err).to.equal(error)
    }
  })
})
