const sinon = require('sinon')
const rloiValueParentSchema = require('./rloi-value-parent')
const rloiValuesSchema = require('./rloi-values')
const stationSchema = require('./station')

const valueParentSchemaQueryMatcher = sinon.match((matchValue) => {
  return rloiValueParentSchema.queryName.validate(matchValue).error === undefined
}, 'parent query does not match expected schema')

const valueParentSchemaVarsMatcher = sinon.match((matchValue) => {
  return rloiValueParentSchema.vars.validate(matchValue).error === undefined
}, 'parent vars does not match expected schema')

const valuesSchemaQueryMatcher = sinon.match((matchValue) => {
  return rloiValuesSchema.queryName.validate(matchValue).error === undefined
}, 'Values query does not match expected schema')

// TODO: add tests for this matcher
const valuesSchemaVarsMatcher = sinon.match((matchValue) => {
  return rloiValuesSchema.vars.validate(matchValue).error === undefined
}, 'Values vars does not match expected schema')

const stationSchemaQueryMatcher = sinon.match((matchValue) => {
  return stationSchema.queryName.validate(matchValue).error === undefined
}, 'station query does not match expected schema')

const stationSchemaVarsMatcher = sinon.match((matchValue) => {
  return stationSchema.vars.validate(matchValue).error === undefined
}, 'station vars does not match expected schema')

module.exports = {
  valueParentSchemaQueryMatcher,
  valueParentSchemaVarsMatcher,
  valuesSchemaQueryMatcher,
  valuesSchemaVarsMatcher,
  stationSchemaQueryMatcher,
  stationSchemaVarsMatcher
}
