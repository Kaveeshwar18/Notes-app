# 📝 Notes App — Setup & Run Guide

## 📁 Folder Structure
```
notes-app/
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── notes.py          ← FIXED (Redis null-safe)
│   ├── database.py
│   ├── models.py
│   ├── redis_client.py   ← FIXED (safe fallback if Redis offline)
│   └── requirements.txt  ← FIXED (added bcrypt)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── App.css
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## ✅ What Was Fixed

| File | Issue | Fix |
|------|-------|-----|
| `requirements.txt` | Missing `bcrypt` package | Added `bcrypt` explicitly |
| `redis_client.py` | Crashes app if Redis not running | Added try/catch with `None` fallback |
| `notes.py` | `redis_client.delete/get/set` called on `None` | Added `if redis_client:` guards |

---

## 🚀 How to Run

### Step 1 — Start MongoDB
```bash
# Linux/Mac (systemd)
sudo systemctl start mongod

# Mac (Homebrew)
brew services start mongodb-community

# Windows
# Start "MongoDB" from Services or run: mongod
```

### Step 2 — Start Redis (Optional)
Redis is used for caching. The app works fine without it.
```bash
# Linux/Mac (systemd)
sudo systemctl start redis

# Mac (Homebrew)
brew services start redis
```

### Step 3 — Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend runs at: **http://127.0.0.1:8000**

### Step 4 — Start Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## 🧪 Test the App

1. Open **http://localhost:5173**
2. Click **Sign Up** — use `admin@gmail.com` to get admin role, any other email for regular user
3. Log in and create, edit, delete notes
4. Admin users see an **Admin** button to manage users (CRUD)

---

## 🔑 Admin Access
- Email: `admin@gmail.com`
- Password: anything you choose at signup
- Grants access to User Management panel (view, edit, delete users)

---

## ❓ Common Errors

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: bcrypt` | Run `pip install bcrypt` |
| `Connection refused` on port 8000 | Backend not running — run uvicorn |
| `Connection refused` on port 5173 | Frontend not running — run `npm run dev` |
| `MongoDB connection error` | Start MongoDB service |
| Notes not loading after login | Check backend is running and CORS allows port 5173 |
