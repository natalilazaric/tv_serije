const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tv_serije', 
  password: 'lozinka',     
  port: 5432,
});

module.exports = pool;
