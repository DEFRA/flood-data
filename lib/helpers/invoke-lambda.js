const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambda = new LambdaClient({})

module.exports = async function invokeLambda (FunctionName, payload) {
  const command = new InvokeCommand({
    FunctionName,
    Payload: Buffer.from(JSON.stringify(payload))
  })

  const response = await lambda.send(command)

  const responsePayload = JSON.parse(Buffer.from(response.Payload).toString())

  if (response.FunctionError) {
    const error = new Error(responsePayload.errorMessage || 'Lambda invocation failed')

    if (responsePayload.stackTrace) {
      error.stack = responsePayload.stackTrace
    }

    throw error
  }

  return responsePayload
}
