const { Pool } = require('../helpers/pool')
const fwis = require('../models/fwis')
const wreck = require('../helpers/wreck')
const fs = require('fs')
const path = require('path')

module.exports.handler = async (event) => {
  let warnings

  if (process.env.IS_LOCALSTACK === 'true') {
    const file = path.join(__dirname, '../../test/data/fwis.json')
    warnings = JSON.parse(fs.readFileSync(file))
  } else {
    const response = await wreck.request('get', process.env.LFW_DATA_FWIS_API_URL, {
      json: true,
      headers: { 'x-api-key': process.env.LFW_DATA_FWIS_API_KEY },
      timeout: 30000
    }, true)
    warnings = response.warnings
  }

  const timestamp = Math.round(Date.now() / 1000)
  const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
  await fwis.save(warnings, timestamp, pool)
  await pool.end()
}
