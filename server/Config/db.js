require("dotenv").config();
const mysql = require("mysql2/promise");

const db = mysql.createPool(process.env.MONGO_URL);

console.log(" MySQL Connected");

module.exports = db;