const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',        // tvoj user
  host: 'localhost',       // host baze
  database: 'tv_serije',  // ime baze
  password: 'lozinka123',     // lozinka
  port: 5433,
});

module.exports = pool;
