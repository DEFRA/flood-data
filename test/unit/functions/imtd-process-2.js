'use strict'

const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Code = require('@hapi/code')
const event = require('../../events/imtd-event.json')
const stations = require('../../data/imtd-stations').stations
const apiResponse = require('../../data/imtd-stations').apiResponse
const axios = require('axios')
const proxyquire = require('proxyquire')

const { handler } = require('../../../lib/functions/imtd-process-2')

const { Pool } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

lab.experiment('imtd processing 2', () => {
  let queryStub
  lab.beforeEach(async () => {
    process.env.LFW_DATA_DB_CONNECTION = ''
    // setup mocks
    sinon.stub(Pool.prototype, 'connect').callsFake(() => {
      return Promise.resolve({
        query: sinon.stub().resolves({}),
        release: sinon.stub()
      })
    })
    queryStub = sinon.stub(Pool.prototype, 'query').callsFake(() => {
      return Promise.resolve(stations)
    })
    sinon.stub(Pool.prototype, 'end').callsFake(() => {
      return Promise.resolve({})
    })
  })
  lab.afterEach(() => {
    sinon.restore()
  })

  lab.test('imtd process latest.json stations length over 50', async () => {
    sinon.stub(axios, 'get').callsFake(() => {
      return Promise.resolve(apiResponse)
    })
    await handler(event)
  })

  lab.test('imtd process should handle response with thresholds', async () => {
    const axiosStub = sinon.stub(axios, 'get').callsFake(() => {
      return Promise.resolve(apiResponse)
    })

    const log = {
      info: sinon.spy(),
      error: sinon.spy()
    }

    const { handler } = proxyquire('../../../lib/functions/imtd-process-2', {
      '../helpers/logging': log
    })

    await handler(event)
    Code.expect(axiosStub.callCount).to.equal(8)
    Code.expect(log.error.callCount).to.equal(0)
    // 8 stations each with the same 6 thresholds (out of 10 thresholds for inclusion)
    /// 48 inserts + 1 select and 8 drops = 57
    Code.expect(queryStub.callCount).to.equal(57)
  })

  lab.test('imtd process should handle response with thresholds', async () => {
    const axiosStub = sinon.stub(axios, 'get').callsFake(() => {
      return Promise.resolve(apiResponse)
    })

    await handler(event)
    // 8 stations in db response stub
    Code.expect(axiosStub.callCount).to.equal(8)
    // 8 stations each with the same 6 thresholds (out of 10 thresholds for inclusion)
    /// 48 inserts + 1 select and 8 drops = 57
    Code.expect(queryStub.callCount).to.equal(57)
  })

  lab.test('imtd process axios error', async () => {
    sinon.stub(axios, 'get').rejects(new Error('Fake error'))

    try {
      await handler(event)
      Code.fail('Expected an error to be thrown')
    } catch (error) {
      Code.expect(error).to.be.an.error(Error)
    }
  })
  lab.test('imtd process axios returns a 404', async () => {
    sinon.stub(axios, 'get').rejects({ response: { status: 404 } })
    await handler(event)
  })
})
