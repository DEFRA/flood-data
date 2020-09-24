const sinon = require('sinon')
const rloiValueParentSchema = require('./rloi-value-parent')
const rloiValuesSchema = require('./rloi-values')

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

module.exports = {
  valueParentSchemaQueryMatcher,
  valueParentSchemaVarsMatcher,
  valuesSchemaQueryMatcher
}
