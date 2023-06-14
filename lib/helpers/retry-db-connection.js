const { retryFunction } = require('./retry')
const PostgresClient = require('./postgres-client')

/**
 * Attempts to create a new PostgresClient and connect to the database,
 * retrying the connection up to 2 times if the initial connection fails.
 *
 * The retry strategy uses a factor of 2 and a minimum timeout of 2000ms.
 *
 * If a retry is necessary, an error message will be logged to the console
 * with the error and the attempt number.
 *
 * @returns {Promise<PostgresClient>} A Promise that resolves to the connected PostgresClient.
 * @throws {Error} If the client cannot connect after 2 attempts, the function will throw an error.
 */
async function createPGClientWithRetry (retries = 2) {
  /** @type {PostgresClient} */
  let client

  await retryFunction(async () => {
    client = new PostgresClient({ connection: process.env.LFW_DATA_DB_CONNECTION })
  }, {
    retries,
    factor: 2,
    minTimeout: 2000,
    onRetry: async (err, attempt) => {
      console.error(`client connect failed (${attempt})`)
      console.error(err)
    }
  })

  return client
}

module.exports = createPGClientWithRetry
