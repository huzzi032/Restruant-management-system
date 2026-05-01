"""Vercel serverless entrypoint for FastAPI."""
import sys
import os

# Add the backend directory to sys.path so 'app' can be imported correctly
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

try:
    from app.main import app
    handler = app
except ImportError as exc:
    # Fallback to a simple app for debugging if import fails
    from fastapi import FastAPI
    app = FastAPI()
    
    # Store error details in a variable that is accessible to the route
    error_details = str(exc)
    current_path = sys.path
    
    @app.get("/")
    def root():
        return {
            "error": "Import failed", 
            "details": error_details, 
            "path": current_path
        }
    handler = app
