'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambdaClient = new LambdaClient({
  region: process.env.LFW_DATA_TARGET_REGION
})

lab.experiment('Test rloiProcess lambda invoke', () => {
  lab.test('rloiProcess invoke no event expect error', async () => {
    const command = new InvokeCommand({
      FunctionName: `${process.env.LFW_DATA_TARGET_ENV_NAME}${process.env.LFW_DATA_SERVICE_CODE}-rloiProcess`
    })

    const data = await lambdaClient.send(command)

    if (data.StatusCode !== 200) {
      throw new Error('rloiProcess non 200 response')
    }

    if (!data.FunctionError) {
      throw new Error('rloiProcess should have errored')
    }

    const payload = JSON.parse(Buffer.from(data.Payload).toString())
    if (!payload?.errorMessage) {
      throw new Error('rloiProcess errorMessage missing in payload')
    }
  })
})
