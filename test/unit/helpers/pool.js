const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const mockDb = require('mock-knex')
const db = require('../../../lib/helpers/db')
const tracker = mockDb.getTracker()
const { Pool } = require('../../../lib/helpers/pool')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const { describe, it, before, after, beforeEach, afterEach } = exports.lab = Lab.script()

function setupStdDbStubs (response) {
  const queries = []
  tracker.on('query', function (query) {
    queries.push({ sql: query.sql, bindings: query.bindings })
    query.response(response)
  })
  return { queries }
}

describe('Pool', () => {
  before(() => {
    mockDb.mock(db)
  })

  after(() => {
    mockDb.unmock(db)
  })

  beforeEach(() => {
    tracker.install()
  })

  afterEach(() => {
    tracker.uninstall()
  })

  it('should create the correct query for slsTelemetryStation', async () => {
    const pool = new Pool()

    const { queries } = setupStdDbStubs()

    const result = await pool.query('slsTelemetryStation', ['123', 'North', 'Station 1', 'abc', false, 1.1, 2.1])

    expect(result).to.equal({ rows: [] })
    expect(queries.length).to.equal(1)
    expect(queries[0].sql).to.equal('update "u_flood"."sls_telemetry_station" set "station_name" = EXCLUDED.station_name, "ngr" = EXCLUDED.ngr, "easting" = EXCLUDED.easting, "northing" = EXCLUDED.northing')
  })

  it('should create the correct query for slsTelemetryValues', async () => {
    const pool = new Pool()

    const { queries } = setupStdDbStubs()

    const result = await pool.query('slsTelemetryValues', [{ col1: 1, col2: 2, col3: 'test' }])

    expect(result).to.equal({ rows: [] })
    expect(queries.length).to.equal(1)
    expect(queries[0].sql).to.equal('insert into "sls_telemetry_value" ("col1", "col2", "col3") values ($1, $2, $3)')
  })

  it('should create the correct query for slsTelemetryValuesParent', async () => {
    const pool = new Pool()

    const { queries } = setupStdDbStubs([{ test: 1 }])

    const input = [
      'fwfidata/rloi/NWTSNWFS20210112103440355.XML',
      Date('2023-07-24T10:03:42.942Z'),
      6,
      '6',
      'North West',
      Date('2018-06-29T10:15:00.000Z'),
      Date('2018-06-29T11:00:00.000Z'),
      'Water Level',
      'Downstream Stage',
      'mASD',
      true,
      '2.000',
      '3.428',
      'S',
      '1.600',
      'Instantaneous',
      '15 min'
    ]

    const result = await pool.query('slsTelemetryValueParent', input)

    expect(result).to.equal({ rows: [{ test: 1 }] })
    expect(queries.length).to.equal(1)
    expect(queries[0].sql).to.equal('insert into "sls_telemetry_value_parent" ("data_type", "end_timestamp", "filename", "imported", "parameter", "percentile_5", "period", "por_max_value", "post_process", "qualifier", "region", "rloi_id", "start_timestamp", "station", "station_type", "subtract", "units") values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) returning *')
  })

  it('should handle query errors', async () => {
    const pool = new Pool()

    tracker.on('query', (query) => { query.reject('Query Error') })

    const returnedError = await expect(pool.query('slsTelemetryValues', [])).to.reject()
    expect(returnedError.message).to.equal('Error querying DB (query: slsTelemetryValues, values: []):  - Query Error')
  })

  it('should end the pool', async () => {
    const knexStub = {
      destroy: sinon.stub()
    }
    const { Pool } = proxyquire('../../../lib/helpers/pool', {
      './db': knexStub
    })
    const pool = new Pool()
    await pool.end()
    expect(knexStub.destroy.calledOnce).to.equal(true)
  })

  it('should handle pool ending errors', async () => {
    const knexStub = {
      destroy: sinon.stub().rejects(Error('Err123'))
    }
    const { Pool } = proxyquire('../../../lib/helpers/pool', {
      './db': knexStub
    })
    const pool = new Pool()
    const returnedError = await expect(pool.end()).to.reject()
    expect(returnedError.message).to.equal('Error ending pool: Err123')
  })
})
