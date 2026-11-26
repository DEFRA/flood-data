const handler = require('../../../lib/functions/rloi-refresh').handler
const station = require('../../../lib/models/station')
const rloi = require('../../../lib/models/rloi')
const { Client } = require('pg')

describe('rloi Refresh', () => {
  beforeEach(async () => {
    // Mock database call
    jest.spyOn(station, 'refreshStationMview').mockResolvedValue({})
    jest.spyOn(rloi, 'deleteOld').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'connect').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'query').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'end').mockResolvedValue({})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('rloi Refresh', async () => {
    await handler()
  })

  it('rloi Refresh error', async () => {
    station.refreshStationMview.mockRejectedValue(new Error('test error'))
    await expect(handler()).rejects.toThrow('test error')
  })
})
