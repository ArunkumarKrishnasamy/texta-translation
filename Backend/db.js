const Pool = require("pg").Pool;

const dotenv = require("dotenv");
dotenv.config({ path: "./env" });

const pool = new Pool({
  user: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  port: process.env.PORT,
  database: process.env.DATABASE,
});

module.exports = pool;
