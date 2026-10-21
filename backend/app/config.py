import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _database_url():
    url = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'banking.db'}")
    # Hosts hand out postgres:// URLs; SQLAlchemy needs the psycopg (v3) driver named.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get("JWT_HOURS", "8")))

    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # Hosts without a shell (e.g. Render's free tier) can't run `flask make-admin`,
    # so users registering with these emails become admins automatically.
    ADMIN_EMAILS = {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}
    # Create the demo users from `flask seed` on startup when the database is empty.
    SEED_DEMO = os.environ.get("SEED_DEMO", "").lower() in {"1", "true", "yes"}

    # Comma-separated list of origins allowed to call the API (only needed when the
    # frontend is hosted on a different domain than the API).
    CORS_ORIGINS = [o for o in os.environ.get("CORS_ORIGINS", "").split(",") if o]

    # Rules carried over from the original CLI project.
    MAX_ACCOUNTS = int(os.environ.get("MAX_ACCOUNTS", "100"))
    MAX_PIN_ATTEMPTS = 5
    PIN_LOCK_MINUTES = 15

    # Built React app, served by Flask in production.
    FRONTEND_DIST = Path(os.environ.get("FRONTEND_DIST", BASE_DIR.parent / "frontend" / "dist"))


class TestConfig(Config):
    TESTING = True
    SEED_DEMO = False
    ADMIN_EMAILS = {"boss@test.dev"}
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-secret-key-that-is-long-enough-for-hs256"
    SECRET_KEY = "test-secret"
