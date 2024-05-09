const pg = require('./db')

async function deleteStation (stationId, tableName) {
  await pg(tableName).where({ station_id: stationId }).delete()
}

async function getRloiIds ({ limit, offset } = {}) {
  try {
    const result = await pg('rivers_mview')
      .distinct('rloi_id')
      .whereNotNull('rloi_id')
      .orderBy('rloi_id', 'asc')
      .limit(limit)
      .offset(offset)
    return result
  } catch (error) {
    throw Error(`Could not get list of id's from database (Error: ${error.message})`)
  }
}

module.exports = { deleteStation, getRloiIds }
