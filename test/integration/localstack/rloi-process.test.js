'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const lab = exports.lab = Lab.script()
const { InvokeCommand } = require('@aws-sdk/client-lambda')
const { setup, lambdaClient, bucket } = require('./setup')

lab.experiment('LocalStack Integration: rloi-process', () => {
  lab.before(async () => {
    await setup()
  })

  lab.test('invokes rloi-process with S3 event', async () => {
    const s3Event = {
      Records: [{
        s3: {
          bucket: { name: bucket },
          object: { key: 'rloi/test-data.xml' }
        }
      }]
    }

    const command = new InvokeCommand({
      FunctionName: 'rloi-process',
      Payload: JSON.stringify(s3Event)
    })

    const response = await lambdaClient.send(command)

    expect(response.StatusCode).to.equal(200)

    if (response.FunctionError) {
      const payload = JSON.parse(Buffer.from(response.Payload).toString())
      console.log('Error:', payload)
      throw new Error('Lambda invocation failed: ' + payload.errorMessage)
    }

    const payload = JSON.parse(Buffer.from(response.Payload).toString())
    console.log('Lambda response:', payload)
  })
})
