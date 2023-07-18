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
    const mappedThresholds = thresholds.map(t => {
      return {
        station_id: stationId,
        fwis_code: t.floodWarningArea,
        fwis_type: t.floodWarningType,
        direction: t.direction,
        value: t.level
      }
    })
    await pg.transaction(async trx => {
      await trx('station_imtd_threshold').where({ station_id: stationId }).delete()
      await trx('station_imtd_threshold').insert(mappedThresholds)
      logger.info(`Processed ${mappedThresholds.length} thresholds for RLOI id ${stationId}`)
    })
  } catch (error) {
    logger.error(`Database error processing thresholds for station ${stationId}`, error)
    throw error
  }
}

async function getImtdApiResponse (stationId) {
  const hostname = 'imfs-prd1-thresholds-api.azurewebsites.net'
  try {
    return await axios.get(`https://${hostname}/Location/${stationId}?version=2`)
  } catch (error) {
    if (error.response?.status === 404) {
      logger.info(`Station ${stationId} not found (HTTP Status: 404)`)
    } else {
      const message = error.response?.status ? `HTTP Status: ${error.response.status}` : `Error: ${error.message}`
      throw Error(`IMTD API request for station ${stationId} failed (${message})`)
    }
    return {}
  }
}

async function getIMTDThresholds (stationId) {
  const response = await getImtdApiResponse(stationId)
  if (response.data) {
    return parseThresholds(response.data[0].TimeSeriesMetaData)
  }
  return []
}

async function getData (stationId) {
  try {
    const thresholds = await getIMTDThresholds(stationId)
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
  const hostname = 'imfs-prd1-thresholds-api.azurewebsites.net'
  try {
    const response = await axios.get(`https://${hostname}/Locations?version=2`)
    return response.data
      .filter(s => !s.RLOIid.endsWith('z'))
      .map(s => { return { rloi_id: s.RLOIid } })
  } catch (error) {
    const message = error.response?.status ? `HTTP Status: ${error.response.status}` : `Error: ${error.message}`
    throw Error(`IMTD API request for stations list failed (${message})`)
  }
}

async function handler (_event) {
  // BATCH_SIZE is a nominal figure and the intent of the use of batching is to
  // allow parallel requests to the IMTD API without overwhelming the service
  // In theory, increasing batch size should decrease overall processing time
  // but in practice it makes no discernible difference possibly because the API
  // queues requests and processes them one at a time.
  const BATCH_SIZE = 16

  const stations = await getRloiIds()

  const remainingStations = [...stations]

  while (remainingStations.length > 0) {
    const processStations = remainingStations.splice(0, BATCH_SIZE)
    const promises = processStations.map(s => getData(s.rloi_id))
    await Promise.all(promises)
  }
  // NOTE: need to explicity tear down connection pool
  // without this, active connections to DB are persisted until they time out
  pg.destroy()
}

module.exports.handler = handler
