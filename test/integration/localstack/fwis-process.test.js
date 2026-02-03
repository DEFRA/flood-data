'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const lab = exports.lab = Lab.script()
const { InvokeCommand } = require('@aws-sdk/client-lambda')
const { setup, lambdaClient } = require('./setup')

lab.experiment('LocalStack Integration: fwis-process', () => {
  lab.before(async () => {
    await setup()
  })

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
  })
})
