'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambdaClient = new LambdaClient({
  region: process.env.LFW_DATA_TARGET_REGION
})

lab.experiment('Test rloiRefresh lambda invoke', () => {
  lab.test('rloiRefresh invoke', async () => {
    const command = new InvokeCommand({
      FunctionName: `${process.env.LFW_DATA_TARGET_ENV_NAME}${process.env.LFW_DATA_SERVICE_CODE}-rloiRefresh`
    })

    const data = await lambdaClient.send(command)

    if (data.StatusCode !== 200) {
      throw new Error('rloiRefresh non 200 response')
    }

    if (data.FunctionError) {
      const payload = JSON.parse(Buffer.from(data.Payload).toString())
      throw new Error('rloiRefresh error returned: ' + (payload?.errorMessage || 'Unknown error'))
    }
  })
})
