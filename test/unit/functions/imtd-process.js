'use strict'

const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Code = require('@hapi/code')
const event = require('../../events/imtd-event.json')
const testStations = require('../../data/imtd-stations').stations
const testApiResponse = require('../../data/imtd-stations').apiResponse
const axios = require('axios')
const proxyquire = require('proxyquire')

const { handler } = require('../../../lib/functions/imtd-process')

const { Pool } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

function setupStdDbStubs (test) {
  const stations = test || testStations
  const connect = sinon.stub(Pool.prototype, 'connect').resolves({
    query: sinon.stub().resolves({}),
    release: sinon.stub()
  })
  const query = sinon.stub(Pool.prototype, 'query').resolves(stations)
  const end = sinon.stub(Pool.prototype, 'end').resolves(stations)

  return {
    connect,
    query,
    end
  }
}

function setupAxiosStdStub (response = testApiResponse) {
  return sinon.stub(axios, 'get').resolves(response)
}

lab.experiment('imtd processing', () => {
  lab.beforeEach(async () => {
    process.env.LFW_DATA_DB_CONNECTION = ''
  })
  lab.afterEach(() => {
    sinon.restore()
  })

  lab.test('imtd process latest.json stations', async () => {
    setupStdDbStubs()
    setupAxiosStdStub()
    await handler(event)
  })

  lab.experiment('response with thresholds', () => {
    lab.test('it should call axios 8 times', async () => {
      setupStdDbStubs()
      const axiosStub = setupAxiosStdStub()
      await handler(event)
      // 8 stations each with the same 6 thresholds (out of 10 thresholds for inclusion)
      /// 48 inserts + 1 select and 8 drops = 57
      Code.expect(axiosStub.callCount).to.equal(8)
    })
    lab.test('it should call the db 57 times', async () => {
      const { query: queryStub } = setupStdDbStubs()
      setupAxiosStdStub()
      await handler(event)
      // 8 stations each with the same 6 thresholds (out of 10 thresholds for inclusion)
      /// 48 inserts + 1 select and 8 drops = 57
      const calls = queryStub.getCalls()
      Code.expect(calls.filter(c => c.args[0].match(/^select/i)).length).to.equal(1)
      Code.expect(calls.filter(c => c.args[0].match(/^insert/i)).length).to.equal(48)
      Code.expect(calls.filter(c => c.args[0].match(/^delete/i)).length).to.equal(8)
      Code.expect(calls.length).to.equal(57)
    })
    lab.test('it should get the rivers list first', async () => {
      const { query: queryStub } = setupStdDbStubs()
      setupAxiosStdStub()
      await handler(event)
      const calls = queryStub.getCalls()
      Code.expect(calls[0].args.length).to.equal(1)
      Code.expect(calls[0].args[0]).to.startWith('select distinct rloi_id from rivers_mview')
    })
    lab.test('it should get delete existing thresholds before inserting new records', async () => {
      const stationIds = {
        rows: [
          { rloi_id: 1001 },
          { rloi_id: 1002 }
        ]
      }
      const { query: queryStub } = setupStdDbStubs(stationIds)
      setupAxiosStdStub()
      await handler(event)
      const calls = queryStub.getCalls()
      Code.expect(calls.length).to.equal(15)
      Code.expect(calls[1].args.length).to.equal(2)
      Code.expect(calls[1].args).to.equal(['DELETE FROM u_flood.station_imtd_threshold WHERE station_id = $1', [1001]])
      Code.expect(calls[3].args).to.equal(['INSERT INTO station_imtd_threshold (station_id, fwis_code, fwis_type, direction, value) SELECT $1, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM station_imtd_threshold WHERE station_id = $1 AND fwis_code = $2 AND fwis_type = $3 AND direction = $4 AND value = $5);', [1001, '065WAF423', 'A', 'u', 33.4]])
    })
  })

  lab.experiment('sad path', () => {
    lab.test('imtd process should log an error when API returns 404 for a given RLOI id', async () => {
      const test = {
        rows: [
          { rloi_id: 1001 }
        ]
      }
      const { query: queryStub } = setupStdDbStubs(test)
      const error = new Error('error')
      error.response = { status: 404 }
      sinon.stub(axios, 'get').rejects(error)
      const logger = {
        log: sinon.spy()
      }
      const { handler } = proxyquire('../../../lib/functions/imtd-process', {
        '../helpers/logging': logger
      })

      await handler(event)

      Code.expect(logger.log.args[0][0]).to.equal('Station 1001 not found in IMTD (HTTP Status: 404)')

      const calls = queryStub.getCalls()
      Code.expect(calls.filter(c => c.args[0].match(/^select/i)).length).to.equal(1)
      Code.expect(calls.filter(c => c.args[0].match(/^delete/i)).length).to.equal(0)
      Code.expect(calls.filter(c => c.args[0].match(/^insert/i)).length).to.equal(0)
      Code.expect(calls.length).to.equal(1)
    })
    lab.test('imtd process should throw an error when API returns a status which is an error and not a 404', async () => {
      const test = {
        rows: [
          { rloi_id: 1001 }
        ]
      }
      const { query: queryStub } = setupStdDbStubs(test)
      const error = new Error('error')
      error.response = { status: 500 }
      const axiosStub = setupAxiosStdStub()
      axiosStub.rejects(error)
      const logger = {
        log: sinon.spy(),
        error: sinon.spy()
      }
      const { handler } = proxyquire('../../../lib/functions/imtd-process', {
        '../helpers/logging': logger
      })

      const returnedError = await Code.expect(handler()).to.reject()
      Code.expect(returnedError.message).to.equal('Request to IMTD API failed for RLOI id 1001 (status: 500)')

      const logErrorCalls = logger.error.getCalls()
      Code.expect(logErrorCalls.length).to.equal(0)

      const calls = queryStub.getCalls()
      Code.expect(calls.filter(c => c.args[0].match(/^select/i)).length).to.equal(1)
      Code.expect(calls.filter(c => c.args[0].match(/^delete/i)).length).to.equal(0)
      Code.expect(calls.filter(c => c.args[0].match(/^insert/i)).length).to.equal(0)
      Code.expect(calls.length).to.equal(1)
    })
  })
})
