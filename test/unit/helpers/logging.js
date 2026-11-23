const logger = require('../../../lib/helpers/logging')

describe('logging helper', () => {
  it('info logs arguments to console.log', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('a', 'b')
    expect(spy).toHaveBeenCalledWith(['a', 'b'])
  })

  it('error logs arguments to console.error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('a', 'b')
    expect(spy).toHaveBeenCalledWith(['a', 'b'])
  })
})
