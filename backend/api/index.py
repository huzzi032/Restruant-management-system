"""Vercel serverless entrypoint for FastAPI."""
import sys
import os

# Add the backend directory to sys.path so 'app' can be imported correctly
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI

# Default app so Vercel can always detect a top-level entrypoint.
app = FastAPI()

try:
    from app.main import app as real_app
    app = real_app
except ImportError as exc:
    error_details = str(exc)
    current_path = sys.path

    @app.get("/")
    def root():
        return {
            "error": "Import failed",
            "details": error_details,
            "path": current_path,
        }

# Explicit aliases for the Vercel runtime.
handler = app
application = app
