const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ============ SECURITY MIDDLEWARE ============
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(compression());
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));

// ============ BODY PARSING ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ MOCK DATA (In-Memory) ============
let users = [
  {
    id: 1,
    username: 'demo_user',
    email: 'demo@example.com',
    password: '$2a$10$mockhashedpassword123', // hashed "Demo@123"
  }
];

let chatHistory = [
  {
    id: 1,
    user_id: 1,
    message: 'What is Node.js?',
    response: 'Node.js is a JavaScript runtime built on Chromes V8 engine',
    created_at: new Date(),
  }
];

let nextUserId = 2;
let nextChatId = 2;

// ============ JWT & BCRYPT MOCK ============
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ============ ROUTES ============

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Check existing user
    if (users.find(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: nextUserId++,
      username,
      email,
      password: hashedPassword,
    };

    users.push(newUser);

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn: '7d' }
    );

    console.log(`✅ User registered: ${username} (ID: ${newUser.id})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during signup',
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required',
      });
    }

    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${username} (ID: ${user.id})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
    });
  }
});

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key');
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

// Save Chat
app.post('/api/chat/save', verifyToken, (req, res) => {
  try {
    const { message, response } = req.body;
    const userId = req.userId;

    if (!message || !response) {
      return res.status(400).json({
        success: false,
        message: 'Message and response required',
      });
    }

    const chat = {
      id: nextChatId++,
      user_id: userId,
      message,
      response,
      created_at: new Date(),
    };

    chatHistory.push(chat);

    console.log(`💬 Chat saved for user ${userId} (ID: ${chat.id})`);

    res.status(201).json({
      success: true,
      message: 'Chat saved successfully',
      data: chat,
    });
  } catch (error) {
    console.error('Save chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving chat',
    });
  }
});

// Get Chat History
app.get('/api/chat/history', verifyToken, (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const userChats = chatHistory.filter(c => c.user_id === userId);
    const total = userChats.length;
    const chats = userChats
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    console.log(`📚 Chat history retrieved for user ${userId} (${chats.length} messages)`);

    res.status(200).json({
      success: true,
      message: 'Chat history retrieved',
      data: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        chats,
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat history',
    });
  }
});

// Delete Chat
app.delete('/api/chat/:chatId', verifyToken, (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const chatIndex = chatHistory.findIndex(c => c.id === parseInt(chatId) && c.user_id === userId);

    if (chatIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Chat not found or unauthorized',
      });
    }

    chatHistory.splice(chatIndex, 1);

    console.log(`🗑️ Chat ${chatId} deleted by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat',
    });
  }
});

// Clear All Chats
app.delete('/api/chat/', verifyToken, (req, res) => {
  try {
    const userId = req.userId;
    const initialCount = chatHistory.length;

    chatHistory = chatHistory.filter(c => c.user_id !== userId);

    const deletedCount = initialCount - chatHistory.length;

    console.log(`🧹 All chats cleared for user ${userId} (${deletedCount} messages)`);

    res.status(200).json({
      success: true,
      message: 'All chats cleared',
      deletedCount,
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing history',
    });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running (MOCK MODE - No Database)',
    environment: 'development',
    mode: 'mock',
    timestamp: new Date(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ============ SERVER START ============
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Backend Server Running (MOCK MODE) ║
║  📍 Port: ${PORT}                        ║
║  🔗 http://localhost:${PORT}              ║
║  ⚠️  No Database - In-Memory Storage   ║
║  📝 Demo User:                          ║
║     Username: demo_user                 ║
║     Password: Demo@123                  ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
