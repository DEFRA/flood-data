const createClientWithRetry = require('../helpers/retry-db-connection')
const retry = require('async-retry')
const station = require('../models/station')
const rloi = require('../models/rloi')

module.exports.handler = async () => {
  // retry wrapper for client connection
  const client = await createClientWithRetry()
  await rloi.deleteOld(client)
  await station.refreshStationMview(client)
}
