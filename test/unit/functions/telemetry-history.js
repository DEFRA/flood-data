const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

lab.experiment('telemetry history', () => {
  lab.test('runs the history update query before ending the pool', async () => {
    const pool = {
      query: sinon.stub().resolves(),
      end: sinon.stub().resolves()
    }
    const Pool = sinon.stub().returns(pool)
    const { handler } = proxyquire('../../../lib/functions/telemetry-history', {
      '../helpers/pool': { Pool }
    })

    await handler()

    sinon.assert.calledOnceWithExactly(pool.query, 'updateTelemetryHistory')
    sinon.assert.callOrder(pool.query, pool.end)
  })

  lab.test('ends the pool and propagates a history update failure', async () => {
    const error = new Error('history update failed')
    const pool = {
      query: sinon.stub().rejects(error),
      end: sinon.stub().resolves()
    }
    const Pool = sinon.stub().returns(pool)
    const { handler } = proxyquire('../../../lib/functions/telemetry-history', {
      '../helpers/pool': { Pool }
    })

    await Code.expect(handler()).to.reject()
    sinon.assert.calledOnce(pool.end)
  })
})
