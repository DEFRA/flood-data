const sql = require('sql')
sql.setDialect('postgres')
const regions = require('../models/regions.json')
const queries = require('../queries')
const slsTelemetryValue = require('../models/sls-telemetry-value.json')

function getValuesCount (stations) {
  return stations.reduce((count, station) => count + (station.SetofValues || []).length, 0)
}

class Rloi {
  constructor (db, s3, util) {
    this.db = db
    this.s3 = s3
    this.util = util
  }

  async getStation (region, stationReference, bucket) {
    try {
      const station = await this.s3.getObject({ Bucket: bucket, Key: `rloi/${region}/${stationReference}/station.json` })
      return JSON.parse(station.Body)
    } catch (err) {
    }
  }

  save (value, bucket, key) {
    let processed = 0

    const valuesCount = getValuesCount(value.EATimeSeriesDataExchangeFormat.Station)

    console.log(valuesCount + ' values to process')

    if (valuesCount === 0) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      value.EATimeSeriesDataExchangeFormat.Station.filter((item) => item.SetofValues).forEach(async (item) => {
        // Update region to match station region as telemetry file region slightly differs,
        // so keep consistent with station data
        const region = regions[item.$.region] ? regions[item.$.region] : item.$.region
        const station = await this.getStation(region, item.$.stationReference, bucket)

        item.SetofValues.forEach(async (setOfValues) => {
          try {
            // only process the values if we have a station
            if (station) {
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
                (station.Post_Process.toLowerCase() === 'y' || station.Post_Process.toLowerCase() === 'yes'),
                parseFloat(station.Subtract),
                parseFloat(station.POR_Max_Value),
                station.Station_Type,
                parseFloat(station.percentile_5)
              ]

              const res = await this.db.query(parentQuery, parent)
              console.log(`Loaded parent: ${station.RLOI_ID} | ${setOfValues.$.parameter} | ${setOfValues.$.qualifier}`)

              const calculateProcessedValue = () => {
                return (setOfValues.$.parameter === 'Water Level' && ['y', 'yes'].includes(station.Post_Process.toLowerCase()) && station.Subtract)
              }

              const valueMapper = (v) => {
                const value = parseFloat(v._)
                const processedResult = getProcessedResult(this.util, value)
                return {
                  telemetry_value_parent_id: res.rows[0].telemetry_value_parent_id,
                  value,
                  processed_value: processedResult.processedValue,
                  value_timestamp: (new Date(`${v.$.date}T${v.$.time}Z`)).toJSON(),
                  error: processedResult.error
                }
              }

              const getProcessedResult = (util, value) => {
                let processedValue = value
                if (calculateProcessedValue()) {
                  processedValue = parseFloat(util.toFixed(value - parseFloat(station.Subtract), 3))
                }
                if (!util.isNumeric(processedValue)) {
                  return {
                    processedValue: null,
                    error: true
                  }
                } else {
                  return {
                    processedValue,
                    error: false
                  }
                }
              }

              const values = setOfValues.Value.map(valueMapper)

              const valuesTable = sql.define({
                name: 'sls_telemetry_value',
                columns: slsTelemetryValue
              })

              await this.db.query(valuesTable.insert(values).toQuery())
              console.log(`Loaded station values: ${station.RLOI_ID} | ${setOfValues.$.parameter} | ${setOfValues.$.qualifier}`)
            }
            processed++
            if (processed === valuesCount) {
              console.log('all values processed')
              resolve()
            }
          } catch (err) {
            return reject(err)
          }
        })
      })
    })
  }

  async deleteOld () {
    await this.db.query(queries.deleteOldTelemetry)
  }
}

module.exports = Rloi
