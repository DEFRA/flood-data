'use strict'
// ******* SETUP *******
// ***** Libraries *****
const Lab = require('@hapi/lab')
const LambdaTester = require('lambda-tester')
const Code = require('@hapi/code')
const proxyquire = require('proxyquire').noCallThru()
const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const sinon = require('sinon').createSandbox()

const lab = exports.lab = Lab.script()

// ***** Local Imports *****
const createPGClientWithRetry = require('../../lib/helpers/retry-db-connection')

const s3Client = new AWS.S3({
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE', // Replace with your access key ID
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', // Replace with your secret access key
  endpoint: 'http://localhost:9444',
  s3ForcePathStyle: true, // Required for S3 Ninja
  signatureVersion: 'v4'
})

const LFW_DATA_SLS_BUCKET = 'bucket'

lab.experiment('Test ffoiProcess lambda invoke', { timeout: 999999000 }, () => {
  let lambda
  /** @type {PostgresClient} */
  let client

  lab.beforeEach(async function () {
    process.env.LFW_DATA_SLS_BUCKET = LFW_DATA_SLS_BUCKET
    process.env.NODE_ENV = 'LOCAL_TEST'
    process.env.LFW_DATA_DB_CONNECTION = 'postgresql://postgres:fr24Password@localhost:5432/flooddev'
    lambda = proxyquire('../../lib/functions/ffoi-process', {})
    /** @type {PostgresClient} */
    client = await createPGClientWithRetry(0)
  })

  lab.afterEach(async function () {
    sinon.restore()
  })

  lab.test('should upload data to S3 and update the database', async () => {
    const bucketName = LFW_DATA_SLS_BUCKET
    const key = 'rloi/rloiStationData.xml'
    const rloiFileTestPath = path.join(__dirname, '../data/ffoi-test-no-water-level.xml')

    const s3Data = fs.readFileSync(rloiFileTestPath).toString()

    await s3Client.upload({
      Body: s3Data,
      Bucket: bucketName,
      Key: key
    }).promise()

    const event = {
      Records: [{ s3: { object: { key }, bucket: { name: bucketName } } }]
    }

    await LambdaTester(lambda.handler)
      .event(event)
      .expectResult(async (lambdaResponse) => {
        // Verify that the data was uploaded to S3
        for (let i = 0; i < lambdaResponse.length; i += 2) {
          const s3Data = await s3Client.getObject({ Bucket: bucketName, Key: lambdaResponse[i].Key }).promise()
          Code.expect(s3Data).to.exist()
        }

        // Verify that the data was inserted into the database
        for (let i = 1; i < lambdaResponse.length; i += 2) {
          const telemetryId = lambdaResponse[i].rows[0].telemetry_id
          const dbData = await client.query('SELECT * FROM u_flood.ffoi_max WHERE telemetry_id = $1', [telemetryId])
          Code.expect(dbData.rows[0]).to.exist()
        }
      })
  })
})
