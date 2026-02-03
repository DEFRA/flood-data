const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')

const lab = exports.lab = Lab.script()

const wreck = require('../../../lib/helpers/wreck')
const fwis = require('../../../lib/models/fwis')
const { Pool } = require('../../../lib/helpers/pool')

const { handler } = require('../../../lib/functions/fwis-process')

lab.experiment('fwis-process lambda', () => {
  let wreckStub
  let saveStub
  let poolStub

  lab.beforeEach(() => {
    process.env.LFW_DATA_FWIS_API_URL = 'https://fwis.example'
    process.env.LFW_DATA_FWIS_API_KEY = 'test-key'
    process.env.LFW_DATA_DB_CONNECTION = 'postgres://test'

    wreckStub = sinon.stub(wreck, 'request')
    saveStub = sinon.stub(fwis, 'save')
    poolStub = sinon.stub(Pool.prototype, 'end').resolves()
  })

  lab.afterEach(() => {
    sinon.restore()
    delete process.env.IS_LOCALSTACK
  })

  lab.test('uses fixture data in LocalStack', async () => {
    process.env.IS_LOCALSTACK = 'true'

    await handler({})

    expect(wreckStub.called).to.be.false()
    expect(saveStub.calledOnce).to.be.true()
    expect(saveStub.firstCall.args[0]).to.be.an.array()
    expect(poolStub.calledOnce).to.be.true()
  })

  lab.test('calls FWIS and saves warnings', async () => {
    process.env.IS_LOCALSTACK = 'false'

    wreckStub.resolves({ warnings: [{ id: 1 }] })

    await handler({})

    expect(wreckStub.calledOnce).to.be.true()
    expect(saveStub.calledOnce).to.be.true()
    expect(poolStub.calledOnce).to.be.true()
  })
})
