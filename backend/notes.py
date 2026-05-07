from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from bson import ObjectId
import os
import json
from database import notes_collection
from redis_client import redis_client
from auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Helper to clear cache
def clear_cache(user_email: str):
    try:
        if redis_client:
            redis_client.delete(f"notes_{user_email}")
    except Exception as e:
        print(f"Redis error: {e}")


# CREATE NOTE
@router.post("/notes")
async def create_note(
    title: str = Form(...),
    content: str = Form(...),
    file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    image_path = None

    if file and file.filename:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())
        image_path = file_location

    note = {
        "title": title,
        "content": content,
        "image": image_path,
        "author": current_user["email"]
    }

    result = await notes_collection.insert_one(note)
    note["_id"] = str(result.inserted_id)

    clear_cache(current_user["email"])
    return note


# GET NOTES
@router.get("/notes")
async def get_notes(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    cache_key = f"notes_{current_user['email']}"
    try:
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                print("⚡ From Redis Cache")
                return json.loads(cached)
    except Exception as e:
        print(f"Redis error: {e}")

    notes = []
    async for note in notes_collection.find({"author": current_user["email"]}):
        note["_id"] = str(note["_id"])
        notes.append(note)

    try:
        if redis_client:
            redis_client.set(cache_key, json.dumps(notes), ex=60)
            print("📦 From MongoDB")
    except Exception as e:
        print(f"Redis error: {e}")

    return notes


# UPDATE NOTE
@router.put("/notes/{id}")
async def update_note(
    id: str,
    title: str = Form(...),
    content: str = Form(...),
    file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    update_data = {
        "title": title,
        "content": content
    }

    if file and file.filename:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())
        update_data["image"] = file_location

    result = await notes_collection.update_one(
        {"_id": ObjectId(id), "author": current_user["email"]},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized")

    clear_cache(current_user["email"])
    return {"message": "Updated"}


# DELETE NOTE
@router.delete("/notes/{id}")
async def delete_note(id: str, current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    result = await notes_collection.delete_one({"_id": ObjectId(id), "author": current_user["email"]})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized")

    clear_cache(current_user["email"])
    return {"message": "Deleted"}
