from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from api.routes import router
from config.settings import settings
from database.connection import init_db
from services.auto_sync_service import auto_sync_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # ============================================================
    # STARTUP
    # ============================================================
    print("\n" + "="*60)
    print("🚀 Starting Email Monitoring System")
    print("="*60)
    
    try:
        # Initialize database
        print("📊 Initializing database...")
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        raise
    
    # Auto-sync startup
    if settings.enable_auto_sync:
        print(f"\n📧 Auto-sync is ENABLED in settings")
        print(f"⏱️  Sync interval: {settings.auto_sync_interval_minutes} minute(s)")
        try:
            auto_sync_service.start()
            print(f"✅ Auto-sync started successfully")
        except Exception as e:
            print(f"⚠️  Failed to start auto-sync: {e}")
    else:
        print(f"\n📧 Auto-sync is DISABLED in settings")
        print(f"💡 You can enable it via API: POST /api/auto-sync/start/")
    
    print("="*60 + "\n")
    
    yield
    
    # ============================================================
    # SHUTDOWN
    # ============================================================
    print("\n" + "="*60)
    print("🛑 Shutting down Email Monitoring System")
    print("="*60)
    
    # Stop auto-sync
    if auto_sync_service.is_running:
        print("⏸️  Stopping auto-sync service...")
        auto_sync_service.stop()
        print("✅ Auto-sync stopped")
    
    print("👋 Shutdown complete")
    print("="*60 + "\n")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Email monitoring system to track response times and SLA compliance",
    lifespan=lifespan
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Update this in production to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API router
app.include_router(router, prefix="/api", tags=["Email Monitoring"])


@app.get("/")
async def root():
    """
    Root endpoint - API health check
    """
    auto_sync_status = auto_sync_service.get_status()
    
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "status": "running",
        "auto_sync": {
            "enabled": auto_sync_status["is_running"],
            "interval_minutes": auto_sync_status["interval_minutes"]
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "endpoints": {
            "departments": "/api/departments/",
            "team_members": "/api/team-members/",
            "emails": "/api/emails/",
            "metrics": "/api/metrics/",
            "sla_breaches": "/api/sla/breaches/",
            "alerts": "/api/alerts/",
            "auto_sync_control": "/api/auto-sync/"
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    auto_sync_status = auto_sync_service.get_status()
    
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "database": "connected",
        "auto_sync": {
            "running": auto_sync_status["is_running"],
            "interval_minutes": auto_sync_status["interval_minutes"]
        }
    }


@app.get("/status")
async def system_status():
    """
    Detailed system status endpoint
    """
    auto_sync_status = auto_sync_service.get_status()
    
    return {
        "system": {
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "operational"
        },
        "features": {
            "email_monitoring": True,
            "sla_tracking": True,
            "auto_sync": auto_sync_status["is_running"],
            "alerts": settings.enable_alerts
        },
        "auto_sync": {
            "enabled": auto_sync_status["is_running"],
            "interval_minutes": auto_sync_status["interval_minutes"],
            "enabled_in_settings": settings.enable_auto_sync
        },
        "database": {
            "type": "MySQL",
            "status": "connected"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🔥 Running in DEVELOPMENT mode")
    print("="*60)
    print(f"📍 App Name: {settings.app_name}")
    print(f"📍 Version: {settings.app_version}")
    print("="*60)
    print("📚 API Documentation:")
    print("   - Swagger UI: http://localhost:8000/docs")
    print("   - ReDoc: http://localhost:8000/redoc")
    print("="*60)
    print("🔗 Endpoints:")
    print("   - Health Check: http://localhost:8000/health")
    print("   - System Status: http://localhost:8000/status")
    print("   - Departments: http://localhost:8000/api/departments/")
    print("   - Team Members: http://localhost:8000/api/team-members/")
    print("   - Emails: http://localhost:8000/api/emails/")
    print("   - Metrics: http://localhost:8000/api/metrics/team-members/")
    print("   - Auto-Sync: http://localhost:8000/api/auto-sync/status/")
    print("="*60)
    print(f"📧 Auto-Sync: {'ENABLED' if settings.enable_auto_sync else 'DISABLED'}")
    if settings.enable_auto_sync:
        print(f"⏱️  Interval: {settings.auto_sync_interval_minutes} minute(s)")
    print("="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
