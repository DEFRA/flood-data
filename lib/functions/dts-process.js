const parseStation = require('../models/parse-time-series')
const logger = require('../helpers/logging')
const pg = require('../helpers/db')
const invokeLambda = require('../helpers/invoke-lambda')
const Joi = require('joi')
const axios = require('axios')
const { HTTP_NOT_FOUND } = require('../constants')
const deleteStation = require('../helpers/imtd-api').deleteStation

async function insertStation (stationDataArray) {
  try {
    await pg.transaction(async trx => {
      await Promise.all(stationDataArray.map(async (stationData) => {
        const stationID = stationData.station_id
        await trx('station_display_time_series').where({ station_id: stationID }).delete()
        await trx('station_display_time_series').insert(stationData)
        logger.info(`Processed displayTimeSeries for RLOI id ${stationID}`)
      }))
    })
  } catch (error) {
    logger.error('Database error processing stationData', error)
    throw error
  }
}

async function getImtdApiResponse (stationId) {
  const hostname = 'imfs-prd1-thresholds-api.azurewebsites.net'
  try {
    return await axios.get(`https://${hostname}/Location/${stationId}?version=2`)
  } catch (error) {
    if (error.response?.status === HTTP_NOT_FOUND) {
      logger.info(`Station ${stationId} not found (HTTP Status: 404)`)
    } else {
      const message = error.response?.status ? `HTTP Status: ${error.response.status}` : `Error: ${error.message}`
      throw Error(`IMTD API request for station ${stationId} failed (${message})`)
    }
    return {}
  }
}

async function getStationData (stationId) {
  const response = await getImtdApiResponse(stationId)
  if (response.data) {
    return parseStation(response.data[0].TimeSeriesMetaData, stationId)
  }
  return []
}

async function getData (stationId) {
  try {
    const stationData = await getStationData(stationId)
    if (stationData.length === 0) {
      (console.log('Deleting station: ', stationId))
      await deleteStation(stationId)
    }
    await validateStationData(stationData)
    await insertStation(stationData)
  } catch (error) {
    logger.error(`Could not process data for station ${stationId} (${error.message})`)
  }
}

async function validateStationData (stationDataArray) {
  const schema = Joi.object({
    station_id: Joi.number().required(),
    direction: Joi.string().required(),
    display_time_series: Joi.boolean().required()
  })

  try {
    const validatedData = await Promise.all(
      stationDataArray.map((stationData) => schema.validateAsync(stationData))
    )
    return validatedData
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`)
  }
}

async function getRloiIds ({ limit, offset } = {}) {
  try {
    logger.info(`Retrieving up to ${limit} rloi_ids with an offset of ${offset}`)
    const result = await pg('rivers_mview')
      .distinct('rloi_id')
      .whereNotNull('rloi_id')
      .orderBy('rloi_id', 'asc')
      .limit(limit)
      .offset(offset)
    logger.info(`Retrieved ${result.length} rloi_ids`)
    return result
  } catch (error) {
    throw Error(`Could not get list of id's from database (Error: ${error.message})`)
  }
}

async function handler ({ offset = 0 } = {}) {
  const BATCH_SIZE = parseInt(process.env.IMTD_BATCH_SIZE || '500')

  const stations = await getRloiIds({
    offset,
    limit: BATCH_SIZE
  })

  for (const station of stations) {
    await getData(station.rloi_id)
  }

  if (stations.length >= BATCH_SIZE) {
    const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME
    const newOffset = offset + BATCH_SIZE
    logger.info(`Invoking ${functionName} with an offset of ${newOffset}`)

    await invokeLambda(functionName, {
      offset: newOffset
    })
  }
}

module.exports = {
  handler,
  validateStationData
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, destroying DB connection')
  await pg.destroy()
  process.exit(0)
})
