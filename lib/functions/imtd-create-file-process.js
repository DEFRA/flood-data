const retry = require('async-retry')
const { Client } = require('pg')
const s3 = require('../helpers/s3')

/**
 * Fetches all distinct station data from the database and uploads to S3.
 * @param {Record<string,any>} _event - AWS Lambda uses this parameter to pass in event data to the handler.
 * @returns {Promise<void>}
 */
module.exports.handler = async (_event) => {
  const fileName = 'imtd/latest.json'

  const stations = await getStations()
  console.log('Number of stations: ', stations.length)

  try {
    await s3.putObject({
      Body: JSON.stringify(stations),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: fileName
    })
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw error
  }
}

/**
 * Tries to connect to the database and fetches station data.
 * @returns {Promise<Array<Record<string, any>>} - The station data.
 */
async function getStations () {
  // Setup and connect to database client
  const client = new Client({
    connectionString: process.env.LFW_DATA_DB_CONNECTION
  })

  await retry(
    async () => {
      await client.connect()
    },
    {
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
    }
  )
  // Query stations
  let result
  try {
    result = await client.query(
      'select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc'
    )
    console.log('Number of stations from database: ', result.rows.length)
  } catch (error) {
    console.error('Error querying stations:', error)
    throw error
  } finally {
    // Ensure client connection is closed
    await client.end()
  }

  return result.rows
}
