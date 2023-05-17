'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const LambdaTester = require('lambda-tester')
const proxyquire = require('proxyquire').noCallThru()

const LFW_DATA_SLS_BUCKET = 'sls-bucket'

lab.experiment('Test fgsProcess lambda invoke', () => {
  let lambda

  lab.beforeEach(function () {
    process.env.LFW_DATA_SLS_BUCKET = LFW_DATA_SLS_BUCKET
    process.env.NODE_ENV = 'LOCAL_TEST'
    lambda = proxyquire('../../lib/functions/fgs-process', {})
  })

  lab.test('The fgsProcess is invoked to verify whether the Lambda function is correctly uploading stations using the appropriate key and bucket.', async () => {
    await LambdaTester(lambda.handler)
      .event({})
      .expectResult((lambdaResponse) => {
        lambdaResponse.forEach((data, idx) => {
          if (idx === 0) {
            const containsNumber = /\d/.test(data.Key)
            Code.expect(containsNumber).to.equal(true)
          } else {
            Code.expect(data.Key).to.equal('fgs/latest.json')
          }

          Code.expect(data.Bucket).to.equal(LFW_DATA_SLS_BUCKET)
        })
      })
  })
})
