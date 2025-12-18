from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import logging

from database.connection import SessionLocal
from services.analytics_service import check_and_alert_sla_breaches
from services.email_service import send_sla_breach_alert
from config.settings import settings

logger = logging.getLogger(__name__)

def check_sla_job():
    """
    Scheduled job to check SLA breaches
    """
    print(f"\n{'='*60}")
    print(f"⏰ [SCHEDULED JOB] Running SLA breach check at {datetime.now()}")
    print(f"{'='*60}")
    
    db = SessionLocal()
    try:
        # Check for SLA breaches
        alerts = check_and_alert_sla_breaches(db)
        
        # Send email alerts if enabled
        if settings.enable_alerts and alerts:
            print(f"\n📧 Sending {len(alerts)} alert email(s)...")
            for alert in alerts:
                success = send_sla_breach_alert(settings.alert_email, alert)
                if success:
                    print(f"  ✅ Alert sent for email ID {alert['email_id']}")
                else:
                    print(f"  ❌ Failed to send alert for email ID {alert['email_id']}")
        
        print(f"\n✅ SLA check completed. Found {len(alerts)} breach(es)")
        
    except Exception as e:
        print(f"❌ Error in SLA check job: {e}")
        logger.error(f"Error in SLA check job: {e}")
    finally:
        db.close()
        print(f"{'='*60}\n")

def start_scheduler():
    """
    Start the background scheduler
    """
    scheduler = BackgroundScheduler()
    
    # Run SLA check every 30 minutes
    scheduler.add_job(
        check_sla_job,
        'interval',
        minutes=30,
        id='sla_check_job',
        name='Check SLA Breaches',
        replace_existing=True
    )
    
    # Run immediately on startup
    scheduler.add_job(
        check_sla_job,
        'date',
        run_date=datetime.now(),
        id='sla_check_startup',
        name='Initial SLA Check'
    )
    
    scheduler.start()
    
    print("\n" + "="*60)
    print("⏰ Scheduler started successfully")
    print("="*60)
    print("📅 Scheduled Jobs:")
    print("  - SLA Breach Check: Every 30 minutes")
    print("="*60 + "\n")
    
    return scheduler

# For manual testing
if __name__ == "__main__":
    print("Running manual SLA check...")
    check_sla_job()