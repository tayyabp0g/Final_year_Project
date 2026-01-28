const mysql = require('mysql2/promise');
require('dotenv').config();
const logger = require('../utils/logger');

// Connection pool for MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    logger.error('❌ Database connection failed', error.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  testConnection,
};
