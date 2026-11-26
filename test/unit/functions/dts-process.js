'use strict'

const { handler, validateStationData } = require('../../../lib/functions/dts-process')
const { getImtdApiResponse } = require('../../../lib/helpers/imtd-api')
const logger = require('../../../lib/helpers/logging')
const invokeLambda = require('../../../lib/helpers/invoke-lambda')

const {
  stations: testStations,
  apiResponse: testApiResponse,
  api404
} = require('../../data/imtd-stations')

const axios = require('axios')
const mockDb = require('mock-knex')
const db = require('../../../lib/helpers/db')
const tracker = mockDb.getTracker()

jest.mock('../../../lib/helpers/invoke-lambda')

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

describe('DTS processing', () => {
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
    jest.spyOn(console, 'log').mockImplementation(() => {})
    invokeLambda.mockResolvedValue()
  })
  afterEach(() => {
    delete process.env.IMTD_BATCH_SIZE
    jest.restoreAllMocks()
    tracker.uninstall()
  })

  it('it should handle a 404 response and delete the station from the DB', async () => {
    setupAxiosStdStub(api404)
    const counter = setupStdDbStubs([{ rloi_id: 1001 }])
    await handler()
    expect(counter).toEqual({ begin: 1, commit: 1, del: 1, select: 1 })
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

    expect(handlerInfoMessages()).toEqual([
      'Retrieving up to 500 rloi_ids with an offset of 0',
      'Retrieved 1 rloi_ids',
      'Processed displayTimeSeries for RLOI id 1001'
    ])
  })
  it('it should return empty object from getImtdApiResponse when API returns 404 for a given RLOI id', async () => {
    jest.spyOn(axios, 'get').mockRejectedValue({ response: { status: 404 } })

    const data = await getImtdApiResponse(1001)
    expect(data).toEqual({})
  })
  it('it should return object from getImtdApiResponse when API successful returns data for a given RLOI id', async () => {
    setupAxiosStdStub()
    const data = await getImtdApiResponse(1001)
    expect(data.status).toBe(200)
  })
  it('it should throw an error when DB connection fails when getting RLOI id\'s', async () => {
    tracker.on('query', function (query) {
      query.reject(Error('refused'))
    })
    jest.spyOn(axios, 'get').mockRejectedValue({ response: { status: 404 } })

    await expect(handler()).rejects.toThrow('Could not get list of id\'s from database (Error: select distinct "rloi_id" from "rivers_mview" where "rloi_id" is not null order by "rloi_id" asc limit $1 - refused)')

    expect(handlerInfoMessages()).toHaveLength(1)
    expect(logger.error).not.toHaveBeenCalled()
  })
  it('it should log an error when API returns a status which is an error and not a 404', async () => {
    const counter = setupStdDbStubs([{ rloi_id: 1001 }])
    setupAxiosStdStub().mockRejectedValue({ response: { status: 500 } })

    await handler()

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith('Could not process data for station 1001 (IMTD API request for station 1001 failed (HTTP Status: 500))')

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
    expect(logger.error).toHaveBeenNthCalledWith(1, 'Database error processing stationData', expect.any(Error))
    expect(logger.error).toHaveBeenNthCalledWith(2, 'Could not process data for station 1001 (delete from "station_display_time_series" where "station_id" = $1 - Delete Fail)')

    expect(handlerInfoMessages()).toHaveLength(2)
  })
  describe('validateStationData', () => {
    let stationDataArray

    beforeEach(() => {
      stationDataArray = [
        {
          station_id: 1,
          direction: 'north',
          display_time_series: true
        },
        {
          station_id: 2,
          direction: 'south',
          display_time_series: false
        }
      ]
    })

    it('validates the station data successfully', async () => {
      const result = await validateStationData(stationDataArray)
      expect(result).toEqual(stationDataArray)
    })

    it('throws an error when station data is invalid', async () => {
      stationDataArray[0].station_id = 'invalid'
      await expect(validateStationData(stationDataArray)).rejects.toThrow('Validation error: "station_id" must be a number')
    })
  })
})
