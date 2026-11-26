const { parseStringPromise } = require('xml2js')
const fs = require('fs')

const util = require('../../../lib/helpers/util')
const rloi = require('../../../lib/models/rloi')
const s3 = require('../../../lib/helpers/s3')
const station = require('../../data/station.json')
const station2 = require('../../data/station2.json')
const coastalStation = require('../../data/station-coastal.json')
const { mockClient } = require('aws-sdk-client-mock')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const {
  valuesSchemaQueryMatcher,
  valuesSchemaVarsMatcher,
  valueParentSchemaQueryMatcher,
  valueParentSchemaVarsMatcher,
  stationSchemaQueryMatcher,
  stationSchemaVarsMatcher
} = require('../../schemas/matchers')

function clone (a) {
  return JSON.parse(JSON.stringify(a))
}

function getStubbedDbHelper () {
  const client = {
    query: jest.fn((...args) => {
      if (valueParentSchemaQueryMatcher.test(args[0]) && valueParentSchemaVarsMatcher.test(args[1])) {
        return Promise.resolve({ rows: [{ telemetry_value_parent_id: 1 }] })
      }
      return Promise.resolve()
    })
  }
  return client
}

// calls to client.query whose leading args satisfy the given schema matchers
function callsMatching (client, ...matchers) {
  return client.query.mock.calls.filter(args => matchers.every((m, i) => m.test(args[i])))
}

describe('rloi model', () => {
  let s3Mock
  let mockResponse

  beforeEach(() => {
    // setup mocks

    s3Mock = mockClient(S3Client)
    s3Mock.reset()

    mockResponse = {
      Body: {
        transformToString: jest.fn()
      }
    }

    mockResponse.Body.transformToString.mockResolvedValue(JSON.stringify(station))
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
  })

  afterEach(() => {
    s3Mock.restore()
  })

  it('RLOI process', async () => {
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(client.query).toHaveBeenCalledTimes(32)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(16)
    expect(callsMatching(client, valuesSchemaQueryMatcher)).toHaveLength(16)
  })

  it('RLOI process no station match', async () => {
    mockResponse.Body.transformToString.mockResolvedValue('')
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    // Will only process the Water level data as no station data returned therefore rloi data not needed (this is a bit over engineered)
    expect(client.query).toHaveBeenCalledTimes(3)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    expect(callsMatching(client, valuesSchemaQueryMatcher)).toHaveLength(1)
    expect(callsMatching(client, stationSchemaQueryMatcher, stationSchemaVarsMatcher)).toHaveLength(1)
  })

  it('single station with no set of values should not update db', async () => {
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-empty-single.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(client.query).toHaveBeenCalledTimes(0)
  })

  it('station with set of values should insert parent and value telemetry records in db', async () => {
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-single.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(client.query).toHaveBeenCalledTimes(2)
    expect(callsMatching(client, valuesSchemaQueryMatcher)).toHaveLength(1)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
  })

  it('RLOI process no station', async () => {
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
  })

  it('RLOI process no station', async () => {
    mockResponse.Body.transformToString.mockResolvedValue(JSON.stringify(station2))
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
  })

  it('RLOI process no station', async () => {
    mockResponse.Body.transformToString.mockResolvedValue(coastalStation)
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
  })

  describe('optional field branches', () => {
    function buildFile (itemAttrs, setAttrs) {
      return {
        EATimeSeriesDataExchangeFormat: {
          Station: [{
            $: itemAttrs,
            SetofValues: [{ $: setAttrs, Value: [{ $: { date: '2018-06-29', time: '11:00:00' }, _: '1.5' }] }]
          }]
        }
      }
    }

    it('handles a rainfall station with no ngr, an unmapped region and missing optional attributes', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('NoSuchKey'))
      const client = getStubbedDbHelper()
      const file = buildFile(
        { stationReference: 'X1', region: 'Unmapped', stationName: 'No postfix name' },
        { parameter: 'Rainfall', startDate: '2018-10-03', startTime: '09:15:00', endDate: '2018-10-03', endTime: '09:30:00' }
      )
      await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
      const stationCall = client.query.mock.calls.find(args => args[0] === 'slsTelemetryStation')
      expect(stationCall[1]).toEqual(['X1', 'Unmapped', 'No postfix name', undefined, undefined, undefined])
      const parentCall = client.query.mock.calls.find(args => args[0] === 'slsTelemetryValueParent')
      expect(parentCall[1].slice(-2)).toEqual(['', ''])
      expect(parentCall[1][7]).toBe('Rainfall')
      expect(parentCall[1][8]).toBe('')
      expect(parentCall[1][9]).toBe('')
    })

    it('strips a rainfall postfix from the station name', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('NoSuchKey'))
      const client = getStubbedDbHelper()
      const file = buildFile(
        { stationReference: 'X2', region: 'Anglian', stationName: 'Some Place FGS AND RAINGAUGE DUAL COMMS', ngr: 'SK078993' },
        { parameter: 'Rainfall', qualifier: 'Tipping Bucket', units: 'mm', dataType: 'Total', period: '15 min', startDate: '2018-10-03', startTime: '09:15:00', endDate: '2018-10-03', endTime: '09:30:00' }
      )
      await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
      const stationCall = client.query.mock.calls.find(args => args[0] === 'slsTelemetryStation')
      expect(stationCall[1][2]).toBe('Some Place')
      expect(stationCall[1][4]).toBeDefined()
    })

    it.each(['yes', 'n'])('uses the raw water level when Post_Process is %s and there is no Subtract', async (postProcess) => {
      const stationClone = clone(station)
      stationClone.Post_Process = postProcess
      delete stationClone.Subtract
      mockResponse.Body.transformToString.mockResolvedValue(JSON.stringify(stationClone))
      s3Mock.on(GetObjectCommand).resolves(mockResponse)
      const client = getStubbedDbHelper()
      const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-single.xml'))
      await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
      const valuesCall = client.query.mock.calls.find(args => args[0] === 'slsTelemetryValues')
      expect(valuesCall[1][0].processed_value).toBe(1.986)
    })
  })

  it('RLOI delete Old', async () => {
    const clientHelperMock = { query: jest.fn().mockResolvedValue() }
    await rloi.deleteOld(clientHelperMock)
    expect(clientHelperMock.query).toHaveBeenCalledTimes(1)
    expect(clientHelperMock.query).toHaveBeenCalledWith('deleteOldTelemetry')
  })

  it('RLOI process with non numeric return', async () => {
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    const client = getStubbedDbHelper()
    jest.spyOn(util, 'isNumeric').mockReturnValue(false)
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(client.query).toHaveBeenCalledTimes(32)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(16)
    expect(callsMatching(client, valuesSchemaQueryMatcher)).toHaveLength(16)
  })

  it('subtract values should be applied', async () => {
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-single.xml'))
    const stationClone = clone(station)
    stationClone.Subtract = 0.5
    mockResponse.Body.transformToString.mockResolvedValue(JSON.stringify(stationClone))
    s3Mock.on(GetObjectCommand).resolves(mockResponse)

    const client = getStubbedDbHelper()
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    const values = [
      {
        telemetry_value_parent_id: 1,
        value: 1.986,
        processed_value: 1.486,
        value_timestamp: '2018-06-29T11:00:00.000Z',
        error: false
      }
    ]

    const matched = callsMatching(client, valuesSchemaQueryMatcher, valuesSchemaVarsMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryValues', values])
  })

  it('negative processed values should not be errors', async () => {
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-single.xml'))
    const client = getStubbedDbHelper()
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    const values = [
      {
        telemetry_value_parent_id: 1,
        value: 1.986,
        processed_value: -0.014,
        value_timestamp: '2018-06-29T11:00:00.000Z',
        error: false
      }
    ]

    const matched = callsMatching(client, valuesSchemaQueryMatcher, valuesSchemaVarsMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryValues', values])
  })

  it('non-numeric values should be flagged as an error', async () => {
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-single.xml'))
    file.EATimeSeriesDataExchangeFormat.Station[0].SetofValues[0].Value[0]._ = 'blah'
    const client = getStubbedDbHelper()
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    const values = [
      {
        telemetry_value_parent_id: 1,
        value: NaN,
        processed_value: null,
        value_timestamp: '2018-06-29T11:00:00.000Z',
        error: true
      }
    ]

    const matched = callsMatching(client, valuesSchemaQueryMatcher, valuesSchemaVarsMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryValues', values])
  })

  it('non-numeric subtract values should be be flagged as an error', async () => {
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-single.xml'))
    const stationClone = clone(station)
    stationClone.Subtract = 'blah'
    mockResponse.Body.transformToString.mockResolvedValue(JSON.stringify(stationClone))
    s3Mock.on(GetObjectCommand).resolves(mockResponse)

    const client = getStubbedDbHelper()
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    const values = [
      {
        telemetry_value_parent_id: 1,
        value: 1.986,
        processed_value: null,
        value_timestamp: '2018-06-29T11:00:00.000Z',
        error: true
      }
    ]

    const matched = callsMatching(client, valuesSchemaQueryMatcher, valuesSchemaVarsMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryValues', values])
  })

  it('empty subtract values should be ignored', async () => {
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-single.xml'))
    const stationClone = clone(station)
    stationClone.Subtract = ''
    mockResponse.Body.transformToString.mockResolvedValue(JSON.stringify(stationClone))
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
    const client = getStubbedDbHelper()
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    const values = [
      {
        telemetry_value_parent_id: 1,
        value: 1.986,
        processed_value: 1.986,
        value_timestamp: '2018-06-29T11:00:00.000Z',
        error: false
      }
    ]

    const matched = callsMatching(client, valuesSchemaQueryMatcher, valuesSchemaVarsMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryValues', values])
  })

  it('Rainfall station and value is stored in DB and station name postfix is removed', async () => {
    mockResponse.Body.transformToString.mockResolvedValue('')
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-rainfall-postfix.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(client.query).toHaveBeenCalledTimes(3)
    expect(callsMatching(client, valuesSchemaQueryMatcher)).toHaveLength(1)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    expect(callsMatching(client, stationSchemaQueryMatcher, stationSchemaVarsMatcher)).toHaveLength(1)
    const expectedStationQuery = {
      values: [
        '067015_TG 132',
        'North West',
        'Test station',
        'SJ3484041474',
        334840,
        341474
      ]
    }
    const matched = callsMatching(client, stationSchemaQueryMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryStation', expectedStationQuery.values])
  })

  it('Rainfall station and value is stored in DB and station name without postfix', async () => {
    mockResponse.Body.transformToString.mockResolvedValue('')
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-rainfall.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(client.query).toHaveBeenCalledTimes(3)
    expect(callsMatching(client, valuesSchemaQueryMatcher, valuesSchemaVarsMatcher)).toHaveLength(1)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    expect(callsMatching(client, stationSchemaQueryMatcher, stationSchemaVarsMatcher)).toHaveLength(1)
    const expectedStationQuery = {
      values: [
        '067015_TG 132',
        'North West',
        'Test station',
        'SJ3484041474',
        334840,
        341474
      ]
    }
    const matched = callsMatching(client, stationSchemaQueryMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryStation', expectedStationQuery.values])
  })

  it('Rainfall station and value is stored in DB and station name with postfix in middle of name', async () => {
    mockResponse.Body.transformToString.mockResolvedValue('')
    s3Mock.on(GetObjectCommand).resolves(mockResponse)
    const client = getStubbedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test-rainfall-postfix-middle.xml'))
    await rloi.save(file, 's3://devlfw', 'testkey', client, s3)
    expect(client.query).toHaveBeenCalledTimes(3)
    expect(callsMatching(client, valuesSchemaQueryMatcher)).toHaveLength(1)
    expect(callsMatching(client, valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)).toHaveLength(1)
    expect(callsMatching(client, stationSchemaQueryMatcher, stationSchemaVarsMatcher)).toHaveLength(1)
    const expectedStationQuery = {
      values: [
        '067015_TG 132',
        'North West',
        'Test PLUVIO RAINGAUGE station',
        'SJ3484041474',
        334840,
        341474
      ]
    }
    const matched = callsMatching(client, stationSchemaQueryMatcher)
    expect(matched).toHaveLength(1)
    expect(matched[0]).toEqual(['slsTelemetryStation', expectedStationQuery.values])
  })
})
