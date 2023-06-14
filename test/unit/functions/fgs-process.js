const Lab = require('@hapi/lab')
const { it, describe, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const handler = require('../../../lib/functions/fgs-process').handler
const s3 = require('../../../lib/helpers/s3')
const wreck = require('../../../lib/helpers/wreck')
const sinon = require('sinon')

describe('handler', () => {
  let sandbox
  let s3Stub
  let wreckStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    s3Stub = sandbox.stub(s3, 'upload')
    wreckStub = sandbox.stub(wreck, 'request')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should handle event and return result', async () => {
    const statement = { id: 'test-id', content: 'test-content' }
    wreckStub.resolves({ statement })
    s3Stub.resolves('upload response')

    const result = await handler({})

    sinon.assert.calledTwice(s3Stub)
    sinon.assert.calledOnce(wreckStub)
    expect(result).to.be.an.array().and.to.have.length(2)
    expect(result[0]).to.equal('upload response')
    expect(result[1]).to.equal('upload response')
  })

  it('should handle errors', async () => {
    const error = new Error('test error')

    wreckStub.callsFake(() => {
      return Promise.reject(error)
    })

    try {
      await handler({})
    } catch (err) {
      sinon.assert.notCalled(s3Stub)
      sinon.assert.calledOnce(wreckStub)
      expect(err).to.equal(error)
    }
  })
})

// // start up Sinon sandbox
