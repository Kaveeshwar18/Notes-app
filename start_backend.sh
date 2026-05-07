#!/bin/bash

# ============================================================
#  Notes App — Quick Start Script
#  Run this from the project root folder
# ============================================================

echo ""
echo "🚀 Notes App Startup"
echo "================================"

# --- BACKEND ---
echo ""
echo "📦 Setting up Backend..."
cd backend

# Install Python dependencies
pip install -r requirements.txt
if [ $? -ne 0 ]; then
  echo "❌ pip install failed. Make sure Python & pip are installed."
  exit 1
fi

echo ""
echo "✅ Backend dependencies installed."
echo "👉 Starting FastAPI server on http://127.0.0.1:8000 ..."
echo "   (Press Ctrl+C to stop, then run frontend manually)"
echo ""

uvicorn main:app --reload --port 8000
