const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Code = require('@hapi/code')
const handler = require('../../../lib/functions/imtd-process').handler
const event = require('../../events/imtd-event.json')
const stations = require('../../data/imtd-stations').stations
const apiResponse = require('../../data/imtd-stations').apiResponse
const axios = require('axios')

const sinon = require('sinon').createSandbox()
const { Pool } = require('pg')

lab.experiment('imtd processing', () => {
  lab.beforeEach(async () => {
    process.env.LFW_DATA_DB_CONNECTION = ''
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

  lab.test('imtd process api called expected number of times', async () => {
    const axiosGetStub = sinon.stub(axios, 'get').resolves(apiResponse)
    await handler(event)

    // Assert the number of times the API was called
    Code.expect(axiosGetStub.callCount).to.equal(stations.rows.length)
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
    const error = new Error('Fake error')
    error.response = { status: 404 }
    sinon.stub(axios, 'get').rejects(error)

    try {
      await handler(event)
      Code.fail('Expected an error to be thrown')
    } catch (error) {
      Code.expect(error).to.be.an.error(Error)
      Code.expect(error.response.status).to.equal(404)
    }
  })
})
