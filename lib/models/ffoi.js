const queries = require('../queries')

module.exports = {
  async save (file, bucket, key, s3, client) {
    const currentDate = new Date()
    const datePlus36 = new Date(currentDate.setHours(currentDate.getHours() + 36))

    const promisesClean = file.EATimeSeriesDataExchangeFormat.Station
      .filter(item => item.SetofValues[0].$.parameter === 'Water Level')
      .flatMap(item => {
        item.$.key = key
        item.$.date = file.EATimeSeriesDataExchangeFormat['md:Date'][0]
        item.$.time = file.EATimeSeriesDataExchangeFormat['md:Time'][0]

        const params = {
          Body: JSON.stringify(item),
          Bucket: bucket,
          Key: `ffoi/${item.$.stationReference}.json`
        }

        const futureValues = item.SetofValues[0].Value.filter(val => {
          const valueDate = new Date(val.$.date + 'T' + val.$.time + 'Z')
          return (valueDate > currentDate && valueDate < datePlus36)
        })

        if (futureValues === undefined || futureValues.length === 0) {
          return []
        }

        let max = futureValues[0]
        for (let i = 1; i < futureValues.length; i++) {
          if (futureValues[i]._ > max._) {
            max = futureValues[i]
          }
        }

        return [
          s3.upload(params).catch(error => console.error('Failed to upload', error)),
          client.query(queries.upsertFfoiMax, [item.$.stationReference, max._, max.$.date + 'T' + max.$.time + 'Z', key, currentDate]).catch(error => console.error('Failed to add to db', error))
        ]
      })
    const result = []
    for (const promise of promisesClean) {
      try {
        const response = await promise
        result.push(response)
      } catch (error) {
        console.error('Failed to process promise', error)
      }
    }

    console.log(`File ${key} processed`)
    return result
  }
}
