const handler = require('../../../lib/functions/fwis-process').handler
const event = require('../../events/fwis-event.json')
const wreck = require('../../../lib/helpers/wreck')
const fwis = require('../../../lib/models/fwis')
const { Client } = require('pg')

describe('fwis processing', () => {
  beforeEach(() => {
    // setup mocks
    jest.spyOn(wreck, 'request').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'connect').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'query').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'end').mockResolvedValue({})
    jest.spyOn(fwis, 'save').mockResolvedValue({})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('fwis process', async () => {
    await handler(event)
  })

  it('fwis process S3 error', async () => {
    wreck.request = () => {
      return Promise.reject(new Error('Test error'))
    }
    await expect(handler(event)).rejects.toThrow()
  })
})
