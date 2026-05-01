"""Vercel serverless entrypoint for FastAPI."""
import sys
import os

# Add the backend directory to sys.path so 'app' can be imported correctly
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

try:
    from app.main import app
    handler = app
except ImportError as e:
    print(f"Import Error: {e}")
    # Fallback to a simple app for debugging if import fails
    from fastapi import FastAPI
    app = FastAPI()
    @app.get("/")
    def root():
        return {"error": "Import failed", "details": str(e), "path": sys.path}
    handler = app
