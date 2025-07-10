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
      Payload: Buffer.from(JSON.stringify({ foo: 'bar' }))
    })
  })

  lab.test('it should throw an error when the Lambda invocation response payload contains a FunctionError with an error message and stack trace', async () => {
    const errorMessage = 'Lambda error'
    const stackTrace = ['mock trace']
    const mockResponse = {
      FunctionError: 'Unhandled',
      Payload: JSON.stringify({ errorMessage, stackTrace })
    }

    lambdaMock.on(InvokeCommand).resolves(mockResponse)

    const err = await Code.expect(invokeLambda('some-function', { foo: 'bar' })).to.reject()
    const invokeCalls = lambdaMock.commandCalls(InvokeCommand)
    Code.expect(invokeCalls).to.have.length(1)
    Code.expect(lambdaMock.send.calledOnce).to.be.true()
    Code.expect(err.message).to.equal(errorMessage)
    Code.expect(err.stack).to.equal(stackTrace)
  })

  lab.test('it should throw an error when the Lambda invocation response payload contains a FunctionError without an error message and stack trace', async () => {
    const errorMessage = 'Lambda invocation failed'
    const mockResponse = {
      FunctionError: 'Unhandled',
      Payload: JSON.stringify({})
    }

    lambdaMock.on(InvokeCommand).resolves(mockResponse)

    const err = await Code.expect(invokeLambda('some-function', { foo: 'bar' })).to.reject()
    const invokeCalls = lambdaMock.commandCalls(InvokeCommand)
    Code.expect(invokeCalls).to.have.length(1)
    Code.expect(lambdaMock.send.calledOnce).to.be.true()
    Code.expect(err.message).to.equal(errorMessage)
    Code.expect(err.stack).to.contain(errorMessage)
  })
})
