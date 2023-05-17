const knex = require('knex')

/**
 * This class represents a PostgreSQL client, providing a convenient interface
 * for executing raw SQL queries.
 */
class PostgresClient {
  /**
   * Create a new PostgresClient.
   *
   * @param {Record<string,any>} options - The connection options for the client.
   * @param {string} options.connection - The connection string for the PostgreSQL database.
   */
  constructor ({ connection }) {
    const client = knex({
      client: 'pg',
      connection
    })

    this.client = client
  }

  /**
   * Execute a raw SQL query using the client.
   *
   * @param {string} sql - The raw SQL query to execute.
   * @returns {Promise<{rows: Record<string, any>}>} A Promise that resolves to the result of the query.
   */
  async query (sql) {
    return this.client.raw(sql)
  }

  /**
   * Teardown function used to drop extension and all tables in the public schema.
   *
   * This method first attempts to drop the postgis extension if it exists.
   * Then, it queries the database to get all table names in the public schema.
   * For each table in the public schema, it executes a drop table query.
   * If all queries are successful, a success message is logged to the console.
   * If any query fails, the error is caught and logged to the console.
   *
   * @return {Promise<void>} Promise that resolves when all queries have completed.
   */
  teardown () {
    return this.client.raw(`
      DROP EXTENSION IF EXISTS postgis CASCADE;`
    ).then(() => this.client.raw(`
      SELECT *
      FROM information_schema.tables
      WHERE table_schema = 'public'`
    ))
      .then(results => {
        const dropTablePromises = results.rows.map(row => {
          const tableName = row.table_name
          return this.client.raw(`DROP TABLE IF EXISTS ${tableName} CASCADE;`)
        })
        return Promise.all(dropTablePromises)
      })
      .then(() => {
        console.log('Teardown completed successfully.')
      })
      .catch(err => {
        console.error('Error executing query', err.stack)
      })
  }
}

module.exports = PostgresClient
