const { parseThresholds } = require('../models/parse-thresholds')
const { Pool } = require('pg')
const axios = require('axios')
const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const queries = require('../queries')
const logger = require('../helpers/logging')

async function insertThreshold (threshold) {
  // TODO: add try/catch for error handling
  const query = queries.insertImtd
  const values = [
    threshold.stationId,
    threshold.floodWarningArea,
    threshold.floodWarningType,
    threshold.direction,
    threshold.level
  ]
  // console.log(`${stationId},${threshold.floodWarningArea},${threshold.floodWarningType},${threshold.direction},${threshold.level}`)
  await pool.query(query, values)
}

async function dropThresholds (stationId) {
  // TODO: add try/catch for error handling
  await pool.query('DELETE FROM u_flood.station_imtd_threshold WHERE station_id = $1', stationId)
}

async function insertThresholds (thresholds) {
  thresholds.forEach(async threshold => {
    await insertThreshold(threshold)
  })
}

async function getImtdApiResponse (stationId) {
  const hostname = 'imfs-prd1-thresholds-api.azurewebsites.net'
  try {
    return await axios.get(`https://${hostname}/Location/${stationId}?version=2`)
  } catch (err) {
    logger.error(`failed to get response for ${stationId}`)
  }
}

async function getData (stationId) {
  const response = await getImtdApiResponse(stationId)
  if (response) {
    const thresholds = parseThresholds(response.data[0].TimeSeriesMetaData, stationId)
    await dropThresholds(stationId)
    await insertThresholds(thresholds)
  }
}

async function handler (_event) {
  const { rows: stations } = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')

  const MAX_LENGTH = 3
  const remainingStations = [...stations]

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, MAX_LENGTH)
    const promises = await processStations.map(s => {
      return getData(s.rloi_id)
    })
    await Promise.all(promises)
  }
}

module.exports.handler = handler
