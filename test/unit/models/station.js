const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const fs = require('fs')

const util = require('../../../lib/helpers/util')
const station = require('../../../lib/models/station')
const s3 = require('../../../lib/helpers/s3')
const PostgresClient = require('../../../lib/helpers/postgres-client')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

lab.experiment('station model', () => {
  lab.beforeEach(() => {
    process.env.LFW_DATA_DB_CONNECTION = 'LFW_DATA_DB_CONNECTION'
    // setup mocks
    sinon.stub(s3, 'putObject').callsFake(() => {
      return Promise.resolve({ ETag: '"47f693afd590c0b546bc052f6cfb4b71"' })
    })
    sinon.stub(PostgresClient.prototype, 'query').callsFake(() => {
      return Promise.resolve({})
    })
  })
  lab.afterEach(() => {
    sinon.restore()
  })

  lab.test('Station save to database', async () => {
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    const client = new PostgresClient({ connection: process.env.LFW_DATA_DB_CONNECTION })
    await station.saveToDb(stations, client)
  })

  lab.test('Station save to object', async () => {
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    await station.saveToUploads(stations, 'test', s3)
  })

  lab.test('production console log', async () => {
    const stage = process.env.stage
    process.env.stage = 'ea'
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    await station.saveToUploads(stations, 'test', s3)
    process.env.stage = stage
  })

  lab.test('s3 putobject error', async () => {
    s3.putObject.restore()
    sinon.stub(s3, 'putObject').callsFake((params) => {
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
    await station.saveToUploads(stations, 'test', s3)
  })

  lab.test('db error', async () => {
    PostgresClient.prototype.query.restore()
    sinon.stub(PostgresClient.prototype, 'query').callsFake((query) => {
      return Promise.reject(new Error('test error'))
    })
    const stations = await util.parseCsv(fs.readFileSync('./test/data/rloiStationData.csv').toString())
    const client = new PostgresClient({ connection: process.env.LFW_DATA_DB_CONNECTION })
    await Code.expect(station.saveToDb(stations, client)).to.reject()
  })
})
