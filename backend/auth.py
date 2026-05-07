from fastapi import APIRouter, HTTPException, Request
import os
from database import db
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter()

# 🔐 CONFIG
SECRET_KEY = "secret123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 1

users_collection = db["users"]

# 🔐 HASH PASSWORD
def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# 🔐 VERIFY PASSWORD
def verify_password(password: str, hashed: str):
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

# 🔐 CREATE TOKEN
def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 🆕 SIGNUP
@router.post("/signup")
async def signup(user: dict):
    existing = await users_collection.find_one({"email": user["email"]})

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(user["password"])

    admin_email = os.getenv("ADMIN_EMAIL", "admin@gmail.com")
    new_user = {
        "email": user["email"],
        "password": hashed_password,
        "role": "admin" if user["email"] == admin_email else "user",
        "created_at": datetime.utcnow().isoformat()
    }

    result = await users_collection.insert_one(new_user)

    return {"message": "User created successfully"}

# 🔐 LOGIN
@router.post("/login")
async def login(user: dict):
    db_user = await users_collection.find_one({"email": user["email"]})

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(user["password"], db_user["password"]):
        raise HTTPException(status_code=400, detail="Wrong password")

    token = create_token({
        "email": db_user["email"],
        "role": db_user["role"]
    })

    return {
        "access_token": token,
        "role": db_user["role"]
    }

# 🔐 GET CURRENT USER
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = await users_collection.find_one({"email": payload["email"]})
        if not user: return None
        user["_id"] = str(user["_id"])
        return user
    except Exception:
        return None

# 👥 GET ALL USERS (Admin Only)
@router.get("/users")
async def get_all_users(request: Request):
    current_user = await get_current_user(request)
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = []
    async for user in users_collection.find():
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        users.append(user)
    return users

# ✏️ UPDATE USER (Admin Only)
@router.put("/users/{user_id}")
async def update_user(user_id: str, data: dict, request: Request):
    current_user = await get_current_user(request)
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {}
    if "email" in data: update_data["email"] = data["email"]
    if "role" in data: update_data["role"] = data["role"]
    if "password" in data and data["password"]:
        update_data["password"] = hash_password(data["password"])
    
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return {"message": "User updated"}

# 🗑️ DELETE USER (Admin Only)
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    current_user = await get_current_user(request)
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user_to_delete = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    # Cascading delete: delete all notes created by this user
    await db["notes"].delete_many({"author": user_to_delete["email"]})
    
    await users_collection.delete_one({"_id": ObjectId(user_id)})
    return {"message": "User and associated notes deleted"}