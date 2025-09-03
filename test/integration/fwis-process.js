'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambdaClient = new LambdaClient({
  region: process.env.LFW_DATA_TARGET_REGION
})

lab.experiment('Test fwisProcess lambda invoke', () => {
  lab.test('fwisProcess invoke', async () => {
    const command = new InvokeCommand({
      FunctionName: `${process.env.LFW_DATA_TARGET_ENV_NAME}${process.env.LFW_DATA_SERVICE_CODE}-fwisProcess`
    })

    const data = await lambdaClient.send(command)

    if (data.StatusCode !== 200) {
      throw new Error('fwisProcess non 200 response')
    }

    if (data.FunctionError) {
      const payload = JSON.parse(Buffer.from(data.Payload).toString())
      throw new Error('fwisProcess error returned: ' + (payload?.errorMessage || 'Unknown error'))
    }
  })
})
