const { parseThresholds } = require('../models/parse-thresholds')
const { Pool } = require('pg')
const axios = require('axios')
const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const queries = require('../queries')

let client

module.exports.handler = async (_event) => {
  try {
    client = await pool.connect()
    const result = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')
    const stations = result.rows

    const results = await fetchDataForStationIds(stations)

    const flattenedData = results
      .filter((arr) => arr.length > 0) // Remove empty arrays
      .reduce((acc, curr) => acc.concat(curr), [])

    if (flattenedData.length > 0) {
      await writeToTable(flattenedData)
    } else {
      console.log('Error: Empty array')
      releaseClientAndLogError(new Error('Empty array'))
    }
  } catch (error) {
    console.log(pool.options)
    console.error('Error acquiring client:', error)
    releaseClientAndLogError(error)
  }
}

async function fetchDataForStationIds (stations) {
  const MAX_LENGTH = 50
  const remainingStations = [...stations]
  const results = []

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, MAX_LENGTH)
    const processResults = []

    for (const stationId of processStations) {
      try {
        const station = stationId.rloi_id
        const response = await axios.get(`https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${station}?version=2`)
        const parsedData = await parseThresholds(response.data[0].TimeSeriesMetaData, station)
        processResults.push(parsedData)
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('No response from API for station:', { rloi_id: stationId.rloi_id })
        } else {
          console.error(`Error fetching data for station ID ${stationId.rloi_id}: ${error.message}`)
        }
      }
    }

    results.push(...processResults.filter((res) => res !== null))
  }

  return results
}

async function writeToTable (data) {
  await pool.query(queries.truncImtd)
  console.log('Truncating the IMTD table')

  // loop through each object in the data array
  for (const obj of data) {
    // build the INSERT query string
    const query = queries.insertImtd
    // execute the query with the values from the current object
    await client.query(query, [obj.stationId, obj.floodWarningArea, obj.floodWarningType, obj.direction, obj.level])
  }
  console.log('Data written to table successfully.')
  releaseClientAndLogError(null)
}

function releaseClientAndLogError (error) {
  if (client) {
    client.release()
  }
  if (error) {
    console.error('Error:', error.message)
  }
}
