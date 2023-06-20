const { parseThresholds } = require('../models/parse-thresholds')
const { Pool } = require('pg')
const axios = require('axios')
const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
const queries = require('../queries')
const logger = require('../helpers/logging')

async function insertThreshold (threshold) {
  try {
    const query = queries.insertImtd
    const values = [
      threshold.stationId,
      threshold.floodWarningArea,
      threshold.floodWarningType,
      threshold.direction,
      threshold.level
    ]
    await pool.query(query, values)
  } catch (error) {
    logger.error('Error inserting threshold:', error)
    throw error
  }
}

async function dropThresholds (stationId) {
  try {
    await pool.query('DELETE FROM u_flood.station_imtd_threshold WHERE station_id = $1', [stationId])
  } catch (error) {
    logger.error('Error dropping thresholds:', error)
    throw error
  }
}

async function insertThresholds (thresholds) {
  for (const threshold of thresholds) {
    try {
      await insertThreshold(threshold)
    } catch (error) {
      logger.error('Error inserting thresholds:', error)
      throw error
    }
  }
}

async function getImtdApiResponse (stationId) {
  const hostname = 'imfs-prd1-thresholds-api.azurewebsites.net'
  try {
    return await axios.get(`https://${hostname}/Location/${stationId}?version=2`)
  } catch (error) {
    if (error.response.status === 404) {
      logger.info(`Station ${stationId} not found (HTTP Status: 404)`)
      return {}
    } else {
      logger.error(`Request for station ${stationId} failed (HTTP Status: ${error.response?.status})`)
      return {}
    }
  }
}

async function getIMTDThresholds (stationId) {
  const response = await getImtdApiResponse(stationId)
  if (response.data) {
    return response.data[0].TimeSeriesMetaData
  }
  return []
}

async function getData (stationId) {
  const thresholds = await getIMTDThresholds(stationId)
  if (thresholds.length > 0) {
    const parsedThresholds = parseThresholds(thresholds, stationId)
    await dropThresholds(stationId)
    await insertThresholds(parsedThresholds)
  }
}

async function handler (_event) {
  const { rows: stations } = await pool.query('select distinct rloi_id from rivers_mview where rloi_id is not null order by rloi_id asc')

  const MAX_LENGTH = 3
  const remainingStations = [...stations]

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, MAX_LENGTH)
    const promises = processStations.map(s => getData(s.rloi_id))
    await Promise.all(promises)
  }
}

module.exports.handler = handler
