const { Pool } = require('../helpers/pool')
const s3 = require('../helpers/s3')
const util = require('../helpers/util')
const rloi = require('../models/rloi')

module.exports.handler = async (event) => {
  console.log('Received new event: ' + JSON.stringify(event))
  const bucket = event.Records[0].s3.bucket.name
  const key = event.Records[0].s3.object.key
  const data = await s3.getObject({ Bucket: bucket, Key: key })
  let bodyContents = ''
  if (data.Body && typeof data.Body.transformToString === 'function') {
    // Test mock or AWS SDK v3 convenience method
    bodyContents = await data.Body.transformToString()
  } else if (data.Body && typeof data.Body[Symbol.asyncIterator] === 'function') {
    // Node.js stream (production)
    for await (const chunk of data.Body) {
      bodyContents += chunk
    }
  } else {
    throw new Error('data.Body is not async iterable and has no transformToString method')
  }
  const file = await util.parseXml(bodyContents)

  // use pool and not client due to multiple database queries
  const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION, max: 3 })
  await rloi.save(file, bucket, key, pool, s3)
  await pool.end()
}
