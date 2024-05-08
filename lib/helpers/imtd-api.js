const logger = require('./logging')
const pg = require('./db')

async function deleteStation (stationId) {
  try {
    await pg('station_display_time_series').where({ station_id: stationId }).delete()
    logger.info(`Deleted data for RLOI id ${stationId}`)
  } catch (error) {
    logger.error(`Error deleting data for station ${stationId}`, error)
    throw error
  }
}

module.exports = { deleteStation }
