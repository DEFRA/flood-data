const s3 = require('../helpers/s3')
const wreck = require('../helpers/wreck')

module.exports.handler = async (_event) => {
  // To do (KISS; keep it simple, stupid)
  // 1: Get latest statements from metoffice api
  const { statement } = await wreck.request('get', 'https://api.ffc-environment-agency.fgs.metoffice.gov.uk/api/public/v1/statements/latest', { json: true, timeout: 30000 }, true)

  // 2: Store latest statement in s3 bucket as {id}.json and latest.json
  return Promise.all([
    s3.upload({
      Body: JSON.stringify(statement),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: `fgs/${statement.id}.json`
    }),
    s3.upload({
      Body: JSON.stringify(statement),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: 'fgs/latest.json'
    })
  ])
}
