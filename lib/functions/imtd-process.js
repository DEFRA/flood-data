const { parseThresholds } = require('../models/parse-thresholds')
const { Pool } = require('pg')
const axios = require('axios')
const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const queries = require('../queries')
const logger = require('../helpers/logging')

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

        if (flattenedData.length > 0) {
          writeToTable(flattenedData)
        } else {
          logger.log('Error: Empty array')
          releaseClientAndLogError(new Error('Empty array'))
        }
      })
      .catch(error => {
        logger.error(`Error fetching data: ${error.message}`)
        releaseClientAndLogError(error)
      })
  } catch (error) {
    logger.log(pool.options)
    logger.error('Error acquiring client:', error)
  }
}

async function fetchDataForStationIds (stations) {
  const MAX_LENGTH = 50
  const remainingStations = [...stations]
  const results = []

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, MAX_LENGTH)

    // Use Promise.all to make all API requests in parallel
    const promises = processStations.map(async stationId => {
      try {
        const station = stationId.rloi_id
        const response = await axios.get(
          `https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${station}?version=2`
        )
        return await parseThresholds(response.data[0].TimeSeriesMetaData, station)
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('No response from API for station: ', {
            rloi_id: stationId.rloi_id
          })
        } else {
          logger.error(
            `Error fetching data for station ID ${stationId.rloi_id}: ${error.message}`
          )
        }
        return null
      }
    })

    // Await all promises to finish and add non-null results to the results array
    // const processResults = await Promise.all(promises)
    const processResults = promises
    results.push(...processResults.filter(res => res !== null))
  }

  return results
}

async function writeToTable (data) {
  await pool.query(queries.truncImtd)
  logger.log('Truncating the IMTD table')

  // loop through each object in the data array
  for (const obj of data) {
    // build the INSERT query string
    const query = queries.insertImtd
    // execute the query with the values from the current object
    await client.query(query, [obj.stationId, obj.floodWarningArea, obj.floodWarningType, obj.direction, obj.level])
  }
  logger.log(`Data written to table successfully (${data.length} rows).`)
  releaseClientAndLogError(null)
}

async function releaseClientAndLogError (error) {
  if (client) {
    client.release()
  }
  if (error) {
    logger.error('Error:', error.message)
  }
}
