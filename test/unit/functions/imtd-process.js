'use strict'

const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Code = require('@hapi/code')
const handler = require('../../../lib/functions/imtd-process').handler
const event = require('../../events/imtd-event.json')
const stations = require('../../data/imtd-stations').stations
const apiResponse = require('../../data/imtd-stations').apiResponse
const axios = require('axios')

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
        release: sinon.stub().resolves({})
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
