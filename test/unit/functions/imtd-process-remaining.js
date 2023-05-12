// 'use strict'

// const Lab = require('@hapi/lab')
// const lab = (exports.lab = Lab.script())
// const handler = require('../../../lib/functions/imtd-process').handler
// const event = require('../../events/imtd-event-remaining.json')
// const maxStations = require('../../data/imtd-stations').maxStations
// const lessStations = require('../../data/imtd-stations').lessStations
// const apiResponse = require('../../data/imtd-stations').apiResponse
// const axios = require('axios')

// const s3 = require('../../../lib/helpers/s3')
// const { Pool } = require('pg')

// // start up Sinon sandbox
// const sinon = require('sinon').createSandbox()

// lab.experiment('imtd processing', () => {
//   lab.beforeEach(async () => {
//     process.env.LFW_DATA_DB_CONNECTION = ''
//     // setup mocks
//     sinon.stub(s3, 'deleteObject').callsFake(() => {
//       return Promise.resolve({})
//     })
//     sinon.stub(s3, 'putObject').callsFake(() => {
//       return Promise.resolve({})
//     })
//     sinon.stub(Pool.prototype, 'connect').callsFake(() => {
//       return Promise.resolve({
//         query: sinon.stub().resolves({}),
//         release: sinon.stub().resolves({})
//       })
//     })
//     sinon.stub(Pool.prototype, 'query').callsFake(() => {
//       return Promise.resolve({})
//     })
//     sinon.stub(Pool.prototype, 'end').callsFake(() => {
//       return Promise.resolve({})
//     })
//   })
//   lab.afterEach(() => {
//     sinon.restore()
//   })

//   lab.test('imtd process latest.json stations length over 50', async () => {
//     const stub = sinon.stub(s3, 'getObject')

//     stub.onFirstCall().rejects(createCustomError('Test Error', 'NoSuchKey'))

//     stub.onSecondCall().resolves({ Body: maxStations })

//     function createCustomError (message, code) {
//       const customError = new Error(message)
//       customError.code = code
//       return customError
//     }

//     sinon.stub(axios, 'get').callsFake(() => {
//       return Promise.resolve(apiResponse)
//     })

//     await handler(event)
//   })

//   lab.test('imtd process latest.json stations length under 50', async () => {
//     const stub = sinon.stub(s3, 'getObject')

//     stub.onFirstCall().rejects(createCustomError('Test Error', 'NoSuchKey'))

//     stub.onSecondCall().resolves({ Body: lessStations })

//     function createCustomError (message, code) {
//       const customError = new Error(message)
//       customError.code = code
//       return customError
//     }

//     sinon.stub(axios, 'get').callsFake(() => {
//       return Promise.resolve(apiResponse)
//     })

//     await handler(event)
//   })
//   lab.test('imtd process no files found in the s3', async () => {
//     const stub = sinon.stub(s3, 'getObject')

//     stub.onFirstCall().rejects(createCustomError('Test Error', 'NoSuchKey'))

//     stub.onSecondCall().rejects(createCustomError('Test Error', 'NoSuchKey'))

//     function createCustomError (message, code) {
//       const customError = new Error(message)
//       customError.code = code
//       return customError
//     }

//     sinon.stub(axios, 'get').callsFake(() => {
//       return Promise.resolve(apiResponse)
//     })

//     await handler(event)
//   })
// })
