const { Pool } = require('pg')
const { parseThresholds } = require('../models/parse-thresholds')
const { processListWithConcurrency } = require('./promise')
const queries = require('../queries')
const axios = require('axios')

const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })

/**
 * An array of parsed threshold data for the given station IDs.
 * @typedef {Array<{ level: string; direction: string; floodWarningType: string; floodWarningArea: string; stationId: string; }>} ThresholdData
 */

/**
 * Fetches data for multiple station IDs using an API endpoint and returns an array of parsed thresholds.
 *@async
 *@function fetchDataForStationIds
 *@param {Array<string>} processIds - An array of station IDs.
 *@returns {Promise<ThresholdData|Array<ThresholdData>>} An array of parsed thresholds for the given station IDs.
 *@throws {Error} If no valid results are found.
 */
exports.fetchDataForStationIds = async (processIds) => {
  const results = await processListWithConcurrency({
    list: processIds,
    cb: async (stationId) => {
      try {
        const station = stationId.rloi_id
        const response = await axios.get(
          `https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${station}?version=2`
        )

        return parseThresholds(response.data[0].TimeSeriesMetaData, station)
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
        return null // return null in case of error
      }
    }
  })

  // Filter out null results
  const validResults = results.filter((result) => result !== null)

  if (!validResults) {
    throw new Error('No results found.')
  }

  return validResults
}

/**
  * Writes an array of objects to a PostgreSQL table.
  * @async
  * @function writeToTable
  * @param {ThresholdData} data - An array of objects containing data to be written to the PostgreSQL table.
  * @returns {Promise<void>} A Promise that resolves when the write operation is completed.
  * @throws {Error} If an error occurs while writing to the table.
  */
exports.writeToTable = async (data) => {
  let client

  try {
    client = await pool.connect()
  } catch (error) {
    console.log(pool.options)
    console.error('Error acquiring client:', error)
  }

  try {
    // loop through each object in the data array
    for (const obj of data) {
      // build the INSERT query string
      const query = queries.insertImtd
      // execute the query with the values from the current object
      await client.query(query, [
        obj.stationId,
        obj.floodWarningArea,
        obj.floodWarningType,
        obj.direction,
        obj.level
      ])
    }
  } catch (err) {
    console.error('Error writing to table:', err)
  } finally {
    // release the client back to the pool
    client.release()
  }
}
