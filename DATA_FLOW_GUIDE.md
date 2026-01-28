# 📊 Data Flow Guide - Signup/Login Information

## 🎯 Signup Data Flow

### Step 1: User Enters Information on Signup Page
```
http://localhost:3000/signup

Fill Form:
├── Username: ali
├── Email: ali@test.com
├── Password: Ali@1234
└── Confirm Password: Ali@1234
```

### Step 2: Data is Sent to Backend API
```
POST http://localhost:5000/api/auth/signup

Request Body (JSON):
{
  "username": "ali",
  "email": "ali@test.com",
  "password": "Ali@1234",
  "confirmPassword": "Ali@1234"
}
```

### Step 3: Backend Processes the Data
```
Backend (Express Server - Port 5000):
1. Receives request
2. Validates username format (3-20 chars, letters/numbers/underscore)
3. Validates email format
4. Validates password (uppercase, lowercase, number, special char)
5. Checks if username already exists in database
6. Checks if email already exists in database
7. Hashes the password using bcryptjs
8. Stores user in MySQL database
9. Generates JWT token
10. Sends response back to frontend
```

### Step 4: Backend Response
```
Response from Backend:
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "ali",
    "email": "ali@test.com"
  }
}
```

### Step 5: Frontend Stores Token and Redirects
```
Frontend (Next.js - Port 3000):
1. Receives response
2. Stores token in localStorage: authToken = "eyJhbGc..."
3. Stores user data in localStorage: user = {id: 1, username: "ali", ...}
4. Updates header (shows username and logout button)
5. Redirects to /login page after 2 seconds
```

---

## 🎯 Login Data Flow

### Step 1: User Enters Information on Login Page
```
http://localhost:3000/login

Fill Form:
├── Username: ali
└── Password: Ali@1234
```

### Step 2: Data is Sent to Backend API
```
POST http://localhost:5000/api/auth/login

Request Body (JSON):
{
  "username": "ali",
  "password": "Ali@1234"
}
```

### Step 3: Backend Processes the Data
```
Backend (Express Server - Port 5000):
1. Receives request
2. Validates inputs provided
3. Searches MySQL database for username
4. Finds user record
5. Compares provided password with stored hashed password
6. If match: Generates JWT token
7. If no match: Sends error
8. Sends response back to frontend
```

### Step 4: Backend Response
```
Response from Backend:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "ali",
    "email": "ali@test.com"
  }
}
```

### Step 5: Frontend Stores Token and Redirects
```
Frontend (Next.js - Port 3000):
1. Receives response
2. Stores token in localStorage
3. Stores user data in localStorage
4. Updates header
5. Redirects to / (home page)
6. Home page shows username and logout button
```

---

## 💾 WHERE IS DATA STORED?

### 1️⃣ MySQL Database (Backend Storage)

**Location**: `chatbot_db.users` table

**Check Command**:
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT id, username, email, created_at FROM users;"
```

**Example Output**:
```
id | username | email | created_at
1  | ali      | ali@test.com | 2026-01-28 12:56:29
2  | user123  | user@test.com | 2026-01-28 13:00:45
```

**What's Stored**:
- ✅ id (User ID)
- ✅ username (User's username)
- ✅ email (User's email)
- ✅ password (HASHED - never plain text!)
- ✅ created_at (When account was created)
- ✅ updated_at (When last updated)

---

### 2️⃣ Browser LocalStorage (Frontend Storage)

**Location**: Browser's LocalStorage

**How to Check**:

#### Method 1: Browser DevTools
1. Open browser and press `F12`
2. Go to "Application" tab
3. Click "Local Storage" in left sidebar
4. Click `http://localhost:3000`
5. You'll see:
   - `authToken`: JWT token (long string)
   - `user`: JSON with username, email, id

#### Method 2: Browser Console
```javascript
// Open F12 → Console tab → Type:
console.log(localStorage.getItem('authToken'));
console.log(JSON.parse(localStorage.getItem('user')));
```

**Example Output**:
```
authToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWxpIiwiaWF0IjoxNjc0Nzk2NTg5LCJleHAiOjE2NzU0MDEzODl9.2hGVQR8s...

user: {"id":1,"username":"ali","email":"ali@test.com"}
```

**What's Stored**:
- ✅ authToken (JWT - for authentication)
- ✅ user (Username, email, id)
- ❌ Password (NEVER stored in frontend!)

---

### 3️⃣ Backend Logs (Real-time Monitoring)

**Location**: Terminal where `npm start` is running

**Example Log**:
```
[2026-01-28T12:56:28.243Z] [INFO] 📨 POST /api/auth/signup
[2026-01-28T12:56:29.328Z] [INFO] ✅ New user registered: ali (ID: 1)
::1 - - [28/Jan/2026:12:56:29 +0000] "POST /api/auth/signup HTTP/1.1" 201 289
```

---

## 🔍 HOW TO CHECK DATA - STEP BY STEP

### Check 1: Backend Logs (Real-time)

**Terminal**: Backend terminal (where `npm start` is running)

**What You'll See**:
```
[TIME] [INFO] 📨 POST /api/auth/signup
[TIME] [INFO] ✅ New user registered: ali (ID: 1)
```

**This tells you**:
- ✅ Request received at backend
- ✅ User successfully created
- ✅ ID assigned (1, 2, 3, etc.)

---

### Check 2: MySQL Database

**Method A: Command Line**
```bash
# Open new PowerShell terminal and run:
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT id, username, email FROM users;"
```

**Expected Output**:
```
id | username | email
1  | ali      | ali@test.com
2  | user123  | user@test.com
```

**Method B: MySQL Workbench (if installed)**
1. Open MySQL Workbench
2. Connect to localhost
3. Select `chatbot_db` database
4. Click on `users` table
5. See all user records

---

### Check 3: Browser Storage

**Step 1**: Open browser (http://localhost:3000)
**Step 2**: Press `F12` to open DevTools
**Step 3**: Go to "Application" tab
**Step 4**: Click "Local Storage" → "http://localhost:3000"
**Step 5**: You'll see:

```
Key: authToken
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Key: user
Value: {"id":1,"username":"ali","email":"ali@test.com"}
```

---

### Check 4: Browser Network Tab (API Calls)

**Step 1**: Open browser DevTools (F12)
**Step 2**: Go to "Network" tab
**Step 3**: Do signup/login action
**Step 4**: Look for POST requests:
   - `localhost:5000/api/auth/signup`
   - `localhost:5000/api/auth/login`

**Click on request to see**:
- **Request Headers**: Content-Type, etc.
- **Request Body**: Username, email, password sent
- **Response Body**: Token, user data received
- **Response Code**: 201 (success) or 400/401 (error)

---

## 📋 COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────┐
│  USER FILLS SIGNUP FORM             │
│  ├── Username: ali                  │
│  ├── Email: ali@test.com            │
│  ├── Password: Ali@1234             │
│  └── Confirm: Ali@1234              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  FRONTEND (Next.js - Port 3000)     │
│  ├── Validate inputs locally        │
│  ├── Show error if invalid          │
│  └── Send JSON to backend           │
└──────────────┬──────────────────────┘
               │
     POST /api/auth/signup
               │
               ▼
┌─────────────────────────────────────┐
│  BACKEND (Express - Port 5000)      │
│  ├── Receive JSON request           │
│  ├── Validate again                 │
│  ├── Check username uniqueness      │
│  ├── Check email uniqueness         │
│  ├── Hash password (bcryptjs)       │
│  └── Insert into MySQL              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  MYSQL DATABASE (Port 3306)         │
│  Database: chatbot_db               │
│  Table: users                       │
│  ├── Insert: ali, ali@test.com      │
│  ├── Hash: bcrypt(Ali@1234)         │
│  └── Return: user_id = 1            │
└──────────────┬──────────────────────┘
               │
    Return JWT Token + User Data
               │
               ▼
┌─────────────────────────────────────┐
│  BACKEND RESPONSE                   │
│  {                                  │
│    success: true,                   │
│    token: eyJhbGc...,               │
│    user: {id:1, username: ali}      │
│  }                                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  FRONTEND (Next.js)                 │
│  ├── Store token in localStorage    │
│  ├── Store user in localStorage     │
│  ├── Update header (show logout)    │
│  └── Redirect to /login             │
└─────────────────────────────────────┘
```

---

## 🎯 QUICK DATA CHECK

### After Signup:

**1. Check Backend Logs**
```
Look for: ✅ New user registered: ali (ID: 1)
```

**2. Check Database**
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users WHERE username='ali';"
```

**3. Check Browser Storage (F12 → Application → Local Storage)**
```
authToken: [long JWT token]
user: {"id":1,"username":"ali","email":"ali@test.com"}
```

**4. Check Header**
```
Should show: 👤 ali | Chat Bot | Logout
```

---

### After Login:

**1. Check Backend Logs**
```
Look for: ✅ User logged in: ali (ID: 1)
```

**2. Check Browser Storage**
```
authToken: [new JWT token]
user: [stored user data]
```

**3. Check Page**
```
Should redirect to home page
Header shows username and logout
```

---

## 🔒 PASSWORD STORAGE

### Important: Password is NEVER stored in plain text!

**What's Stored in MySQL**:
```
❌ WRONG: password = "Ali@1234"
✅ RIGHT: password = "$2a$10$abcdefghijklmnopqrstuvwxyz..." (bcrypt hash)
```

**When Login Happens**:
```
1. User enters: "Ali@1234"
2. Backend gets hashed password from database
3. Backend compares using bcrypt.compare()
4. If match → Generate token
5. If no match → Login failed
```

---

## 📊 Data Summary Table

| Data | Signup | Login | Location | Visible |
|------|--------|-------|----------|---------|
| Username | Sent | Sent | MySQL + LocalStorage | Yes |
| Email | Sent | Not sent | MySQL + LocalStorage | Yes |
| Password | Sent (hashed) | Sent (plain, then hashed) | MySQL only | No |
| Token | Generated | Generated | LocalStorage + Header | Partially |
| User ID | Generated | Retrieved | MySQL + LocalStorage | Yes |

---

## ✅ TEST IT NOW

### Step 1: Open DevTools
```
Press: F12 in browser
Go to: Application tab
```

### Step 2: Do Signup
```
1. Go to http://localhost:3000/signup
2. Fill form with: ali / ali@test.com / Ali@1234
3. Click Sign Up
4. Watch the Network tab to see POST request
5. See response with token
```

### Step 3: Check Storage
```
Application → Local Storage → http://localhost:3000
Should show:
- authToken
- user
```

### Step 4: Check Database
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT username, email FROM users;"
```

### Step 5: Check Backend Logs
```
Terminal where "npm start" is running
Should show: ✅ New user registered
```

---

## 🎓 Summary

**Data Flow**:
1. User enters info on frontend
2. Frontend sends to backend API
3. Backend validates and stores in MySQL
4. Backend returns token
5. Frontend stores token and user data locally
6. Header updates with username

**Where to Check**:
- **Database**: `mysql -u root -p chatbot_db`
- **Browser**: DevTools (F12) → Application → Local Storage
- **Logs**: Terminal where backend is running
- **Network**: DevTools (F12) → Network tab → See POST requests

**What's Stored**:
- ✅ MySQL: username, email, hashed password
- ✅ LocalStorage: token, username, email
- ❌ Nowhere: plain text password!

---

**Now you can track all your data! 🎉**
