const s3 = require('../helpers/s3')
const wreck = require('../helpers/wreck')

module.exports.handler = async (event) => {
  // To do (KISS; keep it simple, stupid)
  // 1: Get latest statements from metoffice api
  const { statements } = await wreck.request('get', 'https://api.ffc-environment-agency.fgs.metoffice.gov.uk/api/public/statements', { json: true, timeout: 30000 }, true)

  // 2: Store latest statement in s3 bucket as {id}.json and latest.json
  await Promise.all([
    s3.putObject({
      Body: JSON.stringify(statements[0]),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: `fgs/${statements[0].id}.json`
    }),
    s3.putObject({
      Body: JSON.stringify(statements[0]),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: 'fgs/latest.json'
    })
  ])
}
