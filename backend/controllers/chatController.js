const { pool } = require('../config/database');
const logger = require('../utils/logger');

const isLegacyConversationId = (conversationId) =>
  typeof conversationId === 'string' && conversationId.startsWith('legacy:');

const legacyChatIdFromConversationId = (conversationId) => {
  const raw = conversationId.slice('legacy:'.length);
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

// Save chat message (Only for logged-in users)
exports.saveChatMessage = async (req, res) => {
  try {
    const { message, response, conversationId, conversationTitle } = req.body || {};
    const userId = req.userId;

    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    if (!response || String(response).trim() === '') {
      return res.status(400).json({ success: false, message: 'Response cannot be empty' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO chat_history (user_id, message, response, conversation_id, conversation_title) VALUES (?, ?, ?, ?, ?)',
      [
        userId,
        String(message),
        String(response),
        typeof conversationId === 'string' ? conversationId : null,
        typeof conversationTitle === 'string' ? conversationTitle : null,
      ]
    );

    connection.release();

    logger.info(`💬 Chat saved for user ${userId} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: 'Chat message saved successfully',
      data: {
        id: result.insertId,
        userId,
        message: String(message),
        response: String(response),
        conversationId: typeof conversationId === 'string' ? conversationId : null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Save chat error', error.message);
    res.status(500).json({ success: false, message: 'Error saving chat message' });
  }
};

// List conversations (ChatGPT-style sidebar)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const connection = await pool.getConnection();

    const [conversations] = await connection.query(
      `
      SELECT
        conversation_id AS conversationId,
        MAX(conversation_title) AS title,
        MAX(created_at) AS updatedAt,
        MAX(id) AS lastChatId
      FROM chat_history
      WHERE user_id = ? AND conversation_id IS NOT NULL
      GROUP BY conversation_id
      ORDER BY updatedAt DESC
      LIMIT ? OFFSET ?
      `,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const [legacyRows] = await connection.query(
      `
      SELECT
        CONCAT('legacy:', id) AS conversationId,
        LEFT(message, 80) AS title,
        created_at AS updatedAt,
        id AS lastChatId
      FROM chat_history
      WHERE user_id = ? AND conversation_id IS NULL
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const all = [...conversations, ...legacyRows].slice(0, parseInt(limit));
    const lastIds = all.map((c) => c.lastChatId).filter(Boolean);

    let lastMessagesById = new Map();
    if (lastIds.length) {
      const [lastRows] = await connection.query(
        `SELECT id, message FROM chat_history WHERE user_id = ? AND id IN (${lastIds.map(() => '?').join(',')})`,
        [userId, ...lastIds]
      );
      lastMessagesById = new Map(lastRows.map((r) => [r.id, r.message]));
    }

    connection.release();

    const data = all.map((c) => ({
      conversationId: c.conversationId,
      title: c.title || lastMessagesById.get(c.lastChatId) || 'Untitled',
      lastMessage: lastMessagesById.get(c.lastChatId) || '',
      updatedAt: c.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: { conversations: data, limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (error) {
    logger.error('Get conversations error', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving conversations' });
  }
};

// Get one conversation messages
exports.getConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }

    const connection = await pool.getConnection();

    let rows = [];
    if (isLegacyConversationId(conversationId)) {
      const chatId = legacyChatIdFromConversationId(conversationId);
      if (!chatId) {
        connection.release();
        return res.status(400).json({ success: false, message: 'Invalid legacy conversation ID' });
      }
      const [chatRows] = await connection.query(
        'SELECT id, message, response, created_at as createdAt FROM chat_history WHERE user_id = ? AND id = ?',
        [userId, chatId]
      );
      rows = chatRows;
    } else {
      const [chatRows] = await connection.query(
        'SELECT id, message, response, created_at as createdAt FROM chat_history WHERE user_id = ? AND conversation_id = ? ORDER BY created_at ASC',
        [userId, conversationId]
      );
      rows = chatRows;
    }

    connection.release();

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: { conversationId, chats: rows },
    });
  } catch (error) {
    logger.error('Get conversation error', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving conversation' });
  }
};

// Delete a whole conversation
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }

    const connection = await pool.getConnection();

    let result;
    if (isLegacyConversationId(conversationId)) {
      const chatId = legacyChatIdFromConversationId(conversationId);
      if (!chatId) {
        connection.release();
        return res.status(400).json({ success: false, message: 'Invalid legacy conversation ID' });
      }
      [result] = await connection.query('DELETE FROM chat_history WHERE user_id = ? AND id = ?', [userId, chatId]);
    } else {
      [result] = await connection.query(
        'DELETE FROM chat_history WHERE user_id = ? AND conversation_id = ?',
        [userId, conversationId]
      );
    }

    connection.release();

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      deletedCount: result.affectedRows,
    });
  } catch (error) {
    logger.error('Delete conversation error', error.message);
    res.status(500).json({ success: false, message: 'Error deleting conversation' });
  }
};

// Get chat history (legacy, message-level)
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const connection = await pool.getConnection();

    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM chat_history WHERE user_id = ?', [
      userId,
    ]);

    const [chatHistory] = await connection.query(
      'SELECT id, message, response, created_at as createdAt FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, parseInt(limit), parseInt(offset)]
    );

    connection.release();

    logger.info(`📚 Chat history retrieved for user ${userId} (${chatHistory.length} messages)`);

    res.status(200).json({
      success: true,
      message: 'Chat history retrieved successfully',
      data: { total, limit: parseInt(limit), offset: parseInt(offset), chats: chatHistory },
    });
  } catch (error) {
    logger.error('Get chat history error', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving chat history' });
  }
};

// Delete chat message (Only user's own messages)
exports.deleteChatMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Chat ID is required' });
    }

    const connection = await pool.getConnection();

    const [chats] = await connection.query('SELECT id FROM chat_history WHERE id = ? AND user_id = ?', [
      chatId,
      userId,
    ]);

    if (chats.length === 0) {
      connection.release();
      logger.warn(`Unauthorized delete attempt for chat ${chatId} by user ${userId}`);
      return res.status(403).json({ success: false, message: 'You can only delete your own chat messages' });
    }

    await connection.query('DELETE FROM chat_history WHERE id = ?', [chatId]);

    connection.release();

    logger.info(`🗑️ Chat ${chatId} deleted by user ${userId}`);

    res.status(200).json({ success: true, message: 'Chat message deleted successfully' });
  } catch (error) {
    logger.error('Delete chat error', error.message);
    res.status(500).json({ success: false, message: 'Error deleting chat message' });
  }
};

// Clear all chat history for user
exports.clearChatHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM chat_history WHERE user_id = ?', [userId]);
    connection.release();

    logger.info(`🧹 All chat history cleared for user ${userId} (${result.affectedRows} messages)`);

    res.status(200).json({
      success: true,
      message: 'All chat history cleared successfully',
      deletedCount: result.affectedRows,
    });
  } catch (error) {
    logger.error('Clear chat history error', error.message);
    res.status(500).json({ success: false, message: 'Error clearing chat history' });
  }
};

