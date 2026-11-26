const handler = require('../../../lib/functions/rloi-process').handler
const event = require('../../events/fwis-event.json')
const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')
const rloi = require('../../../lib/models/rloi')
const { Client } = require('pg')

describe('rloi processing', () => {
  let mockResponse

  beforeEach(() => {
    // setup mocks
    mockResponse = {
      Body: {
        transformToString: jest.fn()
      }
    }
    jest.spyOn(s3, 'getObject').mockResolvedValue(mockResponse)
    jest.spyOn(util, 'parseXml').mockResolvedValue({})
    jest.spyOn(rloi, 'save').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'connect').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'query').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'end').mockResolvedValue({})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('rloi process', async () => {
    mockResponse.Body.transformToString.mockResolvedValue('<xml></xml>')
    await handler(event)
  })

  it('rloi process S3 error', async () => {
    s3.getObject = () => {
      return Promise.reject(new Error('test error'))
    }
    await expect(handler(event)).rejects.toThrow()
  })
})
