const ngrToBng = require('ngr-to-bng')
const regions = require('../models/regions.json')
const rainfallPostfix = require('../models/rainfall-postfix.json')
const util = require('../helpers/util')
const directly = require('directly')

// telemetry parameters to import (Water level is if rloi station exists)
const parameters = new Set(['Rainfall'])

const processedValueDecimalPlace = 3

function getValuesCount (stations) {
  return stations.reduce((count, station) => count + (station.SetofValues || []).length, 0)
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

async function fetchStation (s3, bucket, key) {
  return s3.getObject({
    Bucket: bucket,
    Key: key
  })
}

function setSlsTelemetryStation (item) {
  // Convert ngr (national grid reference eg SK078993) to bng (British national grid eg 407800 399300)
  const point = item.$.ngr && ngrToBng(item.$.ngr)

  return [
    item.$.stationReference,
    item.$.region,
    removePostfix(item.$.stationName),
    item.$.ngr,
    point?.easting,
    point?.northing
  ]
}

function setSlsTelemetryValueItem (index, res, station, setOfValues) {
  const value = {
    telemetry_value_parent_id: res.rows[0].telemetry_value_parent_id,
    value: parseFloat(setOfValues.Value[index]._),
    processed_value: parseFloat(setOfValues.Value[index]._),
    value_timestamp: (new Date(`${setOfValues.Value[index].$.date}T${setOfValues.Value[index].$.time}Z`)).toJSON(),
    error: false
  }

  // Process values if they're Water Level
  if (setOfValues.$.parameter === 'Water Level') {
    // Subtract value if post process required
    if (station.Post_Process.toLowerCase() === 'y' || station.Post_Process.toLowerCase() === 'yes') {
      value.processed_value = station.Subtract ? parseFloat(util.toFixed(value.value - parseFloat(station.Subtract), processedValueDecimalPlace)) : value.value
    }
    if (!util.isNumeric(value.processed_value)) {
      value.processed_value = null
      value.error = true
    }
  }

  return value
}

function setSlsTelemetryParent (key, station, item, setOfValues) {
  return [
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
    (station.Post_Process.toLowerCase() === 'y' || station.Post_Process.toLowerCase() === 'yes'),
    parseFloat(station.Subtract),
    parseFloat(station.POR_Max_Value),
    station.Station_Type,
    parseFloat(station.percentile_5),
    setOfValues.$.dataType ? setOfValues.$.dataType : '',
    setOfValues.$.period ? setOfValues.$.period : ''
  ]
}

function normaliseStationRegion (item) {
  // Keep region consistent with station data due to known telemetry source differences.
  item.$.telemetryRegion = item.$.region
  item.$.region = regions[item.$.region] ? regions[item.$.region] : item.$.region
}

async function getStationOrNull (s3, bucket, item) {
  try {
    const result = await fetchStation(s3, bucket, `rloi/${item.$.region}/${item.$.stationReference}/station.json`)
    const bodyContents = await result.Body.transformToString()
    return JSON.parse(bodyContents)
  } catch (err) {
    // Intentionally quiet: missing station files are expected for many telemetry objects.
    return null
  }
}

function shouldProcessValues (setOfValues, station) {
  return parameters.has(setOfValues.$.parameter) || (station && setOfValues.$.parameter === 'Water Level')
}

async function ensureStation (client, item, station) {
  if (station) {
    return station
  }

  const defaultStation = {
    RLOI_ID: -1,
    Region: item.$.region,
    Post_Process: 'n',
    Station_Type: 'R'
  }

  const telemetryStation = setSlsTelemetryStation(item)
  await client.query('slsTelemetryStation', telemetryStation)

  return defaultStation
}

function logDuplicateParentSkipped (station, setOfValues) {
  console.log(`Duplicate telemetry parent skipped: station=${station.RLOI_ID} parameter=${setOfValues.$.parameter} qualifier=${setOfValues.$.qualifier || ''} start=${setOfValues.$.startDate}T${setOfValues.$.startTime} end=${setOfValues.$.endDate}T${setOfValues.$.endTime}`)
}

function setSlsTelemetryValues (res, station, setOfValues) {
  return setOfValues.Value.map((_, index) => setSlsTelemetryValueItem(index, res, station, setOfValues))
}

async function processSetOfValues ({ client, s3, bucket, key, item, setOfValues }) {
  let station = await getStationOrNull(s3, bucket, item)

  if (!shouldProcessValues(setOfValues, station)) {
    return
  }

  station = await ensureStation(client, item, station)

  const parent = setSlsTelemetryParent(key, station, item, setOfValues)
  const res = await client.query('slsTelemetryValueParent', parent)

  if (!res.rows?.[0]) {
    logDuplicateParentSkipped(station, setOfValues)
    return
  }

  const values = setSlsTelemetryValues(res, station, setOfValues)
  await client.query('slsTelemetryValues', values)
}

module.exports = {
  async save (value, bucket, key, client, s3) {
    let processed = 0
    const concurrence = 3

    const valuesCount = getValuesCount(value.EATimeSeriesDataExchangeFormat.Station)

    console.log(valuesCount + ' values to process')

    if (valuesCount === 0) {
      return
    }

    for (const item of value.EATimeSeriesDataExchangeFormat.Station) {
      if (!item.SetofValues) {
        continue
      }

      normaliseStationRegion(item)

      await directly(concurrence, item.SetofValues.map(setOfValues => async () => {
        await processSetOfValues({ client, s3, bucket, key, item, setOfValues })
        processed++
      }))

      if (processed === valuesCount) {
        console.log('all values processed')
      }
    }
  },
  async deleteOld (client) {
    await client.query('deleteOldTelemetry')
  }
}
