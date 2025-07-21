const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambda = new LambdaClient({})

module.exports = function invokeLambda (FunctionName, payload) {
  const command = new InvokeCommand({
    FunctionName,
    Payload: Buffer.from(JSON.stringify(payload)),
    InvocationType: 'Event'
  })

  return lambda.send(command)
}
