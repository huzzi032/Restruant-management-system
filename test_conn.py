import psycopg2
from dotenv import load_dotenv
import os

# Load .env from backend
load_dotenv('backend/.env')

DATABASE_URL = (
    os.getenv("DATABASE_POOL_URL")
    or os.getenv("DATABASE_POOLER_URL")
    or os.getenv("SUPABASE_POOLER_URL")
    or os.getenv("DATABASE_URL")
    or os.getenv("POSTGRES_URL")
)

if not DATABASE_URL:
    raise SystemExit("DATABASE_URL is not set. Configure DATABASE_POOL_URL or DATABASE_URL in backend/.env")
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
