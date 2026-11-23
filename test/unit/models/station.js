const fs = require('fs')

const util = require('../../../lib/helpers/util')
const station = require('../../../lib/models/station')
const s3 = require('../../../lib/helpers/s3')
const { Client } = require('pg')

describe('station model', () => {
  beforeEach(() => {
    // setup mocks
    jest.spyOn(s3, 'putObject').mockResolvedValue({ ETag: '"47f693afd590c0b546bc052f6cfb4b71"' })
    jest.spyOn(Client.prototype, 'connect').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'query').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'end').mockResolvedValue({})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('Station save to database', async () => {
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    const client = new Client()
    await station.saveToDb(stations, client)
  })

  it('Station save to object', async () => {
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    await station.saveToObjects(stations, 'test', s3)
  })

  it('production console log', async () => {
    const stage = process.env.stage
    process.env.stage = 'ea'
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    await station.saveToObjects(stations, 'test', s3)
    process.env.stage = stage
  })

  it('s3 putobject error', async () => {
    jest.restoreAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => { })
    jest.spyOn(s3, 'putObject').mockImplementation((params) => {
      return new Promise((resolve, reject) => {
        if (params.Key.indexOf('stations.json') > -1) {
          return resolve({ ETag: '"47f693afd590c0b546bc052f6cfb4b71"' })
        } else {
          return reject(new Error('test error'))
        }
      })
    })
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    // expect save to handle erring indivudal s3 puts
    await station.saveToObjects(stations, 'test', s3)
  })

  it('db error', async () => {
    jest.restoreAllMocks()
    jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
      return Promise.reject(new Error('test error'))
    })
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    const client = new Client()
    await expect(station.saveToDb(stations, client)).rejects.toThrow()
  })
})
