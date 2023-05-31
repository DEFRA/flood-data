'use strict'

const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Code = require('@hapi/code')
const event = require('../../events/imtd-event.json')
const stations = require('../../data/imtd-stations').stations
const apiResponse = require('../../data/imtd-stations').apiResponse
const axios = require('axios')
const proxyquire = require('proxyquire')

const { handler } = require('../../../lib/functions/imtd-process')

const { Pool } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

lab.experiment('imtd processing', () => {
  lab.beforeEach(async () => {
    process.env.LFW_DATA_DB_CONNECTION = ''
    // setup mocks
    sinon.stub(Pool.prototype, 'connect').callsFake(() => {
      return Promise.resolve({
        query: sinon.stub().resolves({}),
        release: sinon.stub()
      })
    })
    sinon.stub(Pool.prototype, 'query').callsFake(() => {
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

  lab.test('imtd process should handle response with no thresholds', async () => {
    const apiResponse = {
      status: 200,
      statusText: 'OK',
      data: [
        {
          RLOIid: '1165',
          wiskiID: '254290001',
          telemetryID: 'E10023',
          Name: 'Tanbridge GS',
          TimeSeriesMetaData: []
        }
      ]
    }

    const axiosStub = sinon.stub(axios, 'get').callsFake(() => {
      return Promise.resolve(apiResponse)
    })

    const log = {
      info: sinon.spy(),
      error: sinon.spy()
    }

    const { handler } = proxyquire('../../../lib/functions/imtd-process', {
      '../helpers/logging': log
    })
    await handler(event)
    Code.expect(axiosStub.callCount).to.equal(8)
    Code.expect(log.error.callCount).to.equal(1)
    Code.expect(log.error.args.length).to.equal(1)
    Code.expect(log.error.args[0]).to.equal(['Error:', 'Empty array'])
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
