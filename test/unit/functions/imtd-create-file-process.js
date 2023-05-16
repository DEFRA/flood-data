'use strict'

const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Code = require('@hapi/code')
const handler = require('../../../lib/functions/imtd-create-file-process').handler
const event = require('../../events/imtd-file-create-event.json')
const maxStations = require('../../data/imtd-stations').maxStations

const s3 = require('../../../lib/helpers/s3')
const { Pool } = require('pg')

// start up Sinon sandbox
const sinon = require('sinon').createSandbox()

lab.experiment('imtd create file', () => {
  lab.beforeEach(async () => {
    process.env.LFW_DATA_DB_CONNECTION = ''
    // setup mocks

    sinon.stub(s3, 'putObject').callsFake(() => {
      return Promise.resolve({})
    })
    sinon.stub(Pool.prototype, 'connect').callsFake(() => {
      return Promise.resolve({
        query: sinon.stub().resolves({}),
        release: sinon.stub().resolves({})
      })
    })
    sinon.stub(Pool.prototype, 'query').callsFake(() => {
      return Promise.resolve({ rows: maxStations })
    })
    sinon.stub(Pool.prototype, 'end').callsFake(() => {
      return Promise.resolve({})
    })
  })
  lab.afterEach(() => {
    sinon.restore()
  })

  lab.test('imtd create file process pulls data in from database', async () => {
    await handler(event)
  })

  lab.test('imtd process S3 error', async () => {
    s3.putObject = () => {
      return Promise.reject(new Error('test error'))
    }
    await Code.expect(handler(event)).to.reject()
  })
})
