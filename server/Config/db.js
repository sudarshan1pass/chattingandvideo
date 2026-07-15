require("dotenv").config();
const mysql = require("mysql2/promise");

const mysqlUrl =
  process.env.MYSQL_PUBLIC_URL ||
  process.env.MYSQL_URL ||
  process.env.DATABASE_URL ||
  process.env.MONGO_URL;

const hasMysqlVars =
  process.env.MYSQLHOST &&
  process.env.MYSQLUSER &&
  process.env.MYSQLPASSWORD &&
  process.env.MYSQLDATABASE;

let dbConfig = mysqlUrl;

if (!dbConfig && hasMysqlVars) {
  dbConfig = {
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
  };
}

if (!dbConfig) {
  throw new Error(
    "Missing MySQL configuration. Set MYSQL_PUBLIC_URL, MYSQL_URL, DATABASE_URL, or Railway MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE variables."
  );
}

if (
  typeof dbConfig === "string" &&
  /^mongodb(\+srv)?:\/\//i.test(dbConfig)
) {
  throw new Error(
    "Invalid database configuration: MONGO_URL contains a MongoDB URI, but this server uses mysql2. Set MYSQL_PUBLIC_URL or DATABASE_URL to the Railway MySQL connection string."
  );
}

const db = mysql.createPool(
  typeof dbConfig === "string"
    ? dbConfig
    : {
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
      }
);

async function verifyConnection() {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.ping();
    console.log("Railway MySQL Connected");
  } catch (error) {
    console.error("Railway MySQL connection failed:", {
      code: error.code,
      message: error.message,
      sqlMessage: error.sqlMessage,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

verifyConnection();

module.exports = db;
