# 🚀 Quick Start Guide - Testing Your Authentication System

## Step 1: Start Both Servers

### Terminal 1 - Backend (Node.js + Express + MySQL)
```bash
cd "d:\up dated Final_year_Project\backend"
npm start
```

**Expected Output**:
```
✅ MySQL Database connected successfully
🚀 Chatbot Backend Server Running     
📍 Port: 5000                        
🔗 http://localhost:5000              
```

### Terminal 2 - Frontend (Next.js React)
```bash
cd "d:\up dated Final_year_Project"
npm run dev
```

**Expected Output**:
```
▲ Next.js 16.0.8 (Turbopack)
- Local:         http://localhost:3000   
✓ Ready in X.Xs
```

---

## Step 2: Test Signup (Create New User)

### Via Browser:
1. Open: http://localhost:3000
2. Click **"Sign Up"** button (blue button in top right)
3. Fill in the form:
   - **Username**: `ali` (or any name following rules: 3-20 chars, letters/numbers/underscore)
   - **Email**: `ali@test.com` (valid email format)
   - **Password**: `Ali@1234` (must have uppercase, lowercase, number, special char)
   - **Confirm Password**: `Ali@1234` (must match)
4. Click **"Create Account"** button
5. See success message: ✅ "Account created successfully! Redirecting..."
6. Redirected to home page

---

## Step 3: Check Header Changes

### After Signup (Logged In):
1. Home page header now shows:
   - **User Display**: 👤 ali (your username)
   - **"Chat Bot"** button (blue)
   - **"Logout"** button (red)

### Before Logout (Not Logged In):
1. Home page header shows:
   - **"Login"** link (text)
   - **"Sign Up"** button (blue)

---

## Step 4: Test Login (Use Existing User)

### Via Browser:
1. First logout by clicking **"Logout"** button
2. Click **"Login"** button on home page
3. Fill in the form:
   - **Username**: `ali`
   - **Password**: `Ali@1234`
4. Click **"Login"** button
5. See success message: ✅ "Login successful! Redirecting..."
6. Header now shows your username and logout option

---

## Step 5: Test Logout

### Via Browser:
1. Click **"Logout"** button (red button with icon)
2. You're redirected to home page
3. Header now shows "Login" and "Sign Up" buttons again
4. localStorage is cleared

---

## ✅ Validation Rules to Remember

### Username Rules:
- ✅ Minimum 3 characters
- ✅ Maximum 20 characters
- ✅ Only letters (A-Z, a-z), numbers (0-9), underscores (_)
- ✅ Must start with letter or underscore
- ❌ Can't start with number
- ❌ Can't contain spaces or special characters

**Valid Examples**: `ali`, `user123`, `test_user`, `_admin`
**Invalid Examples**: `a`, `12user`, `user!`, `test@123`

### Email Rules:
- ✅ Valid email format
- ✅ Must have @ symbol
- ✅ Must have domain

**Valid Examples**: `ali@test.com`, `user@gmail.com`, `admin@domain.co.uk`
**Invalid Examples**: `notanemail`, `@domain.com`, `user@`, `ali.test.com`

### Password Rules:
- ✅ Minimum 6 characters
- ✅ At least one UPPERCASE letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*)

**Valid Examples**: `Ali@1234`, `Secure#Pass123`, `Test@999`
**Invalid Examples**: `ali1234` (no uppercase), `ALI1234` (no lowercase), `Ali1234` (no special char), `Ali@1` (too short)

---

## 🔄 Complete Test Flow

```
1. Home Page (No Auth)
   ↓
2. Click "Sign Up"
   ↓
3. Fill signup form with: ali / ali@test.com / Ali@1234
   ↓
4. Account created ✅
   ↓
5. Redirected to Home (Logged In)
   ↓
6. Header shows: 👤 ali, Chat Bot, Logout
   ↓
7. Click "Logout"
   ↓
8. Redirected to Home (Not Logged In)
   ↓
9. Header shows: Login, Sign Up
   ↓
10. Click "Login"
    ↓
11. Fill login form with: ali / Ali@1234
    ↓
12. Login successful ✅
    ↓
13. Redirected to Home (Logged In)
    ↓
14. Header shows: 👤 ali, Chat Bot, Logout
```

---

## 🐛 Troubleshooting

### Issue: "Unable to connect to backend"
**Solution**: Make sure backend is running on port 5000
```bash
cd backend
npm start
```

### Issue: "Port 3000 already in use"
**Solution**: Kill the process on port 3000 or use a different port
```bash
# Find process: Get-Process -Name node
# Kill process: Stop-Process -Id <PID>
```

### Issue: "MySQL connection failed"
**Solution**: Make sure MySQL 9.6 is running and credentials match `.env`
- Check: `mysql -u root -pTayyabs070@ -e "SHOW DATABASES;"`

### Issue: "Validation error on signup"
**Solution**: Make sure password meets all requirements:
- Has uppercase letter
- Has lowercase letter  
- Has number
- Has special character
- At least 6 characters long

### Issue: Username already taken
**Solution**: Use a different username. Signup with a new unique username.

---

## 📱 Testing on Different Devices

### Mobile Browser:
1. Use `http://192.168.56.1:3000` (Network IP shown in terminal)
2. Or use browser's responsive design mode (F12)
3. Layout should be responsive

### Desktop:
1. Use `http://localhost:3000`
2. All features should work normally

---

## 💾 Data Storage

### Frontend (Browser):
- **Token**: Stored in `localStorage` as `authToken`
- **User Info**: Stored in `localStorage` as `user` (JSON)
- Cleared on logout

### Backend (MySQL Database):
- **Users Table**: Stores username, email, hashed password
- **Chat History Table**: Stores future chat messages

---

## 🔐 Security Features

✅ **Password Hashing**: bcryptjs (10 salt rounds)
✅ **JWT Tokens**: Expire after 7 days
✅ **Input Validation**: Strict rules on frontend and backend
✅ **SQL Injection Prevention**: Parameterized queries
✅ **CORS**: Enabled for localhost:3000
✅ **Helmet**: Security headers enabled
✅ **Rate Limiting**: API rate limits enabled

---

## 📊 API Testing (Advanced)

### Test Signup via PowerShell:
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "Test@123"
    confirmPassword = "Test@123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/signup" `
    -Method Post -ContentType "application/json" -Body $body
```

### Test Login via PowerShell:
```powershell
$body = @{
    username = "testuser"
    password = "Test@123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $body
```

---

## ✨ Features Verified

- ✅ Signup with validation
- ✅ Login with credentials
- ✅ Logout functionality
- ✅ Header updates based on auth state
- ✅ Token storage in localStorage
- ✅ Password hashing
- ✅ MySQL integration
- ✅ Beautiful UI with animations
- ✅ Responsive design
- ✅ Error handling

---

## 🎉 You're All Set!

Your authentication system is fully functional. Start both servers and test the signup/login flow!

**Backend**: `http://localhost:5000`
**Frontend**: `http://localhost:3000`

Good luck! 🚀
