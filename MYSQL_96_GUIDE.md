# MySQL 9.6 Setup Guide

## MySQL 9.6 ke liye command:

### Pehle check karo MySQL running hai ya nahi:

```cmd
mysql -u root
```

Agar `mysql>` dikh jaye to **already running hai** - done!

Type: `exit` to quit

---

### Agar MySQL start nahi ho raha:

Try ye commands **Administrator Command Prompt** mein:

**Option 1:**
```cmd
net start MySQL80
```

**Option 2:**
```cmd
net start MySQL
```

**Option 3:**
```cmd
net start mysqld
```

**Option 4:**
```cmd
net start "MySQL Server 9.6"
```

---

### MySQL Service ke naam check karo:

Open **Services** (Windows):
1. Press: `Windows + R`
2. Type: `services.msc`
3. Search for "MySQL" - dekho exact name kya hai
4. Woh name `net start <name>` mein use karo

---

### If still not working:

**Reinstall MySQL 9.6:**

1. Uninstall current MySQL from Control Panel
2. Download MySQL 9.6 from: https://dev.mysql.com/downloads/mysql/
3. Install with:
   - Server type: Development Machine
   - MySQL Port: 3306
   - Username: root
   - Password: (leave empty or set simple one)
   - Service Name: MySQL80 (recommended)

---

### Database Setup (without password):

```cmd
mysql -u root < setup-database-simple.sql
```

Agar password set kiya ho to:

```cmd
mysql -u root -p < setup-database-simple.sql
```

Password enter karo when prompted.

---

### Verify Database Created:

```cmd
mysql -u root
```

Then:
```sql
SHOW DATABASES;
```

Dekho `chatbot_db` hai ya nahi.

---

## Quick Commands:

| Command | Purpose |
|---------|---------|
| `mysql -u root` | Connect to MySQL |
| `exit` | Quit MySQL |
| `net start MySQL80` | Start MySQL service |
| `net stop MySQL80` | Stop MySQL service |
| `mysql -u root < setup-database-simple.sql` | Setup database |
| `sc query MySQL80` | Check MySQL80 service |

---

## Still Having Issues?

1. **Check Windows Event Viewer** for MySQL errors
2. **Reinstall MySQL** completely
3. **Check port 3306** is not in use: `netstat -ano | findstr :3306`
4. **Run scripts as Administrator** always

---

**Once MySQL is working, run:**

```cmd
D:
cd "up dated Final_year_Project"
npm run dev
```

---

Kya specific error message aata hai? Batao exact error! 🚀
