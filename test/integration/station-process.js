'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const lambdaClient = new LambdaClient({
  region: process.env.LFW_DATA_TARGET_REGION
})

const stationProcessInvokeTimeoutMs = Number(process.env.STATION_PROCESS_TEST_TIMEOUT_MS || 240000)

lab.experiment('Test stationProcess lambda invoke', () => {
  lab.test('stationProcess invoke', { timeout: stationProcessInvokeTimeoutMs }, async () => {
    // Skip this test if required environment variables are not set
    if (!process.env.LFW_DATA_TARGET_REGION || !process.env.LFW_DATA_SLS_BUCKET ||
        !process.env.LFW_DATA_TARGET_ENV_NAME || !process.env.LFW_DATA_SERVICE_CODE) {
      console.log('Skipping stationProcess test - missing environment variables:')
      console.log('  LFW_DATA_TARGET_REGION:', process.env.LFW_DATA_TARGET_REGION)
      console.log('  LFW_DATA_SLS_BUCKET:', process.env.LFW_DATA_SLS_BUCKET)
      console.log('  LFW_DATA_TARGET_ENV_NAME:', process.env.LFW_DATA_TARGET_ENV_NAME)
      console.log('  LFW_DATA_SERVICE_CODE:', process.env.LFW_DATA_SERVICE_CODE)
      return
    }

    console.log('Starting stationProcess Lambda invocation test')
    console.log('Test timeout (ms):', stationProcessInvokeTimeoutMs)
    console.log('Target region:', process.env.LFW_DATA_TARGET_REGION)
    console.log('S3 bucket:', process.env.LFW_DATA_SLS_BUCKET)

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

    const functionName = `${process.env.LFW_DATA_TARGET_ENV_NAME}${process.env.LFW_DATA_SERVICE_CODE}-stationProcess`
    console.log('Lambda function name:', functionName)

    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(event))
    })

    console.log('Sending Lambda invoke command...')
    let data
    try {
      data = await lambdaClient.send(command)
      console.log('Lambda invocation succeeded')
    } catch (error) {
      console.error('Lambda invocation failed:', error.message)
      throw error
    }

    console.log('Response status code:', data.StatusCode)
    console.log('Response has FunctionError:', !!data.FunctionError)

    if (data.StatusCode !== 200) {
      console.error('Non-200 status code received')
      throw new Error('stationProcess non 200 response')
    }

    if (data.FunctionError) {
      console.error('Lambda function returned an error')
      const payload = JSON.parse(Buffer.from(data.Payload).toString())
      console.error('Error payload:', payload)
      throw new Error('stationProcess error returned: ' + (payload?.errorMessage || 'Unknown error'))
    }

    console.log('stationProcess test completed successfully')
  })
})
