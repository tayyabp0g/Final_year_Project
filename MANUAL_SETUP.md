# 🚀 SIMPLE SETUP - STEP BY STEP

## If Scripts Don't Work - Do This Manually:

### Terminal 1 (Copy-paste these commands):

```cmd
net start MySQL80
cd "D:\up dated Final_year_Project\backend"
mysql -u root < setup-database-simple.sql
npm install
npm start
```

**Expected output:**
```
🚀 Chatbot Backend Server Running
📍 Port: 5000
```

---

### Terminal 2 (Open NEW command prompt):

```cmd
cd "D:\up dated Final_year_Project"
npm install
npm run dev
```

**Expected output:**
```
▲ Next.js
  ready - started server on 0.0.0.0:3000
```

---

### Browser:

Open: http://localhost:3000

---

## If MySQL doesn't start:

### Option A: Check MySQL service name
```cmd
net start MySQL80
```

Agar error aaye to try karo:
```cmd
net start MySQL
```

Ya:
```cmd
net start mysqld
```

### Option B: Check if it's already running
```cmd
mysql -u root
```
If you see `mysql>` - it's already running! Skip the `net start` command

### Option C: MySQL not installed properly
- Reinstall MySQL 9.6 from: https://dev.mysql.com/downloads/mysql/
- Make sure to set username: `root`
- No password (or remember your password)

---

## Test the setup:

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create account: `john_doe` / `john@example.com` / `MyPass@123`
4. Should see username in top-right navbar ✅

---

## Still having issues?

**Check these:**
1. Is MySQL running? `mysql -u root`
2. Is backend running? Look for "Port: 5000"
3. Is frontend running? Look for "Port: 3000"
4. Check browser console (F12) for errors
5. Check backend terminal for error messages

---

**Everything should work now! 🎉**
