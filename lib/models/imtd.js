const sql = require('sql')
const imtdColumns = require('./imtd.json')
const queries = require('../queries')

module.exports = {
  async save (stationBuffer, pool) {
    const imtd = stationBuffer.map(station => {
      return {
        stations_threshold_id: station,
        station_id: station,
        fwis_code: station,
        direction: station,
        value: station
      }
    })

    const imtdTable = sql.define({
      name: 'station_imtd_threshold',
      columns: imtdColumns
    })

    await pool.query(queries.deleteCurrentImtd)
    await pool.query(imtdTable.insert(imtd).toQuery())
    // await client.query(queries.updateTimestamp, [timestamp])
  }
}
