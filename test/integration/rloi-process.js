'use strict'
// ******* SETUP *******
// ***** Libraries *****
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const LambdaTester = require('lambda-tester')
const proxyquire = require('proxyquire').noCallThru()
const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const sinon = require('sinon').createSandbox()

// ***** Local Imports *****
const createPGClientWithRetry = require('../../lib/helpers/retry-db-connection')
const { logger } = require('../../lib/helpers/logger')

const lab = exports.lab = Lab.script()

const s3Client = new AWS.S3({
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE', // Replace with your access key ID
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', // Replace with your secret access key
  endpoint: 'http://localhost:9444',
  s3ForcePathStyle: true, // Required for S3 Ninja
  signatureVersion: 'v4'
})

const LFW_DATA_SLS_BUCKET = 'bucket'

const bucketName = LFW_DATA_SLS_BUCKET
const key = 'rloi/latest.xml'

const generateTelemetryLookUpKey = (prefix, suffix) => `${prefix}-${suffix}`

const rloiFileTestPath = path.join(__dirname, '../data/rloi-empty.xml')

lab.experiment('Test rloiProcess lambda invoke', { timeout: 999999000 }, () => {
  /** @type {PostgresClient} */
  let client
  let loggerInfo
  let loggerWarn
  let lambda

  lab.beforeEach(async function () {
    process.env.LFW_DATA_SLS_BUCKET = LFW_DATA_SLS_BUCKET
    process.env.NODE_ENV = 'LOCAL_TEST'
    process.env.LFW_DATA_DB_CONNECTION = 'postgresql://postgres:fr24Password@localhost:5432/flooddev'

    loggerInfo = sinon.stub(logger, 'info')
    loggerWarn = sinon.stub(logger, 'warn')
    lambda = proxyquire('../../lib/functions/rloi-process', {})

    try {
      /** @type {PostgresClient} */
      client = await createPGClientWithRetry(0)

      await s3Client.upload({
        Bucket: 'bucket',
        Key: 'rloi/Wales/066011_TG_9202/station.json',
        Body: JSON.stringify({
          RLOI_ID: 1,
          Region: 'Region 1',
          Post_Process: 'n',
          Station_Type: 'R'
        })
      }).promise()

      await s3Client.upload({
        Bucket: 'bucket',
        Key: 'rloi/Wales/067015_TG_132/station.json',
        Body: JSON.stringify({
          RLOI_ID: 2,
          Region: 'Region 2',
          Post_Process: 'n',
          Station_Type: 'R'
        })
      }).promise()

      const s3Data = fs.readFileSync(rloiFileTestPath).toString()

      await s3Client.upload({
        Body: s3Data,
        Bucket: bucketName,
        Key: key
      }).promise()
    } catch (error) {
      console.log('----ERROR-IN-BEFORE----')
      console.log(error)
      console.log('====ERROR-IN-BEFORE====')
    }
  })

  lab.afterEach(async function () {
    sinon.restore()
  })

  lab.test('should perform no operation when the station array is empty', async () => {
    const bucketName = LFW_DATA_SLS_BUCKET
    const key = 'rloi/rloi-test-no-stations.xml'
    const rloiFileTestPath = path.join(__dirname, '../data/rloi-test-no-stations.xml')

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
      .expectResult((lambdaResponse) => {
        Code.expect(lambdaResponse.length === 0).to.be.true()
      })
  })

  lab.test('should process and save valid station data', async () => {
    const bucketName = LFW_DATA_SLS_BUCKET
    const key = 'rloi/latest.xml'

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
        const telemetryValueParentId = lambdaResponse.map((data) => data.telemetry_value_parent_id).join(',')

        const { rows } = await client.query(`
          SELECT * FROM sls_telemetry_value WHERE telemetry_value_parent_id IN (${telemetryValueParentId});
        `)

        const telemetryLookupTable = {}

        for (const data of lambdaResponse) {
          const timestamp = Date(data.value_timestamp)
          const lookUpKey = generateTelemetryLookUpKey(data.telemetry_value_parent_id, timestamp)
          telemetryLookupTable[lookUpKey] = data
        }

        rows.forEach(element => {
          const timestamp = Date(element.value_timestamp)
          const lookUpKey = generateTelemetryLookUpKey(element.telemetry_value_parent_id, timestamp)

          const recordMatch = telemetryLookupTable[lookUpKey]

          Code.expect(Number(recordMatch.value)).to.equal(Number(element.value))
          Code.expect(Date(recordMatch.value_timestamp)).to.equal(timestamp)
          Code.expect(recordMatch.error).to.equal(element.error)
        })

        Code.expect(loggerInfo.callCount).to.equal(1)
      })
  })

  lab.test('should log a warning and continue when there is an issue retrieving station data from S3', async () => {
    const bucketName = LFW_DATA_SLS_BUCKET
    const key = 'rloi/latest.xml'
    const rloiFalseStationRefFileTestPath = path.join(__dirname, '../data/rloi-empty-false-station-ref.xml')
    const s3Data = fs.readFileSync(rloiFalseStationRefFileTestPath).toString()

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
        const telemetryValueParentId = lambdaResponse.map((data) => data.telemetry_value_parent_id).join(',')

        const { rows } = await client.query(`
          SELECT * FROM sls_telemetry_value WHERE telemetry_value_parent_id IN (${telemetryValueParentId});
        `)

        const telemetryLookupTable = {}

        for (const data of lambdaResponse) {
          const timestamp = Date(data.value_timestamp)
          const lookUpKey = generateTelemetryLookUpKey(data.telemetry_value_parent_id, timestamp)
          telemetryLookupTable[lookUpKey] = data
        }

        rows.forEach(element => {
          const timestamp = Date(element.value_timestamp)
          const lookUpKey = generateTelemetryLookUpKey(element.telemetry_value_parent_id, timestamp)

          const recordMatch = telemetryLookupTable[lookUpKey]

          Code.expect(Number(recordMatch.value)).to.equal(Number(element.value))
          Code.expect(Date(recordMatch.value_timestamp)).to.equal(timestamp)
          Code.expect(recordMatch.error).to.equal(element.error)
        })

        Code.expect(loggerInfo.callCount).to.equal(1)
        Code.expect(loggerWarn.callCount).to.equal(2)
      })
  })
})
