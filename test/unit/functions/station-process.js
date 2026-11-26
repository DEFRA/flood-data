const handler = require('../../../lib/functions/station-process').handler
const event = require('../../events/station-event.json')
const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')
const station = require('../../../lib/models/station')
const { Client } = require('pg')

describe('station processing', () => {
  let mockResponse

  beforeEach(() => {
    // setup mocks
    mockResponse = {
      Body: {
        transformToString: jest.fn()
      }
    }

    jest.spyOn(s3, 'getObject').mockResolvedValue(mockResponse)
    jest.spyOn(util, 'parseCsv').mockResolvedValue({})
    jest.spyOn(station, 'saveToDb').mockResolvedValue({})
    jest.spyOn(station, 'saveToObjects').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'connect').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'query').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'end').mockResolvedValue({})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('station process', async () => {
    mockResponse.Body.transformToString.mockResolvedValue('test')
    await handler(event)
  })

  it('station process S3 error', async () => {
    s3.getObject = () => {
      return Promise.reject(new Error('test error'))
    }
    await expect(handler(event)).rejects.toThrow()
  })
})
