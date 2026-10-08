const { Pool } = require('../helpers/pool')

module.exports.handler = async () => {
  const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
  try {
    await pool.query('updateTelemetryHistory')
  } finally {
    await pool.end()
  }
}
