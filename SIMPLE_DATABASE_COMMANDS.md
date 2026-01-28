# 🖥️ Terminal Commands - Database Ko Directly Dekho

## 📍 Step 1: Naya Terminal Kholo

1. **Windows Key + R** dabao
2. **"cmd"** type karo
3. **Enter** press karo
4. Naya black terminal khul jayega

OR

1. VS Code mein **Ctrl + ~** dabao
2. Naya terminal khul jayega

---

## 🎯 Simple Commands

### Command 1: Database List Dekho
```bash
mysql -u root -pTayyabs070@ -e "SHOW DATABASES;"
```

**Run karna:**
1. Terminal mein paste karo
2. Enter press karo

**Output:**
```
Database
information_schema
mysql
performance_schema
chatbot_db      ← YEH HAMARA DATABASE HAI!
```

---

### Command 2: Users Table Dekho
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users;"
```

**Run karna:**
1. Terminal mein paste karo
2. Enter press karo

**Output Example:**
```
id | username | email | password | created_at
1  | ali      | ali@test.com | $2a$10$... | 2026-01-28 12:56:29
```

---

### Command 3: Sirf Username aur Email Dekho
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT id, username, email FROM users;"
```

**Output:**
```
id | username | email
1  | ali      | ali@test.com
2  | user123  | user@test.com
```

---

### Command 4: Kittne Users Hain Dekho
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT COUNT(*) as total_users FROM users;"
```

**Output:**
```
total_users
2
```

---

### Command 5: Ek Specific User Dekho
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users WHERE username='ali';"
```

**Output:**
```
id | username | email | password | created_at
1  | ali      | ali@test.com | $2a$10$... | 2026-01-28 12:56:29
```

---

## 📋 COMMAND BREAKDOWN

### Command:
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users;"
```

### Matlab:
```
mysql              = MySQL program (database ke liye)
-u root            = username "root"
-pTayyabs070@      = password "Tayyabs070@" (P ke sath space nahi hota!)
-e "..."           = execute command
USE chatbot_db     = chatbot_db database select karo
SELECT * FROM users = users table se sab kuch dikha do
```

---

## 🎬 LIVE EXAMPLE

### Step 1: Terminal Kholo
```
Start Menu → cmd → Open
```

### Step 2: Yeh Command Paste Karo
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users;"
```

### Step 3: Enter Press Karo
```
Output dikhe ga:
id | username | email | password (hashed) | created_at
```

---

## 📊 COMMON COMMANDS

| Command | Kya Dikhayi Dega |
|---------|-----------------|
| `SHOW DATABASES;` | Sab databases |
| `USE chatbot_db;` | Yeh database select karo |
| `SHOW TABLES;` | Sab tables (users, chat_history) |
| `SELECT * FROM users;` | Sab users ka pura data |
| `SELECT COUNT(*);` | Kitne users hain |
| `SELECT * FROM users WHERE username='ali';` | Sirf "ali" ka data |
| `DELETE FROM users WHERE username='ali';` | User delete karo |

---

## 🔥 BEST COMMANDS (EASIEST)

### Sabse Asaan - Sirf Username aur Email Dekho
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT id, username, email, created_at FROM users;"
```

**Output:**
```
id | username | email | created_at
1  | ali      | ali@test.com | 2026-01-28 12:56:29
2  | user123  | user@test.com | 2026-01-28 13:00:00
```

---

### Meri Profile - Ek Specific User
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users WHERE username='ali';"
```

---

### Total Users Count
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT COUNT(*) as 'Total Users' FROM users;"
```

---

## ⚡ SHORTCUTS - COPY PASTE KAR

### 1️⃣ Sab Users Dekho
```
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT id, username, email FROM users;"
```

### 2️⃣ Kitne Users Hain
```
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT COUNT(*) as total FROM users;"
```

### 3️⃣ Ek User Dekho
```
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users WHERE username='ali';"
```

### 4️⃣ Chat History Dekho
```
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM chat_history;"
```

### 5️⃣ Tables List Dekho
```
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SHOW TABLES;"
```

---

## 🎓 STEP BY STEP EXAMPLE

### Scenario: Ali ko Signup Kiya

#### Step 1: Terminal Kholo
```
Windows: Start → cmd
Mac: Terminal app
Linux: Ctrl + Alt + T
```

#### Step 2: Yeh Command Run Karo
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT * FROM users;"
```

#### Step 3: Output Dekhoge
```
id | username | email | password | created_at
1  | ali      | ali@test.com | $2a$10$abcde... | 2026-01-28 12:56:29
```

#### Matlab:
```
✅ ali successfully database mein save hua!
✅ ID = 1
✅ Email = ali@test.com
✅ Password = hashed (original password nahi!)
✅ Time = 2026-01-28 12:56:29
```

---

## 🛠️ MYSQL INTERACTIVE MODE (Advanced)

### Agar Barabara Commands Dalni Hain:

#### Step 1: MySQL Shell Kholo
```bash
mysql -u root -pTayyabs070@ chatbot_db
```

#### Step 2: Ab Commands Type Karo (ek ek)
```bash
SHOW TABLES;
SELECT * FROM users;
SELECT COUNT(*) FROM users;
EXIT;
```

#### Output:
```
mysql> SHOW TABLES;
Tables_in_chatbot_db
users
chat_history

mysql> SELECT * FROM users;
(users ka data dikhe ga)

mysql> EXIT;
(terminal band hoga)
```

---

## 📝 IMPORTANT NOTES

### Password Format
```
❌ WRONG: mysql -u root - p Tayyabs070@ (space ho)
✅ RIGHT: mysql -u root -pTayyabs070@ (space nahi)
```

### Command Structure
```
mysql [OPTIONS] -e "SQL COMMAND"

-u     = Username
-p     = Password (immediately after -p, no space)
-e     = Execute command
chatbot_db = Database name (optional, USE mein de sakte ho)
```

---

## 🎯 FINAL CHEAT SHEET

```
┌─────────────────────────────────────────────┐
│ COMMAND                                     │
├─────────────────────────────────────────────┤
│ mysql -u root -pTayyabs070@ -e             │
│ "USE chatbot_db; SELECT * FROM users;"      │
└─────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────┐
│ OUTPUT                                      │
├─────────────────────────────────────────────┤
│ id | username | email | password | date    │
│ 1  | ali      | ali@test.com | $2a$... │ 2026...│
└─────────────────────────────────────────────┘
```

---

## ✅ TEST NOW

### Copy-Paste Karo:
```bash
mysql -u root -pTayyabs070@ -e "USE chatbot_db; SELECT id, username, email FROM users;"
```

### Aur Dekho Output!

---

**Ab samajh gaye na? 🎉 Terminal se directly database dekh sakte ho!**
