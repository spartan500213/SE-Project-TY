const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.MIS_DATABASE_URL,
});

module.exports = pool;
