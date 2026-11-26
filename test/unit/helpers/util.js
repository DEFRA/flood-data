const util = require('../../../lib/helpers/util')

describe('util.js', () => {
  it('toFixed', () => {
    expect(util.toFixed(5.789, 2)).toBe('5.79')
    expect(util.toFixed()).toBe(undefined)
  })

  it('isNumeric', () => {
    expect(util.isNumeric(NaN)).toBe(false)
    expect(util.isNumeric(null)).toBe(false)
    expect(util.isNumeric('1234sdf')).toBe(false)
    expect(util.isNumeric('fghj')).toBe(false)
    expect(util.isNumeric(undefined)).toBe(false)
    expect(util.isNumeric(1)).toBe(true)
    expect(util.isNumeric('1')).toBe(true)
  })

  it('parseIntNull', () => {
    expect(util.parseIntNull('sdf', 1)).toBe(null)
    expect(util.parseIntNull(5, 10)).toBe(5)
  })

  it('parseXml', async () => {
    await expect(util.parseXml('xml></xml>')).rejects.toThrow()
  })
})
