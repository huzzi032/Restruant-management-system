import psycopg2
from dotenv import load_dotenv
import os

# Load .env from backend
load_dotenv('backend/.env')

DATABASE_URL = os.getenv("DATABASE_URL")
# Remove +psycopg2 if present for direct psycopg2 connect
if '+psycopg2' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace('+psycopg2', '')

print(f"Connecting to: {DATABASE_URL.split('@')[-1]}")
try:
    connection = psycopg2.connect(DATABASE_URL)
    print("Connection successful!")
    connection.close()
except Exception as e:
    print(f"Connection failed: {e}")
