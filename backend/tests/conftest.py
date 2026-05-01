"""
Pytest conftest — shared in-memory SQLite test database.

Key insight: with sqlite:///:memory:, each engine connection gets its OWN
empty database. To share data between the seed session and the app's test
sessions we must use a SINGLE connection (StaticPool) so all sessions share
the same in-memory instance.
"""
import os
import sys
from pathlib import Path

# ── sys.path ─────────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# ── Environment BEFORE any app module is touched ─────────────────────────────
# Load .env first so GROQ_API_KEY and other secrets are available
try:
    from dotenv import load_dotenv
    load_dotenv(BACKEND_DIR / ".env", override=False)
except ImportError:
    pass  # python-dotenv not installed; rely on system env

os.environ["DATABASE_URL"] = "sqlite:///:memory:"   # always override for tests
os.environ.setdefault("SECRET_KEY", "test-secret-key-1234567890")
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("GROQ_API_KEY", "")

# ── Build a shared StaticPool engine — all connections see the same DB ────────
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

TEST_ENGINE = create_engine(
    "sqlite://",                        # pure in-memory (no file)
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,               # all connections share one DB
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=TEST_ENGINE
)

# ── Import app (triggers model registration, settings, etc.) ──────────────────
from app.main import app                        # noqa: E402
from app.core.database import Base as AppBase   # noqa: E402
from app.core.database import get_db            # noqa: E402

# ── Create tables in the shared test engine ───────────────────────────────────
AppBase.metadata.create_all(bind=TEST_ENGINE)

# ── Seed: default restaurant + admin user ─────────────────────────────────────
from app.core.security import get_password_hash   # noqa: E402
from app.models.restaurant import Restaurant       # noqa: E402
from app.models.user import User, UserRole         # noqa: E402

_db = TestingSessionLocal()
try:
    _rest = Restaurant(name="Test Restaurant", code="test-rest")
    _db.add(_rest)
    _db.flush()
    _db.add(
        User(
            restaurant_id=_rest.id,
            username="testadmin",
            full_name="Test Admin",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_superuser=True,
        )
    )
    _db.commit()
finally:
    _db.close()

# ── Wire FastAPI dependency override ─────────────────────────────────────────
def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
