
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const s3 = require('../helpers/s3')

module.exports.handler = async _event => {
  // Get all Stations from Flood DB

  const stations = await getStationsFromTable()
  console.log('Number of stations: ', stations.length)

  // send to S3
  try {
  await Promise.all([
    s3.putObject({
      Body: JSON.stringify(stations),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: 'imtd/latest.json'
    })
  ])
} catch (err) {
  console.error(err)
  return Promise.reject(err)
}

  // STAY retry wrapper for client connection
  async function getStationsFromTable () {
    let client

    try {
      client = await pool.connect()
    } catch (error) {
      console.log(pool.options)
      console.error('Error acquiring client:', error)
    }
    try {
      const result = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')
      console.log('Number of stations from database: ', result.rows.length)
      return result.rows
    } catch (err) {
      console.error('Error reading from table:', err)
    } finally {
      // release the client back to the pool
      client.release()
    }
  }
}
