"""Vercel serverless entrypoint for FastAPI."""
import sys
import os

# Add the current directory to sys.path
sys.path.append(os.path.dirname(__file__))
# Add the repo root to sys.path so 'backend' can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

try:
    from backend.app.main import app
    handler = app
except ImportError as exc:
    from fastapi import FastAPI
    app = FastAPI()
    error_msg = str(exc)
    @app.get("/")
    def root():
        return {"error": "Module import failed", "details": error_msg}
    handler = app
