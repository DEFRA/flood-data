const mockConstructedQueries = {
  exampleQuery: (values) => {
    return {
      text: 'INSERT into "some_table" ("a", "b", "c") values ($1, $2, $3)', values
    }
  }
}

describe('DatabasePool', () => {
  let poolStub
  let clientStub
  let Pool

  beforeEach(() => {
    clientStub = {
      query: jest.fn().mockResolvedValue({ /* mocked query result */ }),
      release: jest.fn().mockResolvedValue()
    }
    poolStub = {
      connect: jest.fn().mockResolvedValue(clientStub),
      end: jest.fn().mockResolvedValue()
    }
    jest.resetModules()
    jest.doMock('pg', () => ({ Pool: jest.fn(() => poolStub) }))
    jest.doMock('../../../lib/constructed-queries', () => mockConstructedQueries)
    Pool = require('../../../lib/helpers/pool').Pool
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.dontMock('pg')
    jest.dontMock('../../../lib/constructed-queries')
  })

  describe('query', () => {
    it('should execute a constructed query using client from the pool', async () => {
      // Arrange
      const pool = new Pool()
      const queryName = 'exampleQuery'
      const values = [
        1, 2, 'test'
      ]

      // Act
      await pool.query(queryName, values)

      // Assert
      expect(poolStub.connect).toHaveBeenCalledTimes(1)
      expect(clientStub.query).toHaveBeenLastCalledWith({
        text: 'INSERT into "some_table" ("a", "b", "c") values ($1, $2, $3)',
        values: [
          1, 2, 'test'
        ]
      })
      expect(clientStub.release).toHaveBeenCalledTimes(1)
    })

    it('should not try to release when no client could be obtained', async () => {
      poolStub.connect.mockResolvedValue(undefined)
      const pool = new Pool()
      await expect(pool.query('exampleQuery', [1, 2, 'test'])).rejects.toThrow('Error querying DB')
      expect(clientStub.release).not.toHaveBeenCalled()
    })

    it('should throw an error if asked to execute an unknown query', async () => {
      // Arrange
      const pool = new Pool()
      const queryName = 'unknownQuery'
      const values = [
        1, 2, 'test'
      ]

      // Act
      let error
      try {
        await pool.query(queryName, values)
      } catch (e) {
        error = e
      }

      // Assert
      expect(poolStub.connect).not.toHaveBeenCalled()
      expect(clientStub.query).not.toHaveBeenCalled()
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Query not found \'unknownQuery\'')
    })
  })
  describe('end', () => {
    it('should gracefully end the connection pool', async () => {
      // Arrange
      const pool = new Pool()

      // Act
      await pool.end()

      // Assert
      expect(poolStub.end).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if ending the pool fails', async () => {
      // Arrange
      const pool = new Pool()
      jest.spyOn(console, 'error').mockImplementation(() => {})
      poolStub.end.mockRejectedValue(new Error('Failed to end pool'))

      // Act & Assert
      await expect(pool.end()).rejects.toThrow('Failed to end pool')
      expect(poolStub.end).toHaveBeenCalledTimes(1)
    })
  })
})
