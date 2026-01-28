# 🎯 Complete Authentication System Setup Guide

## ✅ What's Already Implemented

Your project has a **complete production-ready authentication system** with:

### Frontend (Next.js + React)
- ✨ Beautiful signup/login pages with validation
- 🔐 JWT token-based authentication
- 📱 Responsive navbar (Login/Signup buttons → Logout button when logged in)
- 🛡️ Protected routes using `withAuth()` HOC
- 💾 localStorage for token persistence
- 🎨 Modern UI with animations

### Backend (Node.js + Express + MySQL)
- 🚀 RESTful API with `/api/auth/signup` and `/api/auth/login`
- 🔒 Password hashing with bcryptjs
- ✅ Input validation (username rules, email format, password strength)
- 📊 MySQL database integration
- 🛡️ Security middleware (helmet, CORS, rate limiting)
- 📝 Request logging and error handling

### Database (MySQL)
- 👥 Users table with secure password storage
- 📈 Chat history table for storing messages
- 🔑 Proper indexes for performance

---

## 🚀 Step-by-Step Setup & Run

### **Step 1: Verify MySQL is Installed**

```bash
mysql --version
```

If not installed, run through MySQL Installer installation process.

---

### **Step 2: Start MySQL Server**

**Option A: Using Command Prompt**
```cmd
net start MySQL80
```

**Option B: Using MySQL Batch Script** (in backend folder)
```cmd
start-mysql.bat
```

Verify MySQL is running:
```bash
mysql -u root -p
# Type your password and you should see mysql>
# Type: exit
```

---

### **Step 3: Create Database & Tables**

Open Command Prompt and navigate to backend:

```cmd
cd "D:\up dated Final_year_Project\backend"
```

Create the database and tables:

```cmd
mysql -u root -p < setup-database.sql
```

When prompted, enter your MySQL root password.

**Verify the database was created:**
```cmd
mysql -u root -p
mysql> USE chatbot_db;
mysql> SHOW TABLES;
```

You should see:
```
+---------------------+
| Tables_in_chatbot_db |
+---------------------+
| chat_history        |
| users               |
+---------------------+
```

---

### **Step 4: Configure Backend Environment**

Edit `D:\up dated Final_year_Project\backend\.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password     # ← Change this to your root password
DB_NAME=chatbot_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
JWT_EXPIRE=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

⚠️ **Important:** Replace `your_mysql_password` with your actual MySQL root password!

---

### **Step 5: Install Backend Dependencies**

```cmd
cd "D:\up dated Final_year_Project\backend"
npm install
```

---

### **Step 6: Start the Backend Server**

From the `backend` folder:

```cmd
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║  🚀 Chatbot Backend Server Running     ║
║  📍 Port: 5000                         ║
║  🔗 http://localhost:5000              ║
║  🔐 Environment: development           ║
║  📝 API Docs: /api                     ║
╚════════════════════════════════════════╝
```

---

### **Step 7: In Another Terminal - Start Frontend**

Open a **new** Command Prompt window:

```cmd
cd "D:\up dated Final_year_Project"
npm install
npm run dev
```

Frontend will start at: **http://localhost:3000**

---

## 🧪 Testing the Authentication Flow

### **Test 1: Signup**
1. Go to http://localhost:3000
2. Click **"Sign Up"** button
3. Fill the form:
   - Username: `john_doe` (3-20 chars, letters/numbers/underscore)
   - Email: `john@example.com`
   - Password: `Pass@123` (uppercase, lowercase, number, special char)
   - Confirm: `Pass@123`
4. Click **"Create Account"**
5. Should redirect to homepage and show username in navbar

### **Test 2: Logout**
1. Click **"Logout"** button in top right
2. Should remove username and show "Login/Sign Up" buttons again

### **Test 3: Login**
1. Click **"Login"** button
2. Enter username: `john_doe`
3. Enter password: `Pass@123`
4. Click **"Login"**
5. Should redirect to homepage and show username

### **Test 4: Protected Route**
1. After login, click **"Chat Bot"** button
2. Should access `/generator` page
3. Try accessing `/generator` without login - should redirect to login page

---

## 📁 Project Structure

```
D:\up dated Final_year_Project\
├── backend/
│   ├── config/
│   │   └── database.js              ← MySQL connection pool
│   ├── controllers/
│   │   └── authController.js        ← Signup/Login logic
│   ├── middleware/
│   │   ├── securityMiddleware.js    ← Rate limiting, validation
│   │   └── validation.js            ← Username/password rules
│   ├── routes/
│   │   └── authRoutes.js            ← /api/auth endpoints
│   ├── .env                         ← Database config (UPDATE THIS!)
│   ├── setup-database.sql           ← Create DB & tables
│   ├── server.js                    ← Main Express app
│   └── package.json
│
├── app/
│   ├── page.js                      ← Home page (navbar with auth buttons)
│   ├── layout.js                    ← Wraps app with AuthProvider
│   ├── signup/page.js               ← Signup form
│   ├── login/page.js                ← Login form
│   └── generator/page.js            ← Protected chat page
│
├── context/
│   ├── AuthContext.jsx              ← Global auth state
│   └── withAuth.jsx                 ← Route protection HOC
│
└── package.json                     ← Frontend dependencies
```

---

## 🔐 Security Features Implemented

✅ **Password Hashing**: bcryptjs with salt rounds=10
✅ **JWT Tokens**: Secure token-based authentication
✅ **Input Validation**: Username & password rules enforced
✅ **Rate Limiting**: Login/signup endpoints limited to prevent brute force
✅ **CORS**: Configured for localhost development
✅ **Helmet**: Security headers configured
✅ **Error Messages**: Generic messages to prevent user enumeration
✅ **SQL Injection Prevention**: Parameterized queries used
✅ **XSS Protection**: React escapes by default

---

## 🐛 Troubleshooting

### **Issue: "Cannot connect to database"**
```
Solution:
1. Verify MySQL is running: net start MySQL80
2. Check DB_PASSWORD in .env matches your MySQL password
3. Verify database exists: mysql -u root -p < setup-database.sql
```

### **Issue: "Cannot find module 'AuthContext'"**
```
Solution:
Make sure context/AuthContext.jsx file exists
Verify file path is exactly: context/AuthContext.jsx
```

### **Issue: "Signup/Login button not working"**
```
Solution:
1. Check backend is running on port 5000
2. Open browser console (F12) for error messages
3. Check .env file has correct DB credentials
4. Check MySQL service is running
```

### **Issue: "Token saved but still shows login button"**
```
Solution:
1. Check browser localStorage: F12 → Application → Local Storage
2. Should see: authToken and user keys
3. Clear cache and refresh page (Ctrl+Shift+Del)
```

### **Issue: "Username already taken" error**
```
Solution:
- This is normal if user already signed up
- Try with different username
- Or clear database and restart: DROP DATABASE chatbot_db;
```

---

## 📊 API Endpoints

### **Signup**
```http
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Pass@123",
  "confirmPassword": "Pass@123"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### **Login**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "Pass@123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### **Health Check**
```http
GET http://localhost:5000/api/health

Response:
{
  "success": true,
  "message": "Server is running",
  "environment": "development",
  "timestamp": "2024-01-27T18:23:57.222Z"
}
```

---

## ✨ Next Steps

1. ✅ Setup database
2. ✅ Configure .env
3. ✅ Start backend
4. ✅ Start frontend
5. ✅ Test signup/login/logout
6. 🔄 Connect chat history endpoints to save/retrieve messages
7. 🚀 Add refresh token mechanism
8. 📦 Deploy to production

---

## 🎓 Password Requirements

For **security**, passwords must contain:
- ✅ Minimum 6 characters
- ✅ At least 1 UPPERCASE letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*)

**Example valid passwords:**
- `Pass@123`
- `MyP@ss456`
- `Secure!99`

**Invalid passwords:**
- `password` (no uppercase, number, special char)
- `Pass123` (no special char)
- `Pass@` (too short)

---

## 📱 Username Requirements

Username must:
- ✅ Be 3-20 characters long
- ✅ Contain only letters, numbers, and underscores
- ✅ Be unique (no duplicate usernames)

**Valid usernames:**
- `john_doe`
- `user123`
- `John_Smith_2024`

**Invalid usernames:**
- `jo` (too short)
- `john-doe` (hyphens not allowed)
- `john doe` (spaces not allowed)

---

## 💡 Tips

- **Save Backend Terminal**: Keep backend running in separate window
- **Check Console**: Use F12 in browser to see any JavaScript errors
- **Check Logs**: Backend console shows request logs and errors
- **Use Incognito**: Test in incognito mode to avoid cache issues
- **Reset Data**: To clear all users, run: `DROP TABLE users;` then recreate

---

## ✅ Checklist Before Going Live

- [ ] MySQL installed and running
- [ ] Database created with tables
- [ ] .env file configured with correct password
- [ ] Backend npm dependencies installed
- [ ] Backend server running on port 5000
- [ ] Frontend npm dependencies installed
- [ ] Frontend running on port 3000
- [ ] Can signup with valid credentials
- [ ] Can login with correct username/password
- [ ] Logout button appears and works
- [ ] Protected routes redirect to login when not authenticated
- [ ] Token persists after page refresh
- [ ] Chat history endpoints connected

---

**🎉 Your authentication system is ready to use!**

For any issues, check the troubleshooting section or review the backend console logs.
