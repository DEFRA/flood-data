const retry = require('async-retry')
const { Client } = require('pg')
const { parseThresholds } = require('../models/parse-thresholds')
const s3 = require('../helpers/s3')
const wreck = require('../helpers/wreck')
// const connectionString = process.env.LFW_DATA_DB_CONNECTION

module.exports.handler = async (event) => {
  // Get all Stations from Flood DB

  const stations = await getDBStuff()
  console.log('Number of stations: ', stations.length)
  stations.map((station) => console.log('Station: ', station.rloi_id))

  const stationBuffer = []
  let stationIndex = 0

  while (stationIndex < stations.length) {
    // Limit number of concurrent calls to the IMTD api to 50

    for (let j = 0; j < 50; j++) {
      if (stationIndex < stations.length) {
        stationBuffer.push((await getData(stations[stationIndex].rloi_id, stationIndex)))
        console.log(stationIndex)
        stationIndex++
      } else {
        break
      }
    }

    await Promise.all(stationBuffer).then(stationData => {
      console.log('stationData: ', stationData)
    })

    stationBuffer.splice(0, stationBuffer.length)

    console.log('stationIndex: ', stationIndex)
  }

  // send to S3
  await Promise.all([
    s3.putObject({
      Body: JSON.stringify(stationBuffer),
      Bucket: process.env.LFW_DATA_SLS_BUCKET,
      Key: 'imtd/latest.json'
    })
  ])

  // STAY retry wrapper for client connection
  async function getDBStuff () {
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

const getData = async (stationId, stationIndex) => {
  const station = stationId
  const response = await wreck.request('get', `https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${station}?version=2`, {
    json: true,
    timeout: 30000
  }, true)

  parseThresholds(response[0].TimeSeriesMetaData)

  return response
}
