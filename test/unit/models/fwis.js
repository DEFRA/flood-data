const fs = require('fs')
const fwis = require('../../../lib/models/fwis')
const { Client } = require('pg')

describe('fwis model', () => {
  beforeEach(() => {
    // set the db mock
    jest.spyOn(Client.prototype, 'connect').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'query').mockResolvedValue({})
    jest.spyOn(Client.prototype, 'end').mockResolvedValue({})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fwis save', async () => {
    const file = JSON.parse(fs.readFileSync('./test/data/fwis.json').toString())
    const client = new Client()
    await fwis.save(file, 10000, client)
  })
})
