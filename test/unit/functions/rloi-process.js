const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const handler = require('../../../lib/functions/rloi-process').handler
const event = require('../../events/fwis-event.json')
const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')
const rloi = require('../../../lib/models/rloi')
const { Client } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

lab.experiment('rloi processing', () => {
  let mockResponse

  lab.beforeEach(() => {
    // setup mocks
    mockResponse = {
      Body: {
        transformToString: sinon.stub()
      }
    }
    sinon.stub(s3, 'getObject').callsFake(() => {
      return Promise.resolve(mockResponse)
    })
    sinon.stub(util, 'parseXml').callsFake(() => {
      return Promise.resolve({})
    })
    sinon.stub(rloi, 'save').callsFake(() => {
      return Promise.resolve({})
    })
    sinon.stub(Client.prototype, 'connect').callsFake(() => {
      return Promise.resolve({})
    })
    sinon.stub(Client.prototype, 'query').callsFake(() => {
      return Promise.resolve({})
    })
    sinon.stub(Client.prototype, 'end').callsFake(() => {
      return Promise.resolve({})
    })
  })
  lab.afterEach(() => {
    // restore sinon sandbox
    sinon.restore()
  })
  lab.test('rloi process', async () => {
    mockResponse.Body.transformToString.resolves('<xml></xml>')
    await handler(event)
  })

  lab.test('rloi process S3 error', async () => {
    s3.getObject = () => {
      return Promise.reject(new Error('test error'))
    }
    await Code.expect(handler(event)).to.reject()
  })

  lab.test('rloi process with async iterator stream', async () => {
    // Mock an async iterator stream like Node.js would provide (without transformToString)
    const chunks = ['<xml>', '</xml>']
    mockResponse.Body = {
      transformToString: 'not a function', // Explicitly not a function
      [Symbol.asyncIterator]: async function * () {
        for (const chunk of chunks) {
          yield chunk
        }
      }
    }

    await handler(event)
    Code.expect(util.parseXml.calledWith('<xml></xml>')).to.be.true()
  })

  lab.test('rloi process throws error when Body has no valid method', async () => {
    // Mock a Body without transformToString or async iterator
    mockResponse.Body = {
      transformToString: null, // Explicitly not a function
      [Symbol.asyncIterator]: null // Explicitly not a function
    }
    await Code.expect(handler(event)).to.reject(Error, 'data.Body is not async iterable and has no transformToString method')
  })

  lab.test('rloi process throws error when Body is null', async () => {
    // Mock a response with null Body
    mockResponse.Body = null
    await Code.expect(handler(event)).to.reject(Error, 'data.Body is not async iterable and has no transformToString method')
  })
})
