# 📝 Notes App

> A full-stack notes app with login, image uploads, and admin controls — built with React + FastAPI + MongoDB.

---

## 🤔 What Is This App?

This is a **personal notes app** — like Google Keep, but one you built yourself!

- ✅ Sign up & log in securely
- ✅ Create, edit, and delete your notes
- ✅ Add images to notes
- ✅ Admin users can manage all other users
- ✅ Fast loading with Redis caching

---

## 🧰 Tech Stack

| Layer | Technology | What it does |
|-------|-----------|-------------|
| Frontend | React + Vite | The website UI |
| Styling | Tailwind CSS | Colors, layout, spacing |
| HTTP calls | Axios | Sends requests to the backend |
| Backend | FastAPI (Python) | Handles all the logic |
| Database | MongoDB | Stores notes & users |
| Cache | Redis | Speeds up note loading |
| Auth | JWT + bcrypt | Secure login & password hashing |

---

## 📁 Project Structure

```
notes-app/
├── backend/
│   ├── main.py           # Starts the server, sets up routes
│   ├── auth.py           # Signup, login, user management
│   ├── notes.py          # Create, read, update, delete notes
│   ├── database.py       # MongoDB connection
│   ├── models.py         # Note data shape
│   ├── redis_client.py   # Redis connection (optional)
│   └── requirements.txt  # Python packages needed
│
└── frontend/
    ├── src/
    │   ├── App.jsx       # Main app component
    │   ├── main.jsx      # Entry point
    │   ├── App.css       # Styles
    │   └── index.css     # Tailwind + CSS variables
    ├── index.html
    ├── package.json      # JS packages needed
    └── vite.config.js
```

---

## 🚀 How to Run

### Prerequisites
Make sure you have these installed:
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [Redis](https://redis.io/download) *(optional — app works without it)*

---

### Step 1 — Start MongoDB

```bash
# Mac (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows — search "MongoDB" in Services and click Start
```

### Step 2 — Start Redis *(optional)*

```bash
# Mac
brew services start redis

# Linux
sudo systemctl start redis
```

> ⚠️ Redis is only for caching. The app works perfectly without it.

### Step 3 — Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

✅ Backend runs at: **http://127.0.0.1:8000**  
📄 Auto-generated API docs: **http://127.0.0.1:8000/docs**

### Step 4 — Start the Frontend

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend runs at: **http://localhost:5173**

---

## 🔑 Admin Access

Sign up with **`admin@gmail.com`** to get admin privileges.

| Feature | Regular User | Admin |
|---------|-------------|-------|
| Create / edit / delete own notes | ✅ | ✅ |
| See other users' notes | ❌ | ❌ |
| View all users | ❌ | ✅ |
| Edit or delete users | ❌ | ✅ |
| Auto-delete user's notes on delete | ❌ | ✅ |

---

## ⚙️ How It Works

### Auth Flow
1. You sign up → password gets hashed with **bcrypt** → saved in MongoDB
2. You log in → server checks password → gives you a **JWT token**
3. Every request you make includes that token → server knows who you are

### Notes Flow
1. You create a note → saved in MongoDB under your email
2. When you load notes → app checks **Redis cache** first (fast!)
3. If not cached → fetches from MongoDB → saves to cache for 60 seconds
4. When you edit/delete → cache is cleared so you see fresh data

---

## ❓ Common Errors

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: bcrypt` | Run `pip install bcrypt` |
| Connection refused on port 8000 | Backend not running — do Step 3 |
| Connection refused on port 5173 | Frontend not running — do Step 4 |
| MongoDB connection error | Start MongoDB — see Step 1 |
| Notes not loading after login | Check backend is running on port 8000 |

---

## 📸 API Endpoints

| Method | Route | What it does |
|--------|-------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login & get token |
| GET | `/notes` | Get your notes |
| POST | `/notes` | Create a note |
| PUT | `/notes/{id}` | Update a note |
| DELETE | `/notes/{id}` | Delete a note |
| GET | `/auth/users` | Get all users *(admin only)* |
| PUT | `/auth/users/{id}` | Edit a user *(admin only)* |
| DELETE | `/auth/users/{id}` | Delete a user *(admin only)* |

---

## 🛠️ Built With

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [Tailwind CSS](https://tailwindcss.com/)
