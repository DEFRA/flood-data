const knex = require('./db')
const VError = require('verror')

function mergeValuesIntoObject (columns, values) {
  return columns.reduce((obj, column, index) => {
    obj[column] = values[index]
    return obj
  }, {})
}

const constructedQueries = {
  slsTelemetryValues: async values => knex('sls_telemetry_value').insert(values),
  slsTelemetryValueParent: async values => {
    // This column list reflects the columns and their order in the slsTelemetryValueParent query
    // in the lib/queries.json file
    const columns = [
      'filename',
      'imported',
      'rloi_id',
      'station',
      'region',
      'start_timestamp',
      'end_timestamp',
      'parameter',
      'qualifier',
      'units',
      'post_process',
      'subtract',
      'por_max_value',
      'station_type',
      'percentile_5',
      'data_type',
      'period'
    ]
    const value = mergeValuesIntoObject(columns, values)
    return knex('sls_telemetry_value_parent').insert(value).returning('*')
  },
  slsTelemetryStation: async values => {
    const columns = [
      'station_reference',
      'region',
      'station_name',
      'ngr',
      'error',
      'easting',
      'northing'
    ]
    const value = mergeValuesIntoObject(columns, values)
    return knex('u_flood.sls_telemetry_station')
      .insert(value)
      .onConflict('unique_station')
      .merge([
        'station_name',
        'ngr',
        'easting',
        'northing'
      ])
      .update({
        station_name: knex.raw('EXCLUDED.station_name'),
        ngr: knex.raw('EXCLUDED.ngr'),
        easting: knex.raw('EXCLUDED.easting'),
        northing: knex.raw('EXCLUDED.northing')
      })
  }
}

class Pool {
  async query (queryName, values) {
    try {
      const rows = await constructedQueries[queryName](values)
      // returning an object rather than just the rows to match the response from pg and ensure that the pool
      // api remains (mostly) unchanged
      return (rows) ? { rows } : { rows: [] }
    } catch (error) {
      throw new VError(error, 'Error querying DB (query: %s, values: %s)', queryName, JSON.stringify(values))
    }
  }

  async end () {
    try {
      await knex.destroy()
    } catch (error) {
      throw new VError(error, 'Error ending pool')
    }
  }
}

module.exports = {
  Pool
}
