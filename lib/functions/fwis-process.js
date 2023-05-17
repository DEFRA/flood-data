const createPGClientWithRetry = require('../helpers/retry-db-connection')
const fwis = require('../models/fwis')
const wreck = require('../helpers/wreck')

module.exports.handler = async (_event) => {
  // Get Warnings from the FWIS api
  const { warnings } = await wreck.request('get', process.env.LFW_DATA_FWIS_API_URL, {
    json: true,
    headers: {
      'x-api-key': process.env.LFW_DATA_FWIS_API_KEY
    },
    timeout: 30000
  }, true)

  // Get the current seconds since epoch
  const timestamp = Math.round((new Date()).getTime() / 1000)

  // retry wrapper for client connection
  const client = await createPGClientWithRetry()
  await fwis.save(warnings, timestamp, client)
}
