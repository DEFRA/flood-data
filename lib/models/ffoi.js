const queries = require('../queries')

module.exports = {
  save (file, bucket, key, s3, client) {
    const promises = file.EATimeSeriesDataExchangeFormat.Station
      .filter(item => item.SetofValues[0].$.parameter === 'Water Level')
      .map(item => {
        // set the originating filename and the forecast created date
        item.$.key = key
        item.$.date = file.EATimeSeriesDataExchangeFormat['md:Date'][0]
        item.$.time = file.EATimeSeriesDataExchangeFormat['md:Time'][0]
        const params = {
          Body: JSON.stringify(item),
          Bucket: bucket,
          Key: `ffoi/${item.$.stationReference}.json`
        }

        // filter out past data and anything further than 36 hours in future
        const futureValues = item.SetofValues[0].Value.filter(val => {
          const valueDate = new Date(val.$.date + 'T' + val.$.time + 'Z')
          const datePlus36 = new Date((new Date()).setHours((new Date()).getHours() + 36))
          return (valueDate > new Date() && valueDate < datePlus36)
        })

        if (futureValues === undefined || futureValues.length === 0) {
          return null
        }

        // get max value
        const max = futureValues.reduce((a, b) => {
          return (a._ > b._) ? a : b
        })

        return [
          s3.putObject(params).then(() => {
            // if (process.env.stage !== 'ea') {
            //   console.log('Uploaded ' + params.Key)
            // }
          }).catch((err) => {
            console.log('Failed to upload: ' + params.Key)
            console.error(err)
          }),
          client.query(queries.upsertFfoiMax, [item.$.stationReference, max._, max.$.date + 'T' + max.$.time + 'Z', key, new Date()]).then(() => {
            // if (process.env.stage !== 'ea') {
            //   console.log('FFOI max ' + params.Key + ' added to db')
            // }
          }).catch(err => {
            console.error(err)
          })
        ]
      })

    // TODO: technical debt, map above should return an array that we can put straight into Promise.all, this is a fudge due to bug found.
    const promisesClean = []
    promises.forEach(promiseArr => {
      if (promiseArr) {
        promiseArr.forEach(promise => {
          promisesClean.push(promise)
        })
      }
    })

    return Promise.all(promisesClean).then(() => console.log(`File ${key} processed`))
  }
}
