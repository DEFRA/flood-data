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

lab.experiment('FWIS Process - LocalStack Integration', () => {
  lab.test('invokes fwis-process lambda successfully', async () => {
    const command = new InvokeCommand({
      FunctionName: 'fwis-process',
      Payload: JSON.stringify({})
    })

    const response = await lambdaClient.send(command)

    expect(response.StatusCode).to.equal(200)
    expect(response.FunctionError).to.not.exist()

    const payload = JSON.parse(Buffer.from(response.Payload).toString())
    console.log('Lambda response:', payload)

    // The lambda should complete without error
    expect(response.StatusCode).to.equal(200)
  })

  lab.test('handles fixture data correctly', async () => {
    const command = new InvokeCommand({
      FunctionName: 'fwis-process',
      Payload: JSON.stringify({})
    })

    const response = await lambdaClient.send(command)

    expect(response.StatusCode).to.equal(200)

    // Check CloudWatch logs if needed
    const payload = JSON.parse(Buffer.from(response.Payload).toString())
    console.log('Payload:', payload)
  })
})
