'use strict'
// ******* SETUP *******
// ***** Libraries *****
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const LambdaTester = require('lambda-tester')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon').createSandbox()

// ***** Local Imports *****
const createPGClientWithRetry = require('../../lib/helpers/retry-db-connection')

const lab = exports.lab = Lab.script()

lab.experiment('Test rloirefresh lambda invoke', { timeout: 999999000 }, () => {
  /** @type {PostgresClient} */
  let client
  let lambda

  lab.before(async function () {
    process.env.NODE_ENV = 'LOCAL_TEST'
    process.env.LFW_DATA_DB_CONNECTION = 'postgresql://postgres:fr24Password@localhost:5432/flooddev'

    lambda = proxyquire('../../lib/functions/rloi-refresh', {})

    try {
      /** @type {PostgresClient} */
      client = await createPGClientWithRetry(0)
    } catch (error) { console.error(error) }
  })

  lab.after(async function () {
    sinon.restore()
  })

  lab.test('Deleting old entries and Refreshing the view', async () => {
    const event = {}

    await LambdaTester(lambda.handler)
      .event(event)
      .expectResult(async (_lambdaResponse) => {
        const deletedEntries = await client.query('SELECT * FROM u_flood.sls_telemetry_value_parent WHERE imported < to_timestamp(EXTRACT(EPOCH FROM now()) - 432000) at time zone \'utc\';')
        const refreshedMView = await client.query('SELECT COUNT(*) FROM u_flood.telemetry_context_mview')
        Code.expect(deletedEntries.rows.length).to.equal(0)
        Code.expect(Number(refreshedMView.rows[0].count)).to.equal(3)
      })
  })
})
