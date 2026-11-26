const mockDb = require('mock-knex')
const db = require('../../../lib/helpers/db')
const { getRloiIds } = require('../../../lib/helpers/imtd-api')
const tracker = mockDb.getTracker()

describe('imtd-api getRloiIds', () => {
  beforeAll(() => mockDb.mock(db))
  afterAll(() => mockDb.unmock(db))
  beforeEach(() => tracker.install())
  afterEach(() => tracker.uninstall())

  it('works when called without options', async () => {
    tracker.on('query', query => query.response([{ rloi_id: 1 }]))
    await expect(getRloiIds()).resolves.toEqual([{ rloi_id: 1 }])
  })
})
