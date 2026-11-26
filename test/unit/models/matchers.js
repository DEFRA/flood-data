const {
  valuesSchemaQueryMatcher,
  valuesSchemaVarsMatcher,
  valueParentSchemaQueryMatcher,
  valueParentSchemaVarsMatcher
} = require('../../schemas/matchers')

describe('matchers', () => {
  // Note: these tests are testing code used in the rloi.js unit tests to match and assert on args
  // passed to db.query()
  it('valueParentSchemaQueryMatcher should match', async () => {
    const queryName = 'slsTelemetryValueParent'
    expect(valueParentSchemaQueryMatcher.test(queryName)).toBe(true)
  })

  it('valueParentSchemaQueryMatcher should not match', async () => {
    const queryName = 'blah'
    expect(valueParentSchemaQueryMatcher.test(queryName)).toBe(false)
  })

  it('valueParentSchemaVarMatcher', async () => {
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
    expect(valueParentSchemaVarsMatcher.test(vars)).toBe(true)
  })

  it('valueParentSchemaVarMatcher', async () => {
    expect(valueParentSchemaVarsMatcher.test(undefined)).toBe(false)
  })

  it('insert values into sls_telemetry_value should match', async () => {
    const values = [
      {
        telemetry_value_parent_id: 1,
        value: 1.986,
        processed_value: -0.014,
        value_timestamp: '2018-06-29T11:00:00.000Z',
        error: false
      }
    ]
    expect(valuesSchemaVarsMatcher.test(values)).toBe(true)
  })

  it('insert into sls_telemetry_value should match', async () => {
    const queryName = 'slsTelemetryValues'
    expect(valuesSchemaQueryMatcher.test(queryName)).toBe(true)
  })

  it('insert into sls_telemetry_value_parent should not match', async () => {
    const query = 'blah'
    expect(valuesSchemaQueryMatcher.test(query)).toBe(false)
  })

  it('empty query object should not match', async () => {
    const query = {}
    expect(valuesSchemaQueryMatcher.test(query)).toBe(false)
  })
})
