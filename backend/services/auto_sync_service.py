import threading
import time
from datetime import datetime
from database.connection import SessionLocal
from config.settings import settings

class AutoSyncService:
    def __init__(self):
        self.is_running = False
        self.sync_thread = None
        self.interval_seconds = settings.auto_sync_interval_minutes * 60
        
    def start(self):
        """Start the auto-sync background task"""
        if self.is_running:
            print("⚠️ Auto-sync is already running")
            return False
        
        self.is_running = True
        self.sync_thread = threading.Thread(target=self._sync_loop, daemon=True)
        self.sync_thread.start()
        
        print(f"✅ Auto email sync started (interval: {settings.auto_sync_interval_minutes} minutes)")
        return True
    
    def stop(self):
        """Stop the auto-sync background task"""
        if not self.is_running:
            print("⚠️ Auto-sync is not running")
            return False
        
        self.is_running = False
        print("🛑 Auto email sync stopped")
        return True
    
    def get_status(self):
        """Get current auto-sync status"""
        return {
            "is_running": self.is_running,
            "interval_minutes": settings.auto_sync_interval_minutes,
            "next_sync_in_seconds": self.interval_seconds if self.is_running else None
        }
    
    def _sync_loop(self):
        """Background loop that syncs emails periodically"""
        while self.is_running:
            try:
                db = SessionLocal()
                
                print(f"\n{'='*60}")
                print(f"⏰ Auto-sync triggered at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"{'='*60}")
                
                from services.email_integration_service import sync_all_team_members_gmail
                
                results = sync_all_team_members_gmail(db, limit=10)
                
                print(f"\n✅ Auto-sync completed:")
                print(f"   Members synced: {results['total_members_synced']}")
                print(f"   Emails found: {results['total_emails_found']}")
                print(f"   Emails processed: {results['total_emails_processed']}")
                
                db.close()
                
            except Exception as e:
                print(f"❌ Auto-sync error: {e}")
                import traceback
                traceback.print_exc()
            
            # Wait for next sync
            if self.is_running:
                print(f"\n💤 Sleeping for {settings.auto_sync_interval_minutes} minute(s)...")
                time.sleep(self.interval_seconds)

# Global auto-sync instance
auto_sync_service = AutoSyncService()
