const fs = require('fs')
const ffoiSchema = require('../../schemas/ffoi')
const s3PutSchema = require('../../schemas/s3-put')

// mock s3 object
const ffoi = require('../../../lib/models/ffoi')
const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')

describe('ffoi model', () => {
  beforeEach(() => {
    jest.spyOn(s3, 'putObject').mockResolvedValue({})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('FFOI happy process', async () => {
    s3.putObject.mockImplementation((params) => {
      let result = s3PutSchema.validate(params)
      expect(result.error).toBe(undefined)
      const file = JSON.parse(params.Body)
      result = ffoiSchema.validate(file)
      expect(result.error).toBe(undefined)
      return Promise.resolve({ ETag: '"47f693afd590c0b546bc052f6cfb4b71"' })
    })
    const file = await util.parseXml(fs.readFileSync('./test/data/ffoi-test.xml'))
    await ffoi.save(file, 's3://devlfw', 'testKey', s3)
  })

  it('uploads and stores the max value for future values', async () => {
    jest.useFakeTimers({
      now: new Date('2030-11-27T19:00:00Z'),
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'queueMicrotask']
    })
    try {
      const pool = { query: jest.fn().mockResolvedValueOnce({}).mockRejectedValue(new Error('db error')) }
      jest.spyOn(console, 'error').mockImplementation(() => {})
      s3.putObject.mockRejectedValue(new Error('s3 error'))
      const file = await util.parseXml(fs.readFileSync('./test/data/ffoi-test.xml'))
      await ffoi.save(file, 's3://devlfw', 'testKey', s3, pool)
      expect(pool.query).toHaveBeenCalledWith('upsertFfoiMax', ['test2', '2.960', '2030-11-28T08:45:00Z', 'testKey', new Date('2030-11-27T19:00:00Z')])
      expect(s3.putObject).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  it('FFOI old file no useful values', async () => {
    s3.putObject.mockImplementation((params) => {
      let result = s3PutSchema.validate(params)
      expect(result.error).toBe(null)
      const file = JSON.parse(params.Body)
      result = ffoiSchema.validate(file)
      expect(result.error).toBe(null)
      return Promise.resolve({ ETag: '"47f693afd590c0b546bc052f6cfb4b71"' })
    })
    const file = await util.parseXml(fs.readFileSync('./test/data/ffoi-test-old.xml'))
    await ffoi.save(file, 's3://devlfw', 'testKey', s3)
  })

  it('S3 put error', async () => {
    s3.putObject.mockRejectedValue(new Error('test error'))
    const file = await util.parseXml(fs.readFileSync('./test/data/ffoi-test.xml'))
    await ffoi.save(file, 's3://devlfw', 'testkey', s3)
    // process continues and logs error to console
  })

  it('File with no water level data', async () => {
    const file = await util.parseXml(fs.readFileSync('./test/data/ffoi-test-no-water-level.xml'))
    await ffoi.save(file, 's3://devlfw', 'testkey', s3)
  })

  it('production console log', async () => {
    const stage = process.env.stage
    const file = await util.parseXml(fs.readFileSync('./test/data/ffoi-test.xml'))
    process.env.stage = 'ea'
    await ffoi.save(file, 's3://devlfw', 'testkey', s3)
    process.env.stage = stage
  })
})
