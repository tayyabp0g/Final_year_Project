const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'chatbot_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const ensureChatHistorySchema = async (connection) => {
  try {
    const [[convIdCol]] = await connection.query("SHOW COLUMNS FROM chat_history LIKE 'conversation_id'");
    const [[convTitleCol]] = await connection.query("SHOW COLUMNS FROM chat_history LIKE 'conversation_title'");

    if (!convIdCol) {
      await connection.query('ALTER TABLE chat_history ADD COLUMN conversation_id VARCHAR(64) NULL');
    }
    if (!convTitleCol) {
      await connection.query('ALTER TABLE chat_history ADD COLUMN conversation_title VARCHAR(255) NULL');
    }

    try {
      await connection.query('CREATE INDEX idx_user_conv_date ON chat_history(user_id, conversation_id, created_at)');
    } catch {}
  } catch {
    // If table doesn't exist yet, setup scripts will create it.
  }
};

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await ensureChatHistorySchema(connection);
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  ensureChatHistorySchema,
};
