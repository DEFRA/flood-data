const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const PostgresClient = require('../../../lib/helpers/postgres-client')
const createPGClientWithRetry = require('../../../lib/helpers/retry-db-connection')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

describe('createPGClientWithRetry', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should create and return a PostgresClient', async () => {
    const client = new PostgresClient({ connection: process.env.LFW_DATA_DB_CONNECTION })
    const result = await createPGClientWithRetry()

    expect(result).to.equal(client)
  })
})
