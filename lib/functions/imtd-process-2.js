const { parseThresholds } = require('../models/parse-thresholds')
const { Pool } = require('pg')
const axios = require('axios')
const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const queries = require('../queries')
const logger = require('../helpers/logging')

const insertThreshold = async (stationId, threshold) => {
  const query = queries.insertImtd
  const values = [
    stationId,
    threshold.floodWarningArea,
    threshold.floodWarningType,
    threshold.direction,
    threshold.level
  ]
  // console.log(`${stationId},${threshold.floodWarningArea},${threshold.floodWarningType},${threshold.direction},${threshold.level}`)
  await pool.query(query, values)
}

const dropThresholds = async (stationId) => {
  await pool.query('DELETE FROM u_flood.station_imtd_threshold WHERE station_id = $1', stationId)
}

const getData = (stationId) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://imfs-prd1-thresholds-api.azurewebsites.net/Location/${stationId}?version=2`)
      .then(async res => {
        try {
          const thresholds = parseThresholds(res.data[0].TimeSeriesMetaData)
          await dropThresholds(stationId)
          thresholds.forEach(async threshold => {
            try {
              await insertThreshold(stationId, threshold)
            } catch (err) {
              logger.log(`Error inserting station threshold ${stationId} - ${err}`)
            }
          })
        } catch (err) {
          logger.log(`Error processing station ${stationId} - ${err}`)
        }
        return `Successfully processed station ${stationId}`
      })
      .then((data) => {
        // Insert extra logging here if required.
        resolve(data)
      })
      .catch((err) => {
        logger.log(`Station ${stationId} error - ${err}`)
        resolve(`Error processing station ${stationId}. Status is ${err.response?.status}`)
      })
  })
}

async function handler (_event) {
  const { rows: stations } = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')

  const MAX_LENGTH = 3
  const remainingStations = [...stations]

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, MAX_LENGTH)
    const promises = await processStations.map(async s => { getData(s.rloi_id) })
    await Promise.all(promises)
  }
}

module.exports.handler = handler
