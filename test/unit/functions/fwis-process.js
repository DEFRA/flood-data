const Lab = require('@hapi/lab')
const handler = require('../../../lib/functions/fwis-process').handler
const event = require('../../events/fwis-event.json')
const sinon = require('sinon')
const { it, describe, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const wreck = require('../../../lib/helpers/wreck')
const fwis = require('../../../lib/models/fwis')
const { Client } = require('pg')

// start up Sinon sandbox
describe('handler', () => {
  let sandbox
  let clientStub
  let clientEndStub
  let wreckStub
  let saveStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    clientStub = sandbox.stub(Client.prototype, 'connect')
    clientEndStub = sandbox.stub(Client.prototype, 'end')
    wreckStub = sandbox.stub(wreck, 'request')
    saveStub = sandbox.stub(fwis, 'save')
  })

  afterEach(() => {
    sandbox.restore()
    wreckStub.restore()
  })

  it('should handle event and save warnings', async () => {
    const warnings = [{
      situation: 'test-situation',
      attr: {
        taId: 'test-taId',
        taCode: 'test-taCode',
        taName: 'test-taName',
        taDescription: 'test-taDescription',
        quickDial: 'test-quickDial',
        version: 'test-version',
        taCategory: 'test-taCategory',
        ownerArea: 'test-ownerArea',
        createdDate: 'test-createdDate',
        lastModifiedDate: 'test-lastModifiedDate',
        situationChanged: 'test-situationChanged',
        severityChanged: 'test-severityChanged',
        timeMessageReceived: 'test-timeMessageReceived',
        severityValue: 'test-severityValue',
        severity: 'test-severity'
      }
    }]

    // Get the current seconds since epoch
    const timestamp = Math.round((new Date()).getTime() / 1000)

    saveStub.withArgs(warnings, timestamp, new Client()).resolves()
    wreckStub.resolves({ warnings })
    clientEndStub.resolves()
    clientStub.resolves()

    await handler(event)

    sinon.assert.calledOnce(wreckStub)
    sinon.assert.calledOnce(clientStub)
    sinon.assert.calledOnce(clientEndStub)
    sinon.assert.calledOnce(saveStub)
  })

  it('should handle errors', async () => {
    const error = new Error('test error')

    wreckStub.callsFake(() => {
      return Promise.reject(error)
    })

    try {
      await handler({})
    } catch (err) {
      sinon.assert.calledOnce(wreckStub)
      sinon.assert.notCalled(clientStub)
      sinon.assert.notCalled(clientEndStub)
      sinon.assert.notCalled(saveStub)
      expect(err).to.equal(error)
    }
  })
})
