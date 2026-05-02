"""Vercel serverless entrypoint for FastAPI (repo root)."""
import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

from fastapi import FastAPI

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
