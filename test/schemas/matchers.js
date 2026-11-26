const rloiValueParentSchema = require('./rloi-value-parent')
const rloiValuesSchema = require('./rloi-values')
const stationSchema = require('./station')

// Jest asymmetric matcher: usable inside toHaveBeenCalledWith / toEqual etc.
const schemaMatcher = (schema, description) => {
  const test = (value) => schema.validate(value).error === undefined
  return {
    $$typeof: Symbol.for('jest.asymmetricMatcher'),
    asymmetricMatch: test,
    test,
    toString: () => description,
    toAsymmetricMatcher: () => description,
    getExpectedType: () => 'any'
  }
}

const valueParentSchemaQueryMatcher = schemaMatcher(rloiValueParentSchema.queryName, 'parent query does not match expected schema')

const valueParentSchemaVarsMatcher = schemaMatcher(rloiValueParentSchema.vars, 'parent vars does not match expected schema')

const valuesSchemaQueryMatcher = schemaMatcher(rloiValuesSchema.queryName, 'Values query does not match expected schema')

// TODO: add tests for this matcher
const valuesSchemaVarsMatcher = schemaMatcher(rloiValuesSchema.vars, 'Values vars does not match expected schema')

const stationSchemaQueryMatcher = schemaMatcher(stationSchema.queryName, 'station query does not match expected schema')

const stationSchemaVarsMatcher = schemaMatcher(stationSchema.vars, 'station vars does not match expected schema')

module.exports = {
  valueParentSchemaQueryMatcher,
  valueParentSchemaVarsMatcher,
  valuesSchemaQueryMatcher,
  valuesSchemaVarsMatcher,
  stationSchemaQueryMatcher,
  stationSchemaVarsMatcher
}
