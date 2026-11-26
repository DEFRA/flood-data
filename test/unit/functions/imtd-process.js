'use strict'

const { handler } = require('../../../lib/functions/imtd-process')
const logger = require('../../../lib/helpers/logging')
const invokeLambda = require('../../../lib/helpers/invoke-lambda')
const parseThresholds = require('../../../lib/models/parse-thresholds')
const {
  stations: testStations,
  apiResponse: testApiResponse,
  apiNoMatchingThresholdResponse: testApiNoMatchingThresholdResponse,
  api404
} = require('../../data/imtd-stations')
const axios = require('axios')
const mockDb = require('mock-knex')
const db = require('../../../lib/helpers/db')
const tracker = mockDb.getTracker()

jest.mock('../../../lib/helpers/invoke-lambda')
jest.mock('../../../lib/models/parse-thresholds', () => {
  const actual = jest.requireActual('../../../lib/models/parse-thresholds')
  const wrapper = jest.fn(actual)
  wrapper.actual = actual
  return wrapper
})

function setupStdDbStubs (test) {
  const stations = test || testStations
  const methodCounter = {}
  tracker.on('query', function (query) {
    const responses = {
      select: stations,
      insert: [],
      del: []
    }
    const method = query.method || query.sql.toLowerCase().replace(';', '')
    methodCounter[method] = methodCounter[method] ? methodCounter[method] + 1 : 1
    query.response(responses[query.method])
  })
  return methodCounter
}

function setupAxiosStdStub (response = testApiResponse) {
  return jest.spyOn(axios, 'get').mockResolvedValue(response)
}

// imtd-api logs each request via the same logger, so only look at the handler's own info messages
function handlerInfoMessages () {
  return logger.info.mock.calls
    .map(args => args[0])
    .filter(message => !message.startsWith('IMTD API request for'))
}

describe('imtd processing', () => {
  beforeAll(() => {
    mockDb.mock(db)
  })

  afterAll(() => {
    mockDb.unmock(db)
  })

  beforeEach(async () => {
    tracker.install()
    jest.spyOn(logger, 'info').mockImplementation(() => {})
    jest.spyOn(logger, 'error').mockImplementation(() => {})
    invokeLambda.mockResolvedValue()
    parseThresholds.mockImplementation(parseThresholds.actual)
  })
  afterEach(() => {
    delete process.env.IMTD_BATCH_SIZE
    jest.restoreAllMocks()
    tracker.uninstall()
  })

  describe('happy path', () => {
    it('it should handle a 404 response with no thresholds to store', async () => {
      setupAxiosStdStub().mockRejectedValue({ response: api404 })
      const counter = setupStdDbStubs([{ rloi_id: 1001 }])
      await handler()
      expect(logger.error).not.toHaveBeenCalled()
      expect(counter).toEqual({ select: 1, del: 1 })
    })

    it('it should handle a response with no thresholds', async () => {
      setupAxiosStdStub(testApiNoMatchingThresholdResponse)
      const counter = setupStdDbStubs([{ rloi_id: 1001 }])
      await handler()
      expect(counter).toEqual({ select: 1, del: 1 })
    })
    it('it should select, delete and insert from DB in order and with expected values', async () => {
      tracker.on('query', function (query, step) {
        [
          () => {
            expect(query.method).toEqual('select')
            expect(query.sql).toEqual('select distinct "rloi_id" from "rivers_mview" where "rloi_id" is not null order by "rloi_id" asc limit $1')
            expect(query.bindings).toEqual([500])
            query.response([
              { rloi_id: 1001 }
            ])
          },
          () => {
            expect(query.sql).toEqual('BEGIN;')
            query.response()
          },
          () => {
            expect(query.method).toEqual('del')
            expect(query.sql).toEqual('delete from "station_imtd_threshold" where "station_id" = $1')
            expect(query.bindings).toEqual([1001])
            query.response([])
          },
          () => {
            expect(query.method).toEqual('insert')
            expect(query.sql).toEqual('insert into "station_imtd_threshold" ("direction", "fwis_code", "fwis_type", "station_id", "threshold_type", "value") values ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12), ($13, $14, $15, $16, $17, $18), ($19, $20, $21, $22, $23, $24), ($25, $26, $27, $28, $29, $30), ($31, $32, $33, $34, $35, $36)')
            expect(query.bindings).toEqual([
              'u', '065WAF423', 'A', 1001, 'FW ACTCON FAL', 33.4,
              'u', '065WAF423', 'A', 1001, 'FW ACTCON FAL', 33.9,
              'u', '065WAF423', 'A', 1001, 'FW RES FAL', 34.2,
              'u', '065FWF5001', 'W', 1001, 'FW ACTCON FW', 34.4,
              'u', '065FWF5001', 'W', 1001, 'FW ACT FW', 34.9,
              'u', '065FWF5001', 'W', 1001, 'FW RES FW', 35.2
            ])
            query.response([])
          },
          () => {
            expect(query.sql).toEqual('COMMIT;')
            query.response()
          }
        ][step - 1]()
      })

      setupAxiosStdStub()
      await handler()
      expect(logger.error).not.toHaveBeenCalled()
    })
    it('for multiple RLOI ids it should select, delete and insert from DB as expected', async () => {
      const counter = setupStdDbStubs()
      const axiosStub = setupAxiosStdStub()
      await handler()
      // 8 stations each with the same 6 thresholds (out of 10 thresholds for inclusion)
      /// 1 select, 8 deletes and 8 inserts (6 thresholds per insert)
      expect(axiosStub).toHaveBeenCalledTimes(8)
      expect(counter).toEqual({ begin: 8, select: 1, del: 8, insert: 8, commit: 8 })
    })
    it('it selects RLOI ids as expected with no offset', async () => {
      setupStdDbStubs()
      setupAxiosStdStub()

      const queries = []
      tracker.on('query', query => queries.push(query))
      await handler()

      expect(queries[0].sql).toEqual('select distinct "rloi_id" from "rivers_mview" where "rloi_id" is not null order by "rloi_id" asc limit $1')
      expect(queries[0].bindings).toEqual([500])
    })
    it('it selects RLOI ids as expected with an offset', async () => {
      setupStdDbStubs()
      setupAxiosStdStub()

      const queries = []
      tracker.on('query', query => queries.push(query))
      await handler({ offset: 1500 })

      expect(queries[0].sql).toEqual('select distinct "rloi_id" from "rivers_mview" where "rloi_id" is not null order by "rloi_id" asc limit $1 offset $2')
      expect(queries[0].bindings).toEqual([500, 1500])
    })
    it('it does not self invoke if number of rloi ids processed is less than batch size', async () => {
      process.env.IMTD_BATCH_SIZE = 10
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'some-function-name'
      setupStdDbStubs(Array.from({ length: 9 }).map((v, i) => ({ rloi_id: 1000 + i })))
      setupAxiosStdStub()

      await handler({ offset: 20 })

      expect(invokeLambda).not.toHaveBeenCalled()
    })
    it('it self invokes if number of rloi ids processed is equal to batch size', async () => {
      process.env.IMTD_BATCH_SIZE = 10
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'some-function-name'
      setupStdDbStubs(Array.from({ length: 10 }).map((v, i) => ({ rloi_id: 1000 + i })))
      setupAxiosStdStub()

      await handler({ offset: 20 })

      expect(invokeLambda).toHaveBeenCalledTimes(1)
      expect(invokeLambda).toHaveBeenCalledWith('some-function-name', { offset: 30 })
    })
    it('it should log to info the details of inserts and deletes', async () => {
      setupStdDbStubs([{ rloi_id: 1001 }])
      setupAxiosStdStub()

      await handler()

      const messages = handlerInfoMessages()
      expect(messages).toHaveLength(3)
      expect(messages[2]).toEqual('Processed 6 thresholds for RLOI id 1001')
    })
  })

  describe('sad path', () => {
    it('it should log an error when API returns a status which is an error and not a 404', async () => {
      const counter = setupStdDbStubs([{ rloi_id: 1001 }])
      setupAxiosStdStub().mockRejectedValue({ response: { status: 500 } })

      await handler()

      // Should only select (i.e. not delete or insert) if there is a non 404 error from API
      expect(counter).toEqual({ select: 1 })
    })
    it('it should log an error when network encounters an error', async () => {
      const counter = setupStdDbStubs([{ rloi_id: 1001 }])
      setupAxiosStdStub().mockRejectedValue(Error('getaddrinfo ENOTFOUND imfs-prd1-thresholds-api.azurewebsites.net'))

      await handler()

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith('Could not process data for station 1001 (IMTD API request for station 1001 failed (Error: getaddrinfo ENOTFOUND imfs-prd1-thresholds-api.azurewebsites.net))')

      // Should only select (i.e. not delete or insert) if there is a network error
      expect(counter).toEqual({ select: 1 })
    })
    it('it should process both RLOI ids even when first encounters an IMTD 500 error', async () => {
      const counter = setupStdDbStubs([
        { rloi_id: 1001 },
        { rloi_id: 1002 }
      ])
      setupAxiosStdStub()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValueOnce(testApiResponse)

      await handler()

      expect(handlerInfoMessages()).toHaveLength(3)
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith('Could not process data for station 1001 (IMTD API request for station 1001 failed (HTTP Status: 500))')

      expect(counter).toEqual({ select: 1, begin: 1, del: 1, insert: 1, commit: 1 })
    })
    it('it should throw an error when IMTD response is not parsable', async () => {
      const counter = setupStdDbStubs([{ rloi_id: 1001 }])
      setupAxiosStdStub()
      parseThresholds.mockImplementation(() => { throw Error('Parsing Fail') })

      await handler()

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith('Could not process data for station 1001 (Parsing Fail)')

      // Should only select (i.e. not delete or insert) if the IMTD response is not parsable
      expect(counter).toEqual({ select: 1 })
    })
    it('it should throw an error when DB connection fails when getting RLOI id\'s', async () => {
      tracker.on('query', function (query) {
        query.reject(Error('refused'))
      })
      setupAxiosStdStub().mockRejectedValue({ response: { status: 404 } })

      await expect(handler()).rejects.toThrow('Could not get list of id\'s from database (Error: select distinct "rloi_id" from "rivers_mview" where "rloi_id" is not null order by "rloi_id" asc limit $1 - refused)')

      expect(handlerInfoMessages()).toHaveLength(1)
      expect(logger.error).not.toHaveBeenCalled()
    })
    it('it should log an error and rollback when DB connection fails when deleting thresholds before inserting', async () => {
      tracker.on('query', function (query, step) {
        [
          () => {
            expect(query.method).toEqual('select')
            query.response([{ rloi_id: 1001 }])
          },
          () => {
            expect(query.sql).toEqual('BEGIN;')
            query.response()
          },
          () => {
            expect(query.method).toEqual('del')
            query.reject(Error('Delete Fail'))
          },
          () => {
            expect(query.sql).toEqual('ROLLBACK')
            query.response()
          }
        ][step - 1]()
      })
      setupAxiosStdStub()

      await handler()

      expect(logger.error).toHaveBeenCalledTimes(2)
      expect(logger.error).toHaveBeenNthCalledWith(1, 'Database error processing thresholds for station 1001', expect.any(Error))
      expect(logger.error).toHaveBeenNthCalledWith(2, 'Could not process data for station 1001 (delete from "station_imtd_threshold" where "station_id" = $1 - Delete Fail)')

      expect(handlerInfoMessages()).toHaveLength(2)
    })
    it('it should log an error when DB connection fails when deleting thresholds when there are no thresholds to insert', async () => {
      tracker.on('query', function (query, step) {
        [
          () => {
            expect(query.method).toEqual('select')
            query.response([{ rloi_id: 1001 }])
          },
          () => {
            expect(query.method).toEqual('del')
            query.reject(Error('Delete Fail'))
          }
        ][step - 1]()
      })
      setupAxiosStdStub(testApiNoMatchingThresholdResponse)

      await handler()

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith('Could not process data for station 1001 (delete from "station_imtd_threshold" where "station_id" = $1 - Delete Fail)')

      expect(handlerInfoMessages()).toHaveLength(2)
    })
    it('it should log an error and rollback when DB connection fails when inserting thresholds', async () => {
      tracker.on('query', function (query, step) {
        [
          () => {
            expect(query.method).toEqual('select')
            query.response([{ rloi_id: 1001 }])
          },
          () => {
            expect(query.sql).toEqual('BEGIN;')
            query.response()
          },
          () => {
            expect(query.method).toEqual('del')
            query.response()
          },
          () => {
            expect(query.method).toEqual('insert')
            query.reject(Error('Insert Fail'))
          },
          () => {
            expect(query.sql).toEqual('ROLLBACK')
            query.response()
          }
        ][step - 1]()
      })
      setupAxiosStdStub()

      await handler()

      expect(logger.error).toHaveBeenCalledTimes(2)
      expect(logger.error).toHaveBeenNthCalledWith(1, 'Database error processing thresholds for station 1001', expect.any(Error))
      expect(logger.error).toHaveBeenNthCalledWith(2, 'Could not process data for station 1001 (insert into "station_imtd_threshold" ("direction", "fwis_code", "fwis_type", "station_id", "threshold_type", "value") values ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12), ($13, $14, $15, $16, $17, $18), ($19, $20, $21, $22, $23, $24), ($25, $26, $27, $28, $29, $30), ($31, $32, $33, $34, $35, $36) - Insert Fail)')

      expect(handlerInfoMessages()).toHaveLength(2)
    })
  })
})
