import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv


# Load .env file
load_dotenv()


class Settings(BaseSettings):
    # ============================================
    # APPLICATION CONFIGURATION
    # ============================================
    app_name: str = "Email Monitoring System"
    app_version: str = "1.0.0"
    debug_mode: bool = os.getenv("DEBUG_MODE", "False").lower() == "true"
    
    # ============================================
    # DATABASE CONFIGURATION
    # ============================================
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:Root$123@localhost:3306/emailmoinitor_db"
    )
    
    # ============================================
    # EMAIL CONFIGURATION
    # ============================================
    email_username: str = os.getenv("EMAIL_USERNAME", "")
    email_password: str = os.getenv("EMAIL_PASSWORD", "")
    email_server: str = os.getenv("EMAIL_SERVER", "smtp.gmail.com")
    email_port: int = int(os.getenv("EMAIL_PORT", 587))
    
    # ============================================
    # SLA CONFIGURATION (in hours)
    # ============================================
    default_sla_threshold: float = float(os.getenv("DEFAULT_SLA_THRESHOLD", 4.0))
    critical_sla_threshold: float = float(os.getenv("CRITICAL_SLA_THRESHOLD", 2.0))
    
    # ============================================
    # AUTO-SYNC CONFIGURATION
    # ============================================
    enable_auto_sync: bool = os.getenv("ENABLE_AUTO_SYNC", "false").lower() == "true"
    auto_sync_interval_minutes: int = int(os.getenv("AUTO_SYNC_INTERVAL_MINUTES", 2))
    
    # ============================================
    # ALERT CONFIGURATION
    # ============================================
    alert_email: str = os.getenv("ALERT_EMAIL", "admin@company.com")
    enable_alerts: bool = os.getenv("ENABLE_ALERTS", "True").lower() == "true"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    # ============================================
    # HELPER METHODS
    # ============================================
    
    @property
    def is_production(self) -> bool:
        """Check if running in production (Aiven/cloud database)"""
        return "aivencloud" in self.database_url.lower() or "render" in self.database_url.lower()
    
    @property
    def is_local(self) -> bool:
        """Check if running locally"""
        return "localhost" in self.database_url.lower() or "127.0.0.1" in self.database_url
    
    @property
    def database_host(self) -> str:
        """Extract database host from URL"""
        try:
            # Format: mysql+pymysql://user:pass@host:port/database
            if '@' in self.database_url:
                host_part = self.database_url.split('@')[1]
                return host_part.split('/')[0]  # host:port
            return "unknown"
        except:
            return "unknown"
    
    @property
    def masked_email(self) -> str:
        """Get masked email for display"""
        if '@' in self.email_username:
            parts = self.email_username.split('@')
            return f"{parts[0][:3]}***@{parts[1]}"
        return "***"


settings = Settings()


# ============================================
# CONFIGURATION SUMMARY ON LOAD
# ============================================

def print_settings():
    """Print configuration summary (without sensitive data)"""
    print("\n" + "="*60)
    print(f"⚙️  {settings.app_name} v{settings.app_version}")
    print("="*60)
    
    # Environment
    env_type = "🌍 PRODUCTION" if settings.is_production else "💻 LOCAL"
    print(f"{env_type}")
    
    # Database
    db_indicator = "🔒 SSL" if "aivencloud" in settings.database_url else "🔓 Plain"
    print(f"🗄️  Database: {settings.database_host} {db_indicator}")
    
    # Email
    print(f"📧 Email Server: {settings.email_server}:{settings.email_port}")
    print(f"📧 Email User: {settings.masked_email}")
    
    # SLA
    print(f"⏱️  Default SLA: {settings.default_sla_threshold} hours")
    print(f"⚡ Critical SLA: {settings.critical_sla_threshold} hours")
    
    # Features
    auto_sync_status = "✅ ON" if settings.enable_auto_sync else "❌ OFF"
    alerts_status = "✅ ON" if settings.enable_alerts else "❌ OFF"
    print(f"🔄 Auto-Sync: {auto_sync_status} ({settings.auto_sync_interval_minutes} min)")
    print(f"🚨 Alerts: {alerts_status} → {settings.alert_email}")
    
    # Debug
    debug_status = "⚠️  ENABLED" if settings.debug_mode else "✅ DISABLED"
    print(f"🔧 Debug Mode: {debug_status}")
    
    print("="*60 + "\n")


# Print settings on module load
print_settings()
