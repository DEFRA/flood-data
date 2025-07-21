const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambda = new LambdaClient({})

module.exports = function invokeLambda (functionName, payload) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: Buffer.from(JSON.stringify(payload)),
    InvocationType: 'Event'
  })

  return lambda.send(command)
}
