jest.mock('@hapi/wreck', () => ({ get: jest.fn() }))
jest.mock('async-retry', () => jest.fn(async (fn, opts) => {
  try {
    return await fn()
  } catch (err) {
    opts.onRetry(err, 1)
    throw err
  }
}))

const wreck = require('@hapi/wreck')
const retry = require('async-retry')
const wreckHelper = require('../../../lib/helpers/wreck')

describe('wreck helper', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns the payload on a 200 response', async () => {
    wreck.get.mockResolvedValue({ res: { statusCode: 200 }, payload: 'ok' })
    await expect(wreckHelper.request('get', 'http://x', {})).resolves.toBe('ok')
    expect(wreck.get).toHaveBeenCalledWith('http://x', {})
    expect(retry).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ retries: 4 }))
  })

  it('throws the payload on a non-200 response and logs the retry', async () => {
    wreck.get.mockResolvedValue({ res: { statusCode: 500 }, payload: 'bad' })
    await expect(wreckHelper.request('get', 'http://x')).rejects.toBe('bad')
    expect(console.error).toHaveBeenCalledWith('wreck attempt failed (1)')
  })

  it('throws an unknown error when there is no payload', async () => {
    wreck.get.mockResolvedValue({ res: { statusCode: 500 } })
    await expect(wreckHelper.request('get', 'http://x')).rejects.toThrow('Unknown error')
  })
})
