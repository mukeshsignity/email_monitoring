from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from database.models import Base
from config.settings import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database engine
print(f"🔗 Connecting to database: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'database'}")

try:
    engine = create_engine(
        settings.database_url,
        echo=settings.debug_mode,  # Set to True to see SQL queries
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,  # Recycle connections after 1 hour
    )
    print("✅ Database engine created successfully")
except Exception as e:
    print(f"❌ Error creating database engine: {e}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency function to get database session
    Usage in FastAPI endpoints: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    print("📊 Database session created")
    try:
        yield db
    finally:
        db.close()
        print("📊 Database session closed")

def init_db():
    """
    Initialize database - create all tables
    """
    try:
        print("🔧 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Print all created tables
        print("\n📋 Created tables:")
        for table in Base.metadata.sorted_tables:
            print(f"  - {table.name}")
        
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise

def drop_all_tables():
    """
    Drop all tables - use with caution!
    """
    try:
        print("⚠️  Dropping all database tables...")
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped successfully")
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        raise