const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const { mockClient } = require('aws-sdk-client-mock')
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

// Import the module under test
const invokeLambda = require('../../../lib/helpers/invoke-lambda')

// Create the mock
const lambdaMock = mockClient(LambdaClient)

lab.experiment('invokeLambda', () => {
  lab.beforeEach(() => {
    lambdaMock.reset()
  })

  lab.test('it invokes the function passing the payload as its InvokeArgs', async () => {
    lambdaMock.on(InvokeCommand).resolves({ Payload: JSON.stringify({}) })
    await invokeLambda('some-function', { foo: 'bar' })

    const calls = lambdaMock.commandCalls(InvokeCommand)
    Code.expect(calls.length).to.equal(1)
    Code.expect(calls[0].args[0].input).to.equal({
      FunctionName: 'some-function',
      Payload: Buffer.from(JSON.stringify({ foo: 'bar' })),
      InvocationType: 'Event'
    })
  })

  lab.test('it should throw an error when the Lambda invocation fails', async () => {
    const mockErrorMessage = 'mock error'
    const mockError = new Error(mockErrorMessage)
    lambdaMock.on(InvokeCommand).rejects(mockError)

    const err = await Code.expect(invokeLambda('some-function', { foo: 'bar' })).to.reject()
    const invokeCalls = lambdaMock.commandCalls(InvokeCommand)
    Code.expect(invokeCalls).to.have.length(1)
    Code.expect(lambdaMock.send.calledOnce).to.be.true()
    Code.expect(err.message).to.equal(mockErrorMessage)
  })
})
