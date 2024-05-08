const logger = require('./logging')
const pg = require('./db')

async function deleteStation (stationId, tableName) {
  try {
    await pg(tableName).where({ station_id: stationId }).delete()
    logger.info(`Deleted data for RLOI id ${stationId}`)
  } catch (error) {
    logger.error(`Error deleting data for station ${stationId}`, error)
    throw error
  }
}

module.exports = { deleteStation }
