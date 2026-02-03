const { Pool } = require('../helpers/pool')
const s3 = require('../helpers/s3')
const util = require('../helpers/util')
const rloi = require('../models/rloi')
const fs = require('fs')
const path = require('path')

module.exports.handler = async (event) => {
  console.log('Received new event: ' + JSON.stringify(event))
  const bucket = event.Records[0].s3.bucket.name
  const key = event.Records[0].s3.object.key

  let bodyContents
  if (process.env.IS_LOCALSTACK === 'true') {
    const fixturePath = path.join(__dirname, '../../test/data/rloi-test.xml')
    bodyContents = fs.readFileSync(fixturePath, 'utf8')
  } else {
    const data = await s3.getObject({ Bucket: bucket, Key: key })
    bodyContents = await data.Body.transformToString()
  }

  const file = await util.parseXml(bodyContents)

  // use pool and not client due to multiple database queries
  const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION, max: 3 })
  await rloi.save(file, bucket, key, pool, s3)
  await pool.end()
}
