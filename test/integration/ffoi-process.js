'use strict'
// ******* SETUP *******
// ***** Libraries *****
const Lab = require('@hapi/lab')
const LambdaTester = require('lambda-tester')
const proxyquire = require('proxyquire').noCallThru()
const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const sinon = require('sinon').createSandbox()

const lab = exports.lab = Lab.script()

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

  lab.beforeEach(async function () {
    process.env.LFW_DATA_SLS_BUCKET = LFW_DATA_SLS_BUCKET
    process.env.NODE_ENV = 'LOCAL_TEST'
    process.env.LFW_DATA_DB_CONNECTION = 'postgresql://postgres:fr24Password@localhost:5432/flooddev'
    lambda = proxyquire('../../lib/functions/ffoi-process', {})
  })

  lab.afterEach(async function () {
    sinon.restore()
  })

  lab.test('should perform no operation when the station array is empty', async () => {
    const bucketName = LFW_DATA_SLS_BUCKET
    const key = 'rloi/rloiStationData.xml'
    const rloiFileTestPath = path.join(__dirname, '../data/ffoi-test.xml')

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
        console.log('----lambdaResponse----')
        console.log(lambdaResponse)
        console.log('====lambdaResponse====')
      })
  })
})
