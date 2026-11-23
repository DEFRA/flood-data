const handler = require('../../../lib/functions/fgs-process').handler
const s3 = require('../../../lib/helpers/s3')
const wreck = require('../../../lib/helpers/wreck')

describe('fgs process', () => {
  it('fgs process', async () => {
    process.env.LFW_DATA_FGS_KEY = 'test-key'

    const putObject = jest.spyOn(s3, 'putObject').mockImplementation((params) => {
      expect(params.Body).toEqual(JSON.stringify({ id: 'test' }))
      expect(params.Key).toInclude('fgs/')
      expect(params.Key).toInclude('.json')
      return Promise.resolve({})
    })
    const request = jest.spyOn(wreck, 'request').mockResolvedValue({
      statement: { id: 'test' }
    })

    await handler()
    expect(putObject).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenCalledTimes(1)

    // Verify request was called with correct URL
    expect(request.mock.calls[0][1]).toInclude('v3/statements/latest')

    delete process.env.LFW_DATA_FGS_KEY
  })

  it('fgs process sends x-api-key header', async () => {
    process.env.LFW_DATA_FGS_KEY = 'test-api-key-123'

    jest.spyOn(s3, 'putObject').mockResolvedValue({})
    const request = jest.spyOn(wreck, 'request').mockResolvedValue({
      statement: { id: 'test' }
    })

    await handler()

    expect(request).toHaveBeenCalledTimes(1)
    const callArgs = request.mock.calls[0]
    expect(callArgs[0]).toEqual('get')
    expect(callArgs[1]).toInclude('statements/latest')
    expect(callArgs[2].headers).toBeDefined()
    expect(callArgs[2].headers['x-api-key']).toEqual('test-api-key-123')
    expect(callArgs[2].json).toBe(true)
    expect(callArgs[2].timeout).toEqual(30000)

    delete process.env.LFW_DATA_FGS_KEY
  })

  it('fgs process when LFW_DATA_FGS_KEY is not set', async () => {
    delete process.env.LFW_DATA_FGS_KEY

    jest.spyOn(s3, 'putObject').mockResolvedValue({})
    const request = jest.spyOn(wreck, 'request').mockResolvedValue({
      statement: { id: 'test' }
    })

    await handler()

    const callArgs = request.mock.calls[0]
    expect(callArgs[2].headers['x-api-key']).toBeUndefined()
  })

  it('s3 error', async () => {
    jest.spyOn(s3, 'putObject').mockRejectedValue(new Error('test error'))
    jest.spyOn(wreck, 'request').mockRejectedValue(new Error('test error'))
    await expect(handler()).rejects.toThrow('test error')
  })

  it('request error', async () => {
    jest.spyOn(wreck, 'request').mockResolvedValue(null)
    await expect(handler()).rejects.toThrow()
  })
})
