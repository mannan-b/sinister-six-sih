from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_schema_compatibility():
    """Ensure newly added columns exist in sqlite cases table without requiring alembic."""
    from sqlalchemy import text, inspect
    try:
        inspector = inspect(engine)
        if "cases" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("cases")]
            with engine.connect() as conn:
                if "fir_number" not in columns:
                    conn.execute(text("ALTER TABLE cases ADD COLUMN fir_number VARCHAR(100)"))
                if "police_station" not in columns:
                    conn.execute(text("ALTER TABLE cases ADD COLUMN police_station VARCHAR(255)"))
                if "investigating_officer" not in columns:
                    conn.execute(text("ALTER TABLE cases ADD COLUMN investigating_officer VARCHAR(255)"))
                if "officer_rank" not in columns:
                    conn.execute(text("ALTER TABLE cases ADD COLUMN officer_rank VARCHAR(100)"))
                conn.commit()
    except Exception as e:
        print(f"[WARN] Schema compatibility check failed: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
