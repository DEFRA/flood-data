const sql = require('sql')
sql.setDialect('postgres')
const ngrToBng = require('ngr-to-bng')
const regions = require('../models/regions.json')
const rainfallPostfix = require('../models/rainfall-postfix.json')
const queries = require('../queries')
const slsTelemetryValue = require('../models/sls-telemetry-value.json')
const util = require('../helpers/util')
const { logger } = require('../helpers/logger')

// telemetry parameters to import (Water level is if rloi station exists)
const parameters = ['Rainfall']

function objectIsEmpty (obj) {
  return Object.keys(obj || {}).length === 0
}

function getValuesCount (stations) {
  return stations?.reduce((count, station) => count + (station.SetofValues || []).length, 0) || 0
}

function removePostfix (name) {
  name = name.trimEnd()
  const postfix = rainfallPostfix.find(e => name.endsWith(` ${e}`))
  if (postfix) {
    return name.replace(` ${postfix}`, '')
  } else {
    return name
  }
}

async function storeSlsTelemetryStation (item, client) {
  // Convert ngr (national grid reference eg SK078993) to bng (British national grid eg 407800 399300)
  const point = item.$.ngr && ngrToBng(item.$.ngr)

  const telemetryStation = [
    item.$.stationReference,
    item.$.region,
    removePostfix(item.$.stationName),
    item.$.ngr,
    point && point.easting,
    point && point.northing
  ]

  return client.query(queries.slsTelemetryStation, telemetryStation)
}

function saveSlsTelemetryValueParent ({ item, station, setOfValues, key, client }) {
  // Store parent details in sls_telemetry_value_parent
  const parentQuery = queries.slsTelemetryValueParent

  const parent = [
    key,
    new Date(),
    parseInt(station.RLOI_ID),
    item.$.stationReference,
    station.Region,
    new Date(`${setOfValues.$.startDate}T${setOfValues.$.startTime}Z`),
    new Date(`${setOfValues.$.endDate}T${setOfValues.$.endTime}Z`),
    setOfValues.$.parameter ? setOfValues.$.parameter : '',
    setOfValues.$.qualifier ? setOfValues.$.qualifier : '',
    setOfValues.$.units ? setOfValues.$.units : '',
    (station.Post_Process?.toLowerCase() === 'y' || station.Post_Process?.toLowerCase() === 'yes'),
    parseFloat(station.Subtract) || 12,
    parseFloat(station.POR_Max_Value) || 12,
    station.Station_Type,
    parseFloat(station.percentile_5),
    setOfValues.$.dataType ? setOfValues.$.dataType : '',
    setOfValues.$.period ? setOfValues.$.period : ''
  ]

  return client.query(parentQuery, parent)
}

function processTelemetryValues ({ setOfValues, station, res }) {
  const values = []
  const isWaterLevel = setOfValues.$.parameter === 'Water Level'
  const isPostProcess = station.Post_Process?.toLowerCase() === 'y' || station.Post_Process?.toLowerCase() === 'yes'
  const parentId = res?.rows[0]?.telemetry_value_parent_id

  console.log(`Loaded parent: ${station.RLOI_ID} | ${setOfValues.$.parameter} | ${setOfValues.$.qualifier}`)

  for (let i = 0; i < setOfValues.Value.length; i++) {
    const value = parseFloat(setOfValues.Value[i]._)
    const processedValue = value

    values[i] = {
      telemetry_value_parent_id: parentId,
      value: value,
      processed_value: processedValue,
      value_timestamp: (new Date(`${setOfValues.Value[i].$.date}T${setOfValues.Value[i].$.time}Z`)).toJSON(),
      error: false
    }

    if (isWaterLevel) {
      if (isPostProcess) {
        values[i].processed_value = station.Subtract ? parseFloat(util.toFixed(value - parseFloat(station.Subtract), 3)) : value
      }

      if (!util.isNumeric(values[i].processed_value)) {
        values[i].processed_value = null
        values[i].error = true
      }
    }
  }

  return values
}

async function getStationFromS3 ({ s3, bucket, item }) {
  let station

  try {
    station = await s3.getObject({ Bucket: bucket, Key: `rloi/${item.$.region}/${item.$.stationReference}/station.json` })
    station = JSON.parse(station.Body)
  } catch (err) {
    logger.warn('----{ warn }----', err)
  }

  return station
}

async function processSetOfValues (setOfValues, item, station, key, client) {
  let values = 0
  if (parameters.indexOf(setOfValues.$.parameter) > -1 || (station && setOfValues.$.parameter === 'Water Level')) {
    const stationIsEmpty = objectIsEmpty(station)
    if (stationIsEmpty) {
      station = {
        RLOI_ID: -1,
        Region: item.$.region,
        Post_Process: 'n',
        Station_Type: 'R'
      }
      await storeSlsTelemetryStation(item, client)
    }
    const res = await saveSlsTelemetryValueParent({
      item,
      station,
      setOfValues,
      key,
      client
    })
    values = processTelemetryValues({ setOfValues, station, res })
    const valuesTable = sql.define({
      name: 'sls_telemetry_value',
      columns: slsTelemetryValue
    })
    await client.query(valuesTable.insert(values).toQuery())
  }
  return values
}

async function processStation (item, bucket, key, client, s3) {
  let values = 0
  if (item.SetofValues) {
    item.$.telemetryRegion = item.$.region
    item.$.region = regions[item.$.region] ? regions[item.$.region] : item.$.region
    for (const setOfValues of item.SetofValues) {
      const station = await getStationFromS3({ s3, bucket, item })
      values += await processSetOfValues(setOfValues, item, station, key, client)
    }
  }
  return values
}

module.exports = {
  async save (value, bucket, key, client, s3) {
    const valuesCount = getValuesCount(value.EATimeSeriesDataExchangeFormat?.Station)
    console.log(valuesCount + ' values to process')
    if (!valuesCount) {
      return Promise.resolve(0)
    }
    const promises = value.EATimeSeriesDataExchangeFormat.Station.map(item => processStation(item, bucket, key, client, s3))
    const values = await Promise.all(promises)

    return values.reduce((a, b) => a + b, 0)
  },
  async deleteOld (client) {
    return client.query(queries.deleteOldTelemetry)
  }
}
