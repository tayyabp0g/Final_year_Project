# 🚀 PRODUCTION READY BACKEND - Setup Instructions

## ✨ Features Added (Production Ready)

✅ **Security**
- Helmet.js - HTTP header security
- Rate limiting - Prevent brute force attacks
- Input validation & sanitization
- CORS protection
- SQL injection prevention

✅ **Performance**
- Response compression
- Connection pooling
- Optimized queries

✅ **Monitoring**
- Request logging (Morgan)
- Error logging with file persistence
- User activity tracking

✅ **Best Practices**
- Environment variables
- Error handling
- Proper HTTP status codes
- Async/await patterns

---

## 📦 Installed Packages

```json
{
  "express": "API Framework",
  "mysql2": "MySQL driver",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT authentication",
  "dotenv": "Environment variables",
  "cors": "Cross-origin support",
  "helmet": "Security headers",
  "express-rate-limit": "Rate limiting",
  "morgan": "HTTP logging",
  "validator": "Input validation",
  "compression": "Response compression"
}
```

---

## 🔧 SETUP STEPS

### Step 1️⃣: Start MySQL Server

**Windows:**
```powershell
# Option 1: Using Services
net start MySQL80

# Or check if MySQL is running
Get-Service MySQL80

# To stop MySQL
net stop MySQL80
```

**MacOS/Linux:**
```bash
brew services start mysql
# or
sudo systemctl start mysql
```

---

### Step 2️⃣: Create Database & Tables

Open **MySQL Command Line** or **MySQL Workbench** and run:

```sql
-- Create Database
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

-- Indexes
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);

-- Verify
SHOW TABLES;
DESCRIBE users;
DESCRIBE chat_history;
```

---

### Step 3️⃣: Verify .env Configuration

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chatbot_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
NODE_ENV=development
CORS_ORIGIN=*
```

**Important:** Change these values in production!

---

### Step 4️⃣: Start Backend Server

```powershell
cd backend
npm start
```

**Expected Output:**
```
[2026-01-28T06:25:21.334Z] [INFO] ✅ MySQL Database connected successfully
╔════════════════════════════════════════╗
║  🚀 Chatbot Backend Server Running     ║
║  📍 Port: 5000                         ║
║  🔗 http://localhost:5000              ║
║  🔐 Environment: development           ║
║  📝 API Docs: /api                     ║
╚════════════════════════════════════════╝
```

---

## 🔐 Security Features Enabled

### Rate Limiting
- **Signup:** 3 attempts per hour
- **Login:** 5 attempts per 15 minutes
- **Chat:** 20 requests per minute

### Input Sanitization
- Trimmed whitespace
- Lowercase conversion
- Type validation
- SQL injection prevention

### Headers
- XSS Protection
- Content Security Policy
- Click-jacking protection
- Strict Transport Security

---

## 📝 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 📝 **Signup**
```
POST /auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

#### 🔑 **Login**
```
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

### Chat Endpoints (Requires JWT Token)

#### 💾 **Save Chat**
```
POST /chat/save
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "message": "What is Node.js?",
  "response": "Node.js is a JavaScript runtime..."
}
```

#### 📚 **Get History**
```
GET /chat/history?limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

#### 🗑️ **Delete Chat**
```
DELETE /chat/:chatId
Authorization: Bearer <JWT_TOKEN>
```

#### 🧹 **Clear All**
```
DELETE /chat/
Authorization: Bearer <JWT_TOKEN>
```

---

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js              ← MySQL connection
├── controllers/
│   ├── authController.js        ← Auth logic
│   └── chatController.js        ← Chat logic
├── middleware/
│   ├── authMiddleware.js        ← JWT verification
│   ├── validation.js            ← Input validation rules
│   ├── securityMiddleware.js    ← Rate limit & sanitization
│   └── errorHandler.js          ← Error handling
├── routes/
│   ├── authRoutes.js            ← /api/auth
│   └── chatRoutes.js            ← /api/chat
├── utils/
│   └── logger.js                ← Logging system
├── logs/                        ← Log files (auto-created)
├── .env                         ← Configuration
├── database.sql                 ← Schema
├── server.js                    ← Main server
└── package.json
```

---

## 🧪 Testing with cURL

### Test API Health
```bash
curl http://localhost:5000/api/health
```

### Test Signup
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

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

**Response will include JWT token:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### Test Save Chat (Use token from login)
```bash
curl -X POST http://localhost:5000/api/chat/save \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello AI",
    "response": "Hi! How can I help?"
  }'
```

---

## 📊 Logs

Logs are saved in `backend/logs/` with daily files:
- `2026-01-28.log`
- `2026-01-29.log`

Each log entry includes:
- Timestamp
- Level (INFO, ERROR, WARN, DEBUG)
- Message
- User actions

---

## 🚨 Troubleshooting

### ❌ "Database connection failed"
- **Solution:** Start MySQL server
  ```powershell
  net start MySQL80
  ```

### ❌ "Port 5000 already in use"
- **Solution:** Change PORT in `.env` or kill process
  ```powershell
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### ❌ "Cannot find module"
- **Solution:** Install dependencies
  ```bash
  npm install
  ```

### ❌ "Invalid token" on API calls
- **Solution:** Token may be expired, login again

---

## 🎯 Next Steps

1. ✅ Start MySQL
2. ✅ Create database
3. ✅ Update `.env`
4. ✅ Run `npm start`
5. ✅ Connect frontend to backend

---

## 💡 Production Checklist

- [ ] Change JWT_SECRET to secure value
- [ ] Set NODE_ENV=production
- [ ] Update CORS_ORIGIN with frontend URL
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Monitor logs regularly
- [ ] Setup error tracking (Sentry, LogRocket)
- [ ] Rate limiting adjusted for production

---

**Backend is Production Ready! 🚀**
