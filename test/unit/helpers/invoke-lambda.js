const { mockClient } = require('aws-sdk-client-mock')
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

// Import the module under test
const invokeLambda = require('../../../lib/helpers/invoke-lambda')

// Create the mock
const lambdaMock = mockClient(LambdaClient)

describe('invokeLambda', () => {
  beforeEach(() => {
    lambdaMock.reset()
  })

  it('it invokes the function passing the payload as its InvokeArgs', async () => {
    lambdaMock.on(InvokeCommand).resolves({ Payload: JSON.stringify({}) })
    await invokeLambda('some-function', { foo: 'bar' })

    const calls = lambdaMock.commandCalls(InvokeCommand)
    expect(calls.length).toBe(1)
    expect(calls[0].args[0].input).toEqual({
      FunctionName: 'some-function',
      Payload: Buffer.from(JSON.stringify({ foo: 'bar' })),
      InvocationType: 'Event'
    })
  })

  it('it should throw an error when the Lambda invocation fails', async () => {
    const mockErrorMessage = 'mock error'
    const mockError = new Error(mockErrorMessage)
    lambdaMock.on(InvokeCommand).rejects(mockError)

    await expect(invokeLambda('some-function', { foo: 'bar' })).rejects.toThrow(mockErrorMessage)
    const invokeCalls = lambdaMock.commandCalls(InvokeCommand)
    expect(invokeCalls).toHaveLength(1)
    expect(lambdaMock.send.calledOnce).toBe(true)
  })
})
