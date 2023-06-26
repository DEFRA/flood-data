const { parseThresholds } = require('../models/parse-thresholds')
const axios = require('axios')
const logger = require('../helpers/logging')
const pg = require('../helpers/db')

async function insertThresholds (thresholds) {
  try {
    // TODO: decide on guards (e.g. don't overwrite existing record)
    const mappedThresholds = thresholds.map((t) => {
      return {
        station_id: t.stationId,
        fwis_code: t.floodWarningArea,
        fwis_type: t.floodWarningType,
        direction: t.direction,
        value: t.level
      }
    })
    await pg('station_imtd_threshold').insert(mappedThresholds)
  } catch (error) {
    logger.error('Error inserting thresholds:', error)
    throw error
  }
}

async function dropThresholds (stationId) {
  try {
    await pg('station_imtd_threshold').where({ station_id: stationId }).delete()
  } catch (error) {
    logger.error('Error dropping thresholds:', error)
    throw error
  }
}

async function getImtdApiResponse (stationId) {
  const hostname = 'imfs-prd1-thresholds-api.azurewebsites.net'
  try {
    return await axios.get(`https://${hostname}/Location/${stationId}?version=2`)
  } catch (error) {
    if (error.response.status === 404) {
      logger.info(`Station ${stationId} not found (HTTP Status: 404)`)
    } else {
      logger.error(`Request for station ${stationId} failed (HTTP Status: ${error.response?.status})`)
    }
    return {}
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
  const thresholds = await getIMTDThresholds(stationId, parseThresholds)
  if (thresholds.length > 0) {
    const parsedThresholds = parseThresholds(thresholds, stationId)
    if (parsedThresholds.length > 0) {
      await dropThresholds(stationId)
      await insertThresholds(parsedThresholds)
    }
  }
}

async function getRloiIds () {
  try {
    const stations = await pg('rivers_mview')
      .distinct('rloi_id')
      .whereNotNull('rloi_id')
      .orderBy('rloi_id', 'asc')
    return stations
  } catch (error) {
    throw Error(`Could not get list of id's from database (Error: ${error.message})`)
  }
}

async function handler (_event) {
  const MAX_LENGTH = 3

  const stations = await getRloiIds()

  const remainingStations = [...stations]

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, MAX_LENGTH)
    const promises = processStations.map(s => getData(s.rloi_id))
    await Promise.all(promises)
  }
}

module.exports.handler = handler
