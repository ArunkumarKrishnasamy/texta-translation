const Pool = require("pg").Pool;
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const pool = new Pool({
  user: process.env.USER,
  host: process.env.host,
  port: process.env.port,
  database: process.env.database,
  password: process.env.password,
});

module.exports = pool;
