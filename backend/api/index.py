"""Vercel serverless entrypoint for FastAPI."""

from app.main import app

# This is required for Vercel's serverless functions to find the FastAPI instance
handler = app
