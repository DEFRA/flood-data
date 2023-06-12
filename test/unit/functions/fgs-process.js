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
    const upload = sinon.stub(s3, 'upload').callsFake((params) => {
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
    sinon.assert.calledTwice(upload)
    sinon.assert.calledOnce(request)
  })

  lab.test('s3 error', async () => {
    sinon.stub(s3, 'upload').callsFake(() => {
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
