const { parseThresholds } = require('../models/parse-thresholds')
const { Pool } = require('pg')
const axios = require('axios')
// const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const pool = new Pool({ connectionString: 'postgres://u_flood:secret@localhost:5433/flooddev' })
const queries = require('../queries')

let client

module.exports.handler = async _event => {
  try {
    client = await pool.connect()
    const result = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')
    const stations = result.rows

    fetchDataForStationIds(stations)
      .then(results => {
        const flattenedData = results
          .filter(arr => arr.length > 0) // Remove empty arrays
          .reduce((acc, curr) => acc.concat(curr), [])

        writeToTable(flattenedData, client)
      })
      .catch(error => {
        console.error(`Error fetching data: ${error.message}`)
      })
  } catch (error) {
    console.log(pool.options)
    console.error('Error acquiring client:', error)
  }
}

async function fetchDataForStationIds (stations) {
  const MAX_LENGTH = 50
  const remainingStations = [...stations]
  const results = []

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, MAX_LENGTH)

    // Use Promise.all to make all API requests in parallel
    const promises = processStations.map(async (stationId) => {
      try {
        const station = stationId.rloi_id
        const response = await axios.get(
          `https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${station}?version=2`
        )
        const thresholds = await parseThresholds(
          response.data[0].TimeSeriesMetaData,
          station
        )
        return thresholds
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('No response from API for station: ', {
            rloi_id: stationId.rloi_id
          })
        } else {
          console.error(
            `Error fetching data for station ID ${stationId}: ${error.message}`
          )
        }
        return null
      }
    })

    // Await all promises to finish and add non-null results to the results array
    const processResults = await Promise.all(promises)
    results.push(...processResults.filter((res) => res !== null))
  }

  return results
}

async function writeToTable (data, client) {
  await pool.query(queries.deleteImtd)
  console.log('Truncating the IMTD table')

  // loop through each object in the data array
  for (const obj of data) {
    // build the INSERT query string
    const query = queries.insertImtd
    // execute the query with the values from the current object
    await client.query(query, [obj.stationId, obj.floodWarningArea, obj.floodWarningType, obj.direction, obj.level])
  }
  console.log('Data written to table successfully.')
  client.release()
}
