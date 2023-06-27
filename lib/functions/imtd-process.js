const parseThresholds = require('../models/parse-thresholds')
const axios = require('axios')
const logger = require('../helpers/logging')
const pg = require('../helpers/db')

async function deleteThresholds (stationId) {
  try {
    await pg('station_imtd_threshold').where({ station_id: stationId }).delete()
    logger.info(`Deleted thresholds for RLOI id ${stationId}`)
  } catch (error) {
    logger.error(`Error deleting thresholds for station ${stationId}`, error)
    throw error
  }
}

async function insertThresholds (stationId, thresholds) {
  try {
    const mappedThresholds = thresholds.map((t) => {
      return {
        station_id: stationId,
        fwis_code: t.floodWarningArea,
        fwis_type: t.floodWarningType,
        direction: t.direction,
        value: t.level
      }
    })
    await pg.transaction(async (trx) => {
      await trx('station_imtd_threshold').where({ station_id: stationId }).delete()
      await trx('station_imtd_threshold').insert(mappedThresholds)
      logger.info(`Processed ${mappedThresholds.length} thresholds for RLOI id ${stationId}`)
    })
  } catch (error) {
    logger.error(`Error processing thresholds for station ${stationId}`, error)
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
      throw Error(`IMTD Request for station ${stationId} failed (HTTP Status: ${error.response?.status})`)
    }
    return {}
  }
}

async function getIMTDThresholds (stationId, thresholdParser) {
  const response = await getImtdApiResponse(stationId)
  if (response.data) {
    return thresholdParser(response.data[0].TimeSeriesMetaData, stationId)
  }
  return []
}

async function getData (stationId) {
  try {
    const thresholds = await getIMTDThresholds(stationId, parseThresholds)
    if (thresholds.length > 0) {
      await insertThresholds(stationId, thresholds)
    } else {
      await deleteThresholds(stationId)
    }
  } catch (error) {
    logger.error(`Could not process data for station ${stationId} (${error.message})`)
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
  // NOTE: need to explicity tear down connection pool
  // without this, active connections to DB are persisted until they time out
  pg.destroy()
}

module.exports.handler = handler
