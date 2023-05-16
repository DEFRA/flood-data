const  knex = require('knex');

class PostGresClient {
  constructor({ connection }) {
    const client = knex({
      client: 'pg',
      connection,
    });

    this.client = client;
  }

  async query(sql) {
    return client.raw(sql);
  }
}

module.exports = PostGresClient;
