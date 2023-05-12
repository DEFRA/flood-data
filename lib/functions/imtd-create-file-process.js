const retry = require('async-retry')
const { Client } = require('pg')
const s3 = require('../helpers/s3')

module.exports.handler = async _event => {
  // Get all Stations from Flood DB

  const stations = await getStations()
  console.log('Number of stations: ', stations.length)

  // send to S3
  await Promise.all([
    s3.putObject({
      Body: JSON.stringify(stations),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: 'imtd/latest.json'
    })
  ])

  // STAY retry wrapper for client connection
  async function getStations () {
    let client
    await retry(async () => {
      client = new Client({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
      await client.connect()
    }, {
      retries: 2,
      factor: 2,
      minTimeout: 2000,
      onRetry: async (err, attempt) => {
        try {
          await client.end()
        } catch (e) {
          console.error(e)
        }
        console.error(`client connect failed (${attempt})`)
        console.error(err)
      }
    })

    const result = await client.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')
    console.log('Number of stations from database: ', result.rows.length)
    await client.end()
    return result.rows
  }
}
