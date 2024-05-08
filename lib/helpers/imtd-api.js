const pg = require('./db')

async function deleteStation (stationId, tableName) {
  await pg(tableName).where({ station_id: stationId }).delete()
}

module.exports = { deleteStation }
