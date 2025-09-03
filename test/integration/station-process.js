'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambdaClient = new LambdaClient({
  region: process.env.LFW_DATA_TARGET_REGION
})

lab.experiment('Test stationProcess lambda invoke', () => {
  lab.test('stationProcess invoke', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: process.env.LFW_DATA_SLS_BUCKET
            },
            object: {
              key: 'fwfidata/ENT_7010/rloiStationData.csv'
            }
          }
        }
      ]
    }

    const command = new InvokeCommand({
      FunctionName: `${process.env.LFW_DATA_TARGET_ENV_NAME}${process.env.LFW_DATA_SERVICE_CODE}-stationProcess`,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(event))
    })

    const data = await lambdaClient.send(command)

    if (data.StatusCode !== 200) {
      throw new Error('stationProcess non 200 response')
    }

    if (data.FunctionError) {
      const payload = JSON.parse(Buffer.from(data.Payload).toString())
      throw new Error('stationProcess error returned: ' + (payload?.errorMessage || 'Unknown error'))
    }
  })
})
