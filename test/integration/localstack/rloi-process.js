const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lab = exports.lab = Lab.script()

const lambdaClient = new LambdaClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
})

lab.experiment('RLOI Process - LocalStack Integration', () => {
  lab.test('invokes rloi-process lambda with S3 event', async () => {
    const s3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-flood-data-bucket'
            },
            object: {
              key: 'rloi/rloi-test.xml'
            }
          }
        }
      ]
    }

    const command = new InvokeCommand({
      FunctionName: 'rloi-process',
      Payload: JSON.stringify(s3Event)
    })

    const response = await lambdaClient.send(command)

    expect(response.StatusCode).to.equal(200)

    if (response.FunctionError) {
      const payload = JSON.parse(Buffer.from(response.Payload).toString())
      console.error('Lambda error:', payload)
      throw new Error(`Lambda failed: ${JSON.stringify(payload)}`)
    }

    const payload = JSON.parse(Buffer.from(response.Payload).toString())
    console.log('Lambda response:', payload)
  })

  lab.test('processes XML data from LocalStack S3', async () => {
    const s3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-flood-data-bucket'
            },
            object: {
              key: 'rloi/rloi-test.xml'
            }
          }
        }
      ]
    }

    const command = new InvokeCommand({
      FunctionName: 'rloi-process',
      Payload: JSON.stringify(s3Event)
    })

    const response = await lambdaClient.send(command)

    expect(response.StatusCode).to.equal(200)
    expect(response.FunctionError).to.not.exist()
  })
})
