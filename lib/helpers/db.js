const pg = require('knex')({
  client: 'pg',
  // debug: true,
  connection: process.env.LFW_DATA_DB_CONNECTION
})

module.exports = pg
