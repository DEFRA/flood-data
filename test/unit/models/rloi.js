const { parseStringPromise } = require('xml2js')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const fs = require('fs')
const rloiValueParentSchema = require('../../schemas/rloi-value-parent')
const rloiValuesSchema = require('../../schemas/rloi-values')

const util = new (require('../../../lib/helpers/util'))()
const Rloi = require('../../../lib/models/rloi')
const Db = require('../../../lib/helpers/db')
const S3 = require('../../../lib/helpers/s3')
const station = require('../../data/station.json')
const station2 = require('../../data/station2.json')
const coastalStation = require('../../data/station-coastal.json')
const sinon = require('sinon')

function getStubbedS3Helper () {
  return sinon.createStubInstance(S3)
}

function getStubbedS3HelperGetObject (station) {
  const stub = getStubbedS3Helper()
  stub.getObject.resolves({ Body: JSON.stringify(station) })
  return stub
}

const valueParentSchemaQueryMatcher = sinon.match((matchValue) => {
  const { error } = rloiValueParentSchema.query.validate(matchValue)
  return error === undefined
}, 'parent query does not match expected schema')

const valueParentSchemaVarsMatcher = sinon.match((matchValue) => {
  const { error } = rloiValueParentSchema.vars.validate(matchValue)
  return error === undefined
}, 'parent vars does not match expected schema')

const valuesSchemaQueryMatcher = sinon.match((matchValue) => {
  const { error } = rloiValuesSchema.query.validate(matchValue)
  return error === undefined
}, 'Values query does not match expected schema')

function getMockedDbHelper () {
  const db = sinon.createStubInstance(Db)
  // Note: using the sinon.createStubInstance(MyConstructor, overrides) form didn't work for some reason
  // hence using this slightly less terse form
  db.query
    .withArgs(valuesSchemaQueryMatcher)
    .resolves()
    .withArgs(valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher)
    .resolves({ rows: [{ telemetry_value_parent_id: 1 }] })
  return db
}

lab.experiment('rloi model', () => {
  lab.afterEach(() => {
    sinon.verify()
    // Restore after each test is Sinon best practice at time of wrting
    // https://sinonjs.org/releases/v9.0.3/general-setup/
    sinon.restore()
  })

  lab.experiment('matchers', () => {
    lab.test('valueParentSchemaQueryMatcher should match', async () => {
      const query = 'INSERT INTO sls_telemetry_value_parent(filename, imported, rloi_id, station, region, start_timestamp, end_timestamp, parameter, qualifier, units, post_process, subtract, por_max_value, station_type, percentile_5) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING telemetry_value_parent_id'
      Code.expect(valueParentSchemaQueryMatcher.test(query)).to.be.true()
    })
    lab.test('valueParentSchemaQueryMatcher should not match', async () => {
      const query = {
        text: 'INSERT INTO "sls_telemetry_value" ("telemetry_value_parent_id", "value", "processed_value", "value_timestamp", "error") VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15), ($16, $17, $18, $19, $20)',
        values: [1, 1.986, null, '2018-06-29T10:15:00.000Z', true, 1, 1.986, null, '2018-06-29T10:30:00.000Z', true, 1, 1.986, null, '2018-06-29T10:45:00.000Z', true, 1, 1.986, null, '2018-06-29T11:00:00.000Z', true]
      }
      Code.expect(valueParentSchemaQueryMatcher.test(query)).to.be.false()
    })
    lab.test('valueParentSchemaVarMatcher', async () => {
      const vars = [
        'testkey',
        'Tue Sep 15 2020 08:37:13 GMT+0100 (British Summer Time)',
        5075,
        'test1',
        'North West',
        'Fri Jun 29 2018 11:15:00 GMT+0100 (British Summer Time)',
        'Fri Jun 29 2018 12:00:00 GMT+0100 (British Summer Time)',
        'Water Level',
        'Stage',
        'm',
        true,
        2,
        3.428,
        'S',
        1.6
      ]
      Code.expect(valueParentSchemaVarsMatcher.test(vars)).to.be.true()
    })
    lab.test('valueParentSchemaVarMatcher', async () => {
      Code.expect(valueParentSchemaVarsMatcher.test(undefined)).to.be.false()
    })
    lab.experiment('valuesSchemaQueryMatcher', async () => {
      lab.test('insert into sls_telemetry_value should match', async () => {
        const query = {
          text: 'INSERT INTO "sls_telemetry_value" ("telemetry_value_parent_id", "value", "processed_value", "value_timestamp", "error") VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15), ($16, $17, $18, $19, $20)',
          values: [1, 1.986, null, '2018-06-29T10:15:00.000Z', true, 1, 1.986, null, '2018-06-29T10:30:00.000Z', true, 1, 1.986, null, '2018-06-29T10:45:00.000Z', true, 1, 1.986, null, '2018-06-29T11:00:00.000Z', true]
        }
        Code.expect(valuesSchemaQueryMatcher.test(query)).to.be.true()
      })
      lab.test('insert into sls_telemetry_value_parent should not match', async () => {
        const query = 'INSERT INTO sls_telemetry_value_parent(filename, imported, rloi_id, station, region, start_timestamp, end_timestamp, parameter, qualifier, units, post_process, subtract, por_max_value, station_type, percentile_5) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING telemetry_value_parent_id'
        Code.expect(valuesSchemaQueryMatcher.test(query)).to.be.false()
      })
      lab.test('empty query object should not match', async () => {
        const query = {}
        Code.expect(valuesSchemaQueryMatcher.test(query)).to.be.false()
      })
    })
  })

  lab.test('RLOI process', async () => {
    const db = getMockedDbHelper()
    const s3 = getStubbedS3HelperGetObject(station)
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    const rloi = new Rloi(db, s3, util)
    await rloi.save(file, 's3://devlfw', 'testkey')
    sinon.assert.callCount(db.query.withArgs(valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher), 20)
    sinon.assert.callCount(db.query.withArgs(valuesSchemaQueryMatcher), 20)
  })

  lab.test('RLOI process empty values', async () => {
    const db = getMockedDbHelper()
    const s3 = getStubbedS3HelperGetObject(station)
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-empty.xml'))
    const rloi = new Rloi(db, s3, util)
    await rloi.save(file, 's3://devlfw', 'testkey')
  })

  lab.test('RLOI process no station', async () => {
    const s3 = getStubbedS3Helper()
    const db = getMockedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    const rloi = new Rloi(db, s3, util)
    await rloi.save(file, 's3://devlfw', 'testkey')
  })

  lab.test('RLOI process no station', async () => {
    const s3 = getStubbedS3HelperGetObject(station2)
    const db = getMockedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    const rloi = new Rloi(db, s3, util)
    await rloi.save(file, 's3://devlfw', 'testkey')
  })

  lab.test('RLOI process no station', async () => {
    const s3 = getStubbedS3HelperGetObject(coastalStation)
    const db = getMockedDbHelper()
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    const rloi = new Rloi(db, s3, util)
    await rloi.save(file, 's3://devlfw', 'testkey')
  })

  lab.test('RLOI delete Old', async () => {
    const dbHelperMock = sinon.createStubInstance(Db)
    dbHelperMock.query = sinon.mock()
      .withArgs(sinon.match(/^DELETE FROM u_flood.sls_telemetry_value_parent/))
      .once(1)
      .resolves()
    const rloi = new Rloi(dbHelperMock)
    await rloi.deleteOld()
  })

  lab.test('RLOI process with non numeric return', async () => {
    const file = await parseStringPromise(fs.readFileSync('./test/data/rloi-test.xml'))
    const s3 = getStubbedS3HelperGetObject(station)
    const db = getMockedDbHelper()
    sinon.stub(util, 'isNumeric').returns(false)
    const rloi = new Rloi(db, s3, util)
    await rloi.save(file, 's3://devlfw', 'testkey')
    sinon.assert.callCount(db.query.withArgs(valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher), 20)
    sinon.assert.callCount(db.query.withArgs(valuesSchemaQueryMatcher), 20)
  })

  lab.test('negative processed values should be errors', async () => {
    const file = require('../../data/rloi-test-single.json')
    const s3 = getStubbedS3HelperGetObject(station)
    const db = getMockedDbHelper()
    const rloi = new Rloi(db, s3, util)
    await rloi.save(file, 's3://devlfw', 'testkey')
    sinon.assert.callCount(db.query.withArgs(valueParentSchemaQueryMatcher, valueParentSchemaVarsMatcher), 1)
    const expectedQuery = {
      text: 'INSERT INTO "sls_telemetry_value" ("telemetry_value_parent_id", "value", "processed_value", "value_timestamp", "error") VALUES ($1, $2, $3, $4, $5)',
      values: [
        1,
        1.986,
        null,
        '2018-06-29T11:00:00.000Z',
        true
      ]
    }
    sinon.assert.calledOnceWithExactly(db.query.withArgs(valuesSchemaQueryMatcher), expectedQuery)
  })
})
