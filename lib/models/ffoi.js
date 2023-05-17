const queries = require('../queries')

module.exports = {
  async save(file, bucket, key, s3, client) {
    let result = []

    const promisesClean = file.EATimeSeriesDataExchangeFormat.Station
      .filter(item => item.SetofValues[0].$.parameter === 'Water Level')
      .flatMap(item => {
        // set the originating filename and the forecast created date
        item.$.key = key;
        item.$.date = file.EATimeSeriesDataExchangeFormat['md:Date'][0];
        item.$.time = file.EATimeSeriesDataExchangeFormat['md:Time'][0];

        const params = {
          Body: JSON.stringify(item),
          Bucket: bucket,
          Key: `ffoi/${item.$.stationReference}.json`,
        };

        // filter out past data and anything further than 36 hours in future
        const futureValues = item.SetofValues[0].Value.filter(val => {
          const valueDate = new Date(val.$.date + 'T' + val.$.time + 'Z');
          const datePlus36 = new Date((new Date()).setHours((new Date()).getHours() + 36));
          return (valueDate > new Date() && valueDate < datePlus36);
        });

        console.log('----futureValues----');
        console.log(params);
        console.log('====futureValues====');

        if (futureValues === undefined || futureValues.length === 0) {
          return [];
        }

        // get max value
        const max = futureValues.reduce((a, b) => {
          return (a._ > b._) ? a : b;
        });

        return [
          s3.putObject(params),
          client.query(queries.upsertFfoiMax, [item.$.stationReference, max._, max.$.date + 'T' + max.$.time + 'Z', key, new Date()])
        ];
      });

    try {
      result = await Promise.all(promisesClean);
      console.log(`File ${key} processed`);
    } catch (error) {
      console.error('Failed to upload or add to db', error);
    }
    return result
  }
}
