const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const fs = require('fs')
const fwis = require('../../../lib/models/fwis')
const PostGresClient = require('../../../lib/helpers/postgres-client')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

lab.experiment('fwis model', () => {
  lab.beforeEach(() => {
    process.env.LFW_DATA_DB_CONNECTION  = 'LFW_DATA_DB_CONNECTION'
    // set the db mock
    sinon.stub(PostGresClient.prototype, 'query').callsFake(() => {
      return Promise.resolve({})
    })
  })

  lab.afterEach(() => {
    sinon.restore()
  })

  lab.test('fwis save', async () => {
    const file = JSON.parse(fs.readFileSync('./test/data/fwis.json').toString())
    const client = new PostGresClient({ connection: process.env.LFW_DATA_DB_CONNECTION })
    await fwis.save(file, 10000, client)
  })
})
