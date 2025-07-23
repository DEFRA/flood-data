const s3 = require('../helpers/s3')
const util = require('../helpers/util')
const station = require('../models/station')
const { Pool } = require('../helpers/pool')

module.exports.handler = async (event) => {
  try {
    console.log('📥 Received S3 event: ' + JSON.stringify(event))

    const bucket = event.Records[0].s3.bucket.name
    const key = event.Records[0].s3.object.key

    console.log(`📄 File received: s3://${bucket}/${key}`)

    const data = await s3.getObject({ Bucket: bucket, Key: key })
    console.log(`📦 File size: ${data.ContentLength} bytes`)

    const stations = await util.parseCsv(data.Body.toString())
    console.log(`✅ Parsed ${stations.length} stations from CSV`)

    if (!Array.isArray(stations) || stations.length === 0) {
      console.warn('⚠️ No stations parsed — skipping DB/S3 writes')
      return
    }

    const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })

    try {
      await station.saveToDb(stations, pool)
      await station.saveToObjects(stations, bucket, s3)
    } finally {
      await pool.end()
      console.log('🧹 Database connection closed')
    }

    console.log('🎉 Lambda completed successfully')
  } catch (err) {
    console.error('💥 Lambda failed:', err)
    throw err
  }
}
