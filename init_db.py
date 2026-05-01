from dotenv import load_dotenv
import os
import sys

# Load .env from backend directory
load_dotenv('backend/.env')

# Add backend to path
sys.path.append(os.path.abspath('backend'))

from app.core.database import init_db
from app.core.config import settings

print(f"Initializing database at: {settings.DATABASE_URL[:60]}...")
try:
    init_db()
    print("Database initialization complete!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error initializing database: {e}")
    sys.exit(1)
