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

  calculateProcessedValue (parameter, postProcess, subtract) {
    return (parameter === 'Water Level' && ['y', 'yes'].includes(postProcess.toLowerCase()) && subtract)
  }

  getProcessedResult (util, value, station, parameter) {
    let processedValue = value
    if (this.calculateProcessedValue(parameter, station.Post_Process, station.Subtract)) {
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

  getValueMapper (parentId, parameter, station) {
    return (v) => {
      const value = parseFloat(v._)
      const processedResult = this.getProcessedResult(this.util, value, station, parameter)
      return {
        telemetry_value_parent_id: parentId,
        value,
        processed_value: processedResult.processedValue,
        value_timestamp: (new Date(`${v.$.date}T${v.$.time}Z`)).toJSON(),
        error: processedResult.error
      }
    }
  }

  getTelemetryValues (res, setOfValues, station) {
    return setOfValues.Value.map(this.getValueMapper(res, setOfValues.$.parameter, station))
  }

  getParentValues (key, station, item, setOfValues) {
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
      parseFloat(station.percentile_5)
    ]
  }

  async saveParentDetails (key, station, item, setOfValues) {
    const parentQuery = queries.slsTelemetryValueParent
    const parent = this.getParentValues(key, station, item, setOfValues)
    const res = await this.db.query(parentQuery, parent)
    console.log(`Loaded parent: ${station.RLOI_ID} | ${setOfValues.$.parameter} | ${setOfValues.$.qualifier}`)
    return res.rows[0].telemetry_value_parent_id
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
        const region = regions[item.$.region] ? regions[item.$.region] : item.$.region
        const station = await this.getStation(region, item.$.stationReference, bucket)

        if (!station) {
          resolve()
        }

        item.SetofValues.forEach(async (setOfValues) => {
          try {
            const parentId = await this.saveParentDetails(key, station, item, setOfValues)

            const values = this.getTelemetryValues(parentId, setOfValues, station)

            const valuesTable = sql.define({
              name: 'sls_telemetry_value',
              columns: slsTelemetryValue
            })

            await this.db.query(valuesTable.insert(values).toQuery())
            console.log(`Loaded station values: ${station.RLOI_ID} | ${setOfValues.$.parameter} | ${setOfValues.$.qualifier}`)
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
