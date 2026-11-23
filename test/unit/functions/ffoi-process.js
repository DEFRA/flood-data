'use strict'

const handler = require('../../../lib/functions/ffoi-process').handler
const event = require('../../events/ffoi-event.json')

const s3 = require('../../../lib/helpers/s3')
const util = require('../../../lib/helpers/util')
const ffoi = require('../../../lib/models/ffoi')
const { Client } = require('pg')

describe('FFOI processing', () => {
  let mockResponse

  beforeEach(async () => {
    // setup mocks
    mockResponse = {
      Body: {
        transformToString: jest.fn()
      }
    }
    jest.spyOn(s3, 'getObject').mockResolvedValue(mockResponse)
    jest.spyOn(util, 'parseXml').mockResolvedValue({})

    jest.spyOn(Client.prototype, 'connect').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'query').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'end').mockResolvedValue({})
    jest.spyOn(ffoi, 'save').mockResolvedValue({})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('ffoi process', async () => {
    mockResponse.Body.transformToString.mockResolvedValue('<xml></xml>')
    await handler(event)
  })

  it('ffoi process S3 error', async () => {
    jest.spyOn(s3, 'getObject').mockRejectedValue(new Error('test error'))
    await expect(handler(event)).rejects.toThrow('test error')
  })
})
