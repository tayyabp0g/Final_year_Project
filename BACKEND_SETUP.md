# 🚀 Quick Start Guide - Backend Setup

## 1. Database Setup (MySQL)

```sql
-- Open MySQL and run:
CREATE DATABASE IF NOT EXISTS chatbot_db;
USE chatbot_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, created_at)
);
```

## 2. Update .env File

Edit `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=chatbot_db
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development
```

## 3. Start Backend Server

```bash
cd backend
npm start
```

Server will run on: http://localhost:5000

## 4. Test API

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

## 📁 Backend Files Created

```
backend/
├── .env                          ← Update with your DB credentials
├── database.sql                  ← SQL schema
├── server.js                     ← Main server
├── package.json                  ← Dependencies
├── README.md                     ← Full documentation
│
├── config/
│   └── database.js               ← MySQL connection
│
├── controllers/
│   ├── authController.js         ← Signup/Login logic
│   └── chatController.js         ← Chat history logic
│
├── middleware/
│   ├── authMiddleware.js         ← JWT verification
│   └── validation.js             ← Input validation rules
│
└── routes/
    ├── authRoutes.js             ← /api/auth endpoints
    └── chatRoutes.js             ← /api/chat endpoints
```

## 🔐 Username Rules
- 3-20 characters
- Letters, numbers, underscores only
- Must start with letter or underscore
- Examples: `john_doe`, `user123`, `_admin`

## 🔒 Password Rules
- Minimum 6 characters
- 1 Uppercase (A-Z)
- 1 Lowercase (a-z)
- 1 Number (0-9)
- 1 Special (!@#$%^&*)
- Example: `SecurePass123!`

---

**Backend Ready! Now connect it to your frontend.** 🎉
