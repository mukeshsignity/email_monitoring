import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

def send_email(recipient: str, subject: str, body: str, is_html: bool = False) -> bool:
    """
    Send an email using SMTP
    """
    print(f"\n📤 Sending email:")
    print(f"  To: {recipient}")
    print(f"  Subject: {subject}")
    
    try:
        # Create message
        if is_html:
            msg = MIMEMultipart('alternative')
            msg.attach(MIMEText(body, 'html'))
        else:
            msg = MIMEText(body, 'plain')
        
        msg['Subject'] = subject
        msg['From'] = settings.email_username
        msg['To'] = recipient
        
        # Connect and send
        print(f"  Connecting to {settings.email_server}:{settings.email_port}...")
        
        with smtplib.SMTP(settings.email_server, settings.email_port) as server:
            server.starttls()
            print(f"  Authenticating as {settings.email_username}...")
            server.login(settings.email_username, settings.email_password)
            
            print(f"  Sending message...")
            server.send_message(msg)
            
        print(f"✅ Email sent successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        logger.error(f"Error sending email to {recipient}: {e}")
        return False

def send_sla_breach_alert(recipient: str, breach_info: dict) -> bool:
    """
    Send an SLA breach alert email
    """
    subject = f"⚠️ SLA Breach Alert - {breach_info.get('subject', 'Email')}"
    
    body = f"""
SLA BREACH ALERT

An email has exceeded the SLA threshold and requires immediate attention.

Email Details:
- Subject: {breach_info.get('subject', 'N/A')}
- From: {breach_info.get('sender', 'N/A')}
- Received: {breach_info.get('received_at', 'N/A')}
- Team Member: {breach_info.get('team_member', 'Unassigned')}
- Department: {breach_info.get('department', 'Unassigned')}

Time Details:
- Hours Elapsed: {breach_info.get('hours_elapsed', 0):.2f} hours
- SLA Threshold: {breach_info.get('sla_threshold', 0):.2f} hours
- Exceeded By: {breach_info.get('hours_elapsed', 0) - breach_info.get('sla_threshold', 0):.2f} hours

Please take immediate action to respond to this email.

---
This is an automated alert from Email Monitoring System
"""
    
    return send_email(recipient, subject, body)

def send_daily_report(recipient: str, metrics: dict) -> bool:
    """
    Send daily metrics report
    """
    subject = f"📊 Daily Email Metrics Report - {metrics.get('date', 'Today')}"
    
    body = f"""
DAILY EMAIL METRICS REPORT

Summary:
- Total Emails: {metrics.get('total_emails', 0)}
- Replied: {metrics.get('replied_emails', 0)}
- Pending: {metrics.get('pending_emails', 0)}
- Average Response Time: {metrics.get('avg_response_time', 0):.2f} hours
- SLA Breaches: {metrics.get('sla_breaches', 0)}
- SLA Compliance Rate: {metrics.get('compliance_rate', 0):.2f}%

Top Performers:
{metrics.get('top_performers', 'N/A')}

Attention Required:
{metrics.get('attention_required', 'N/A')}

---
This is an automated report from Email Monitoring System
"""
    
    return send_email(recipient, subject, body)