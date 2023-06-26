'use strict'

const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Code = require('@hapi/code')
const event = require('../../events/imtd-event.json')
const {
  stations: testStations,
  apiResponse: testApiResponse,
  apiNoMatchingThresholdResponse: testApiNoMatchingThresholdResponse
} = require('../../data/imtd-stations')
const axios = require('axios')
const proxyquire = require('proxyquire')
const mockDb = require('mock-knex')
const db = require('../../../lib/helpers/db')
const tracker = mockDb.getTracker()

const { handler } = require('../../../lib/functions/imtd-process')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

function setupStdDbStubs (test) {
  const stations = test || testStations
  const methodCounter = {}
  tracker.on('query', function (query) {
    const responses = {
      select: stations,
      insert: [],
      del: []
    }
    methodCounter[query.method] = methodCounter[query.method] ? methodCounter[query.method] + 1 : 1
    query.response(responses[query.method])
  })
  return methodCounter
}

function setupAxiosStdStub (response = testApiResponse) {
  return sinon.stub(axios, 'get').resolves(response)
}

lab.experiment('imtd processing', () => {
  lab.before(() => {
    mockDb.mock(db)
  })

  lab.after(() => {
    mockDb.unmock(db)
  })

  lab.beforeEach(async () => {
    tracker.install()
  })
  lab.afterEach(() => {
    sinon.restore()
    tracker.uninstall()
  })

  lab.test('imtd process latest.json stations', async () => {
    setupStdDbStubs()
    setupAxiosStdStub()
    await handler(event)
  })

  lab.experiment('happy path', () => {
    lab.experiment('IMTD response without thresholds', () => {
      lab.test('it should handle a response with no thresholds', async () => {
        setupAxiosStdStub(testApiNoMatchingThresholdResponse)
        const counter = setupStdDbStubs([{ rloi_id: 1001 }])
        await handler(event)
        Code.expect(counter).to.equal({ select: 1 })
      })
    })
    lab.experiment('IMTD response with thresholds', () => {
      lab.test('it should select, delete and insert from DB in order and with expected values', async () => {
        tracker.on('query', function (query, step) {
          [
            () => {
              Code.expect(query.method).to.equal('select')
              Code.expect(query.sql).to.equal('select distinct "rloi_id" from "rivers_mview" where "rloi_id" is not null order by "rloi_id" asc')
              query.response([
                { rloi_id: 1001 }
              ])
            },
            () => {
              Code.expect(query.method).to.equal('del')
              Code.expect(query.sql).to.equal('delete from "station_imtd_threshold" where "station_id" = $1')
              Code.expect(query.bindings).to.equal([1001])
              query.response([])
            },
            () => {
              Code.expect(query.method).to.equal('insert')
              Code.expect(query.sql).to.equal('insert into "station_imtd_threshold" ("direction", "fwis_code", "fwis_type", "station_id", "value") values ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15), ($16, $17, $18, $19, $20), ($21, $22, $23, $24, $25), ($26, $27, $28, $29, $30)')
              Code.expect(query.bindings).to.equal([
                'u', '065WAF423', 'A', 1001, 33.4,
                'u', '065WAF423', 'A', 1001, 33.9,
                'u', '065WAF423', 'A', 1001, 34.2,
                'u', '065FWF5001', 'W', 1001, 34.4,
                'u', '065FWF5001', 'W', 1001, 34.9,
                'u', '065FWF5001', 'W', 1001, 35.2
              ])
              query.response([])
            }
          ][step - 1]()
        })

        setupAxiosStdStub()
        await handler(event)
      })
      lab.test('for multiple RLOI ids it should select, delete and insert from DB as expectecd', async () => {
        const counter = setupStdDbStubs()
        const axiosStub = setupAxiosStdStub()
        await handler(event)
        // 8 stations each with the same 6 thresholds (out of 10 thresholds for inclusion)
        /// 1 select, 8 deletes and 8 inserts (6 thresholds per insert)
        Code.expect(axiosStub.callCount).to.equal(8)
        Code.expect(counter).to.equal({ select: 1, del: 8, insert: 8 })
      })
    })
  })

  lab.experiment('sad path', () => {
    lab.test('it should log to info when API returns 404 for a given RLOI id', async () => {
      setupStdDbStubs([{ rloi_id: 1001 }])
      sinon.stub(axios, 'get').rejects({ response: { status: 404 } })
      const logger = {
        info: sinon.spy(),
        error: sinon.spy()
      }
      const { handler } = proxyquire('../../../lib/functions/imtd-process', {
        '../helpers/logging': logger
      })

      await handler(event)

      const logInfoCalls = logger.info.getCalls()
      Code.expect(logInfoCalls.length).to.equal(1)
      Code.expect(logInfoCalls[0].args[0]).to.equal('Station 1001 not found (HTTP Status: 404)')

      const logErrorCalls = logger.error.getCalls()
      Code.expect(logErrorCalls.length).to.equal(0)
    })
    lab.test('it should log an error when API returns a status which is an error and not a 404', async () => {
      const counter = setupStdDbStubs([{ rloi_id: 1001 }])
      const axiosStub = setupAxiosStdStub()
      axiosStub.rejects({ response: { status: 500 } })
      const logger = {
        info: sinon.spy(),
        error: sinon.spy()
      }
      const { handler } = proxyquire('../../../lib/functions/imtd-process', {
        '../helpers/logging': logger
      })

      await handler()

      const logErrorCalls = logger.error.getCalls()
      Code.expect(logErrorCalls.length).to.equal(1)
      Code.expect(logErrorCalls[0].args[0]).to.equal('Request for station 1001 failed (HTTP Status: 500)')

      Code.expect(counter).to.equal({ select: 1 })
    })
    lab.test('it should process both RLOI ids even when first encounters an IMTD 500 error', async () => {
      const test = [
        { rloi_id: 1001 },
        { rloi_id: 1002 }
      ]

      const counter = setupStdDbStubs(test)
      const axiosStub = setupAxiosStdStub()
      axiosStub
        .onFirstCall().rejects({ response: { status: 500 } })
        .onSecondCall().resolves(testApiResponse)
      const logger = {
        info: sinon.spy(),
        error: sinon.spy()
      }
      const { handler } = proxyquire('../../../lib/functions/imtd-process', {
        '../helpers/logging': logger
      })

      await handler()

      const logInfoCalls = logger.info.getCalls()
      Code.expect(logInfoCalls.length).to.equal(0)

      const logErrorCalls = logger.error.getCalls()
      Code.expect(logErrorCalls.length).to.equal(1)
      Code.expect(logErrorCalls[0].args[0]).to.equal('Request for station 1001 failed (HTTP Status: 500)')

      Code.expect(counter).to.equal({ select: 1, del: 1, insert: 1 })
    })
    lab.test('it should throw an error when IMTD response is not parsable (TODO)')
    lab.test('it should throw an error when DB connection fails', async () => {
      tracker.on('query', function (query) {
        query.reject(Error('refused'))
      })
      sinon.stub(axios, 'get').rejects({ response: { status: 404 } })
      const logger = {
        info: sinon.spy(),
        error: sinon.spy()
      }
      const { handler } = proxyquire('../../../lib/functions/imtd-process', {
        '../helpers/logging': logger
      })

      const returnedError = await Code.expect(handler()).to.reject()
      Code.expect(returnedError.message).to.equal('Could not get list of id\'s from database (Error: select distinct "rloi_id" from "rivers_mview" where "rloi_id" is not null order by "rloi_id" asc - refused)')

      const logInfoCalls = logger.info.getCalls()
      Code.expect(logInfoCalls.length).to.equal(0)

      const logErrorCalls = logger.error.getCalls()
      Code.expect(logErrorCalls.length).to.equal(0)
    })
  })
})
