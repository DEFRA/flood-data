const Query = require('../../../lib/helpers/query')

describe('Query', () => {
  it('builds from a string', () => {
    const query = Query.fromString('select $1', [1])
    expect(query.text).toBe('select $1')
    expect(query.values).toEqual([1])
  })

  it('builds from a knex query', () => {
    const knexQuery = { toSQL: () => ({ toNative: () => ({ sql: 'select ?', bindings: [2] }) }) }
    const query = Query.fromKnexQuery(knexQuery)
    expect(query.text).toBe('select ?')
    expect(query.values).toEqual([2])
  })

  it('serialises to JSON', () => {
    expect(JSON.parse(Query.fromString('s', [1]).toString())).toEqual({ text: 's', values: [1] })
  })
})
