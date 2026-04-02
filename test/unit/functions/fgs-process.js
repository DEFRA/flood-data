const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const handler = require('../../../lib/functions/fgs-process').handler
const s3 = require('../../../lib/helpers/s3')
const wreck = require('../../../lib/helpers/wreck')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

lab.experiment('fgs process', () => {
  lab.beforeEach(async () => {

  })

  lab.afterEach(() => {
    sinon.restore()
  })

  lab.test('fgs process', async () => {
    process.env.LFW_DATA_FGS_KEY = 'test-key'

    const putObject = sinon.stub(s3, 'putObject').callsFake((params) => {
      Code.expect(params.Body).to.equal(JSON.stringify({ id: 'test' }))
      Code.expect(params.Key).to.include('fgs/').and.to.include('.json')
      return Promise.resolve({})
    })
    const request = sinon.stub(wreck, 'request').callsFake(() => {
      return Promise.resolve({
        statement:
        {
          id: 'test'
        }
      })
    })

    await handler()
    sinon.assert.calledTwice(putObject)
    sinon.assert.calledOnce(request)

    // Verify request was called with correct URL
    Code.expect(request.getCall(0).args[1]).to.include('v3/statements/latest')

    delete process.env.LFW_DATA_FGS_KEY
  })

  lab.test('fgs process sends x-api-key header', async () => {
    process.env.LFW_DATA_FGS_KEY = 'test-api-key-123'

    sinon.stub(s3, 'putObject').resolves({})
    const request = sinon.stub(wreck, 'request').resolves({
      statement: { id: 'test' }
    })

    await handler()

    sinon.assert.calledOnce(request)
    const callArgs = request.getCall(0).args
    Code.expect(callArgs[0]).to.equal('get')
    Code.expect(callArgs[1]).to.include('statements/latest')
    Code.expect(callArgs[2].headers).to.exist()
    Code.expect(callArgs[2].headers['x-api-key']).to.equal('test-api-key-123')
    Code.expect(callArgs[2].json).to.be.true()
    Code.expect(callArgs[2].timeout).to.equal(30000)

    delete process.env.LFW_DATA_FGS_KEY
  })

  lab.test('fgs process when LFW_DATA_FGS_KEY is not set', async () => {
    delete process.env.LFW_DATA_FGS_KEY

    sinon.stub(s3, 'putObject').resolves({})
    const request = sinon.stub(wreck, 'request').resolves({
      statement: { id: 'test' }
    })

    await handler()

    const callArgs = request.getCall(0).args
    Code.expect(callArgs[2].headers['x-api-key']).to.be.undefined()
  })

  lab.test('s3 error', async () => {
    sinon.stub(s3, 'putObject').callsFake(() => {
      return Promise.reject(new Error('test error'))
    })
    sinon.stub(wreck, 'request').callsFake(() => {
      return Promise.reject(new Error('test error'))
    })
    await Code.expect(handler()).to.reject()
  })

  lab.test('request error', async () => {
    sinon.stub(wreck, 'request').callsFake(() => {
      return Promise.resolve(null)
    })
    await Code.expect(handler()).to.reject()
  })
})
