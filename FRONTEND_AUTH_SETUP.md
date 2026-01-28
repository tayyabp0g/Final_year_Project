# 🔐 Frontend Authentication Setup Guide

## ✨ What's Been Set Up

### 1. **Authentication Context** (`context/AuthContext.jsx`)
- Global state management for user authentication
- Stores user info and JWT token in localStorage
- Provides `useAuth()` hook for easy access across components

### 2. **Signup Page** (`app/signup/page.js`)
- Beautiful signup form with validation
- Username rules: 3-20 chars, letters/numbers/underscores
- Password requirements: uppercase, lowercase, number, special char
- Real-time error messages
- Auto-redirects to home on success

### 3. **Login Page** (`app/login/page.js`)
- Simple login form
- Username + Password
- Error handling and loading states
- Auto-redirects to home on success

### 4. **Protected Routes** (`context/withAuth.jsx`)
- `withAuth()` HOC for protecting pages
- Automatically redirects to login if not authenticated
- Loading state while checking authentication

### 5. **Updated Home Page** (`app/page.js`)
- Shows "Login/Signup" buttons if NOT logged in
- Shows username and "Logout" button if logged in
- "Chat Bot" button only visible when logged in

### 6. **Updated Generator Page** (`app/generator/page.js`)
- Protected page (requires login)
- Shows logged-in username in sidebar
- Logout button in sidebar

---

## 🚀 How to Use

### For Users

**1. Signup:**
- Go to homepage
- Click "Sign Up"
- Fill form with username, email, password
- Account created automatically

**2. Login:**
- Go to homepage
- Click "Login"
- Enter username and password
- Logged in and redirected to homepage

**3. Use Chatbot:**
- After login, click "Chat Bot" button on homepage
- Generator page loads (protected route)
- Chat with AI

**4. Logout:**
- Click "Logout" button in sidebar or navbar
- Logged out and returned to homepage

---

## 💻 For Developers

### Using the `useAuth()` Hook

```javascript
'use client';
import { useAuth } from '@/context/AuthContext';

export default function MyComponent() {
  const { user, token, signup, login, logout } = useAuth();

  // Check if user is logged in
  if (!token) {
    return <div>Please login first</div>;
  }

  return (
    <div>
      <p>Welcome {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting a Route

```javascript
'use client';
import { withAuth } from '@/context/withAuth';

function ProtectedComponent() {
  return <div>Only logged-in users see this</div>;
}

export default withAuth(ProtectedComponent);
```

### Making API Calls with Token

```javascript
'use client';
import { useAuth } from '@/context/AuthContext';

export default function ChatComponent() {
  const { token } = useAuth();

  const saveChatMessage = async (message, response) => {
    const res = await fetch('http://localhost:5000/api/chat/save', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, response })
    });
    
    const data = await res.json();
    return data;
  };

  return (
    // component code
  );
}
```

---

## 📁 File Structure

```
project/
├── context/
│   ├── AuthContext.jsx          ← Main auth context
│   └── withAuth.jsx             ← Route protection HOC
├── app/
│   ├── layout.js                ← Wrapped with AuthProvider
│   ├── page.js                  ← Updated with auth UI
│   ├── signup/
│   │   └── page.js              ← Signup form
│   ├── login/
│   │   └── page.js              ← Login form
│   └── generator/
│       └── page.js              ← Protected chat page
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────┐
│  User opens app                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  AuthContext checks localStorage    │
│  for saved token                    │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
   Token?      No token?
      │             │
      ▼             ▼
   Show            Show
  "Logout"      "Login/Signup"
   button         buttons
      │             │
      ▼             ▼
 User clicks    User clicks
  logout         signup
      │             │
      ▼             ▼
 Remove token   Show form
 from storage
      │             │
      ▼             ▼
 Redirect to   Submit to
  homepage     /api/auth/signup
      │             │
      │             ▼
      │         Backend validates
      │         & creates user
      │             │
      │             ▼
      │         Returns JWT token
      │             │
      │             ▼
      │         Save token & user
      │         to localStorage
      │             │
      └─────────────┴─────────────►
              │
              ▼
         Redirect to
          homepage
```

---

## 🔐 Backend Integration

Your backend is running at: `http://localhost:5000`

### Endpoints Used by Frontend

1. **POST /api/auth/signup**
   - Send: `{ username, email, password, confirmPassword }`
   - Receive: `{ success, token, user }`

2. **POST /api/auth/login**
   - Send: `{ username, password }`
   - Receive: `{ success, token, user }`

3. **POST /api/chat/save** (with token)
   - Send: `{ message, response }`
   - Receive: `{ success, data }`

4. **GET /api/chat/history** (with token)
   - Receive: `{ success, data: { chats, total } }`

---

## 📝 Important Notes

### ⚠️ Production vs Development

**Development (Current):**
- Backend: `http://localhost:5000`
- Credentials saved in localStorage
- CORS enabled for localhost

**Production:**
```javascript
// Update these in .env or AuthContext:
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Add to AuthContext:
fetch(`${API_URL}/api/auth/signup`, ...);
```

### 🔒 Security Best Practices

1. **Never store sensitive data in localStorage** (only JWT token)
2. **Always validate on backend** (frontend validation is just UX)
3. **Use HTTPS in production** (tokens should only go over HTTPS)
4. **Set secure JWT_SECRET** in backend .env
5. **Implement token refresh** for long sessions

### 🚨 Common Issues

**Issue:** "Cannot find module 'AuthContext'"
- Solution: Make sure `context/AuthContext.jsx` exists

**Issue:** Logout doesn't work
- Solution: Check that `withAuth` HOC is applied to protected pages

**Issue:** Still on login page after login
- Solution: Check browser console for errors, ensure token is saved

---

## ✅ Testing Checklist

- [ ] Signup with new account
- [ ] See validation error for weak password
- [ ] Login with created account
- [ ] See username in navbar
- [ ] See "Logout" button appear
- [ ] Click "Chat Bot" to access generator
- [ ] Click "Logout" in sidebar
- [ ] Confirm logged out (back to signup/login buttons)
- [ ] Try accessing /generator without login (should redirect)

---

## 🎯 Next Steps

1. **Start MySQL & Backend:**
   ```bash
   net start MySQL80
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test signup/login flow**

4. **Connect chat features to save history**

5. **Deploy to production**

---

**Frontend Authentication Ready! 🎉**
