const ngrToBng = require('ngr-to-bng')
const regions = require('../models/regions.json')
const rainfallPostfix = require('../models/rainfall-postfix.json')
const util = require('../helpers/util')
const directly = require('directly')

// telemetry parameters to import (Water level is if rloi station exists)
const parameters = ['Rainfall']

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

function processTelemetryValue (rawValue, options) {
  const retVal = {
    processed_value: parseFloat(rawValue),
    error: false
  }
  if (options.parameter !== 'Water Level') {
    return retVal
  }
  // Subtract value if post process required
  if (options.postProcess && options.subtract) {
    retVal.processed_value = parseFloat(util.toFixed(retVal.processed_value - parseFloat(options.subtract), 3))
  }
  if (!util.isNumeric(retVal.processed_value)) {
    retVal.processed_value = null
    retVal.error = true
  }
  return retVal
}

module.exports = {
  async save (value, bucket, key, client, s3) {
    const valuesCount = getValuesCount(value.EATimeSeriesDataExchangeFormat.Station)

    console.log(valuesCount + ' values to process')

    if (valuesCount === 0) {
      return
    }

    for (const item of value.EATimeSeriesDataExchangeFormat.Station) {
      if (!item.SetofValues) {
        continue
      }
      // Update region to match station region as telemetry file region slightly differs,
      // so keep consistent with station data
      item.$.telemetryRegion = item.$.region
      item.$.region = regions[item.$.region] ? regions[item.$.region] : item.$.region

      await directly(3, item.SetofValues.map(setOfValues => async () => {
        const {
          parameter = '',
          qualifier = '',
          dataType = '',
          period = '',
          units = '',
          startDate,
          endDate,
          startTime,
          endTime
        } = setOfValues.$
        const station = await getStation({
          bucket,
          client,
          s3,
          item,
          parameter
        })

        if (!station) {
          return
        }

        // Store parent details in sls_telemetry_value_parent
        const parent = [
          key,
          new Date(),
          parseInt(station.RLOI_ID),
          item.$.stationReference,
          station.Region,
          new Date(`${startDate}T${startTime}Z`),
          new Date(`${endDate}T${endTime}Z`),
          parameter,
          qualifier,
          units,
          /^(y|yes)$/i.test(station.Post_Process),
          parseFloat(station.Subtract),
          parseFloat(station.POR_Max_Value),
          station.Station_Type,
          parseFloat(station.percentile_5),
          dataType,
          period
        ]

        const res = await client.query('slsTelemetryValueParent', parent)
        const values = setOfValues.Value.map(({ _: value, $: { date, time } }) => ({
          telemetry_value_parent_id: res.rows[0].telemetry_value_parent_id,
          value: parseFloat(value),
          value_timestamp: (new Date(`${date}T${time}Z`)).toJSON(),
          ...processTelemetryValue(value, {
            parameter: parameter,
            postProcess: /^(y|yes)$/i.test(station.Post_Process),
            subtract: station.Subtract
          })
        }))
        await client.query('slsTelemetryValues', values)
      }))
      console.log('all values processed')
    }
  },
  async deleteOld (client) {
    await client.query('deleteOldTelemetry')
  }
}

async function getStation ({ bucket, client, s3, item, parameter }) {
  let station
  try {
    station = await s3.getObject({
      Bucket: bucket,
      Key: `rloi/${item.$.region}/${item.$.stationReference}/station.json`
    })
    station = JSON.parse(station.Body)
  } catch (err) {
    // There are a significant number of telemetry objects that we don't have a matching station for,
    // and also hence the need to swallow the error here.
  }
  if (!parameters.includes(parameter) && !(station && parameter === 'Water Level')) {
    return
  }
  // if not rloi then Upsert station details to u_flood.sls_telemetry_station, with defaults for rloi specific values
  if (!station) {
    station = {
      RLOI_ID: -1,
      Region: item.$.region,
      Post_Process: 'n',
      Station_Type: 'R'
    }
    const { stationReference, region, stationName, ngr } = item.$
    // Convert ngr (national grid reference eg SK078993) to bng (British national grid eg 407800 399300)
    const point = ngr && ngrToBng(ngr)
    const telemetryStation = [
      stationReference,
      region,
      removePostfix(stationName),
      ngr,
      point && point.easting,
      point && point.northing
    ]
    await client.query('slsTelemetryStation', telemetryStation)
  }
  return station
}
