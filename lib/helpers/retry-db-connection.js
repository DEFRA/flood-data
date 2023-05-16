const retry = require('async-retry');
const PostGresClient = require('./postgres-client')

async function createClientWithRetry() {
  let client;
  
  await retry(async () => {
    client = new PostGresClient({ connection: process.env.LFW_DATA_DB_CONNECTION });
  }, {
    retries: 2,
    factor: 2,
    minTimeout: 2000,
    onRetry: async (err, attempt) => {
      console.error(`client connect failed (${attempt})`);
      console.error(err);
    }
  });

  return client;
}


module.exports = createClientWithRetry


