from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database.models import Email, TeamMember, Department, Alert
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

def log_email_received(
    db: Session,
    sender: str,
    recipient: str,
    subject: str,
    body: str,
    team_member_id: Optional[int] = None,
    is_client_email: bool = True
) -> Email:
    """
    Log a received email in the database
    """
    print(f"\n📧 Logging new email:")
    print(f"  From: {sender}")
    print(f"  To: {recipient}")
    print(f"  Subject: {subject}")
    
    try:
        # Get department from team member if provided
        department_id = None
        if team_member_id:
            team_member = db.query(TeamMember).filter(TeamMember.id == team_member_id).first()
            if team_member:
                department_id = team_member.department_id
                print(f"  Assigned to: {team_member.name} ({team_member.department.name})")
        
        email = Email(
            sender=sender,
            recipient=recipient,
            subject=subject,
            body=body,
            team_member_id=team_member_id,
            department_id=department_id,
            received_at=datetime.utcnow(),
            is_client_email=is_client_email,
            is_replied=False
        )
        
        db.add(email)
        db.commit()
        db.refresh(email)
        
        print(f"✅ Email logged successfully (ID: {email.id})")
        return email
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error logging email: {e}")
        logger.error(f"Error logging email: {e}")
        raise

def log_email_reply(db: Session, email_id: int) -> Email:
    """
    Mark an email as replied and calculate response time
    """
    print(f"\n📩 Marking email {email_id} as replied")
    
    try:
        email = db.query(Email).filter(Email.id == email_id).first()
        
        if not email:
            print(f"❌ Email {email_id} not found")
            raise ValueError(f"Email {email_id} not found")
        
        if email.is_replied:
            print(f"⚠️  Email {email_id} already marked as replied")
            return email
        
        # Calculate response time
        replied_at = datetime.utcnow()
        response_time = (replied_at - email.received_at).total_seconds() / 3600  # hours
        
        email.is_replied = True
        email.replied_at = replied_at
        email.response_time_hours = response_time
        
        # Check SLA breach
        sla_threshold = 4.0  # default
        if email.department_id:
            department = db.query(Department).filter(Department.id == email.department_id).first()
            if department:
                sla_threshold = department.sla_threshold_hours
        
        email.is_sla_breach = response_time > sla_threshold
        
        db.commit()
        db.refresh(email)
        
        print(f"✅ Email replied:")
        print(f"  Response time: {response_time:.2f} hours")
        print(f"  SLA threshold: {sla_threshold:.2f} hours")
        print(f"  SLA breach: {'YES ⚠️' if email.is_sla_breach else 'NO ✅'}")
        
        return email
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error marking email as replied: {e}")
        logger.error(f"Error marking email as replied: {e}")
        raise

def get_department_metrics(db: Session, department_id: Optional[int] = None) -> List[Dict]:
    """
    Get metrics for departments
    """
    print(f"\n📊 Calculating department metrics...")
    
    try:
        query = db.query(
            Department.id.label('department_id'),
            Department.name.label('department_name'),
            Department.sla_threshold_hours,
            func.count(Email.id).label('total_emails'),
            func.sum(func.cast(Email.is_replied, Integer)).label('replied_emails'),
            func.avg(Email.response_time_hours).label('avg_response_time'),
            func.sum(func.cast(Email.is_sla_breach, Integer)).label('sla_breaches')
        ).outerjoin(Email, Department.id == Email.department_id).group_by(Department.id)
        
        if department_id:
            query = query.filter(Department.id == department_id)
        
        results = query.all()
        
        metrics = []
        for result in results:
            total = result.total_emails or 0
            replied = result.replied_emails or 0
            pending = total - replied
            sla_breaches = result.sla_breaches or 0
            
            compliance_rate = ((total - sla_breaches) / total * 100) if total > 0 else 100.0
            
            metric = {
                'department_id': result.department_id,
                'department_name': result.department_name,
                'total_emails': total,
                'replied_emails': replied,
                'pending_emails': pending,
                'average_response_time': round(result.avg_response_time, 2) if result.avg_response_time else None,
                'sla_breaches': sla_breaches,
                'sla_compliance_rate': round(compliance_rate, 2),
                'sla_threshold_hours': result.sla_threshold_hours
            }
            metrics.append(metric)
            
            print(f"\n  {result.department_name}:")
            print(f"    Total: {total}, Replied: {replied}, Pending: {pending}")
            print(f"    Avg Response: {metric['average_response_time']} hrs")
            print(f"    SLA Compliance: {compliance_rate:.2f}%")
        
        return metrics
        
    except Exception as e:
        print(f"❌ Error calculating department metrics: {e}")
        logger.error(f"Error calculating department metrics: {e}")
        raise

def get_team_member_metrics(db: Session, team_member_id: Optional[int] = None) -> List[Dict]:
    """
    Get metrics for team members
    """
    print(f"\n👥 Calculating team member metrics...")
    
    try:
        query = db.query(
            TeamMember.id.label('team_member_id'),
            TeamMember.name.label('team_member_name'),
            TeamMember.email.label('team_member_email'),
            Department.name.label('department_name'),
            func.count(Email.id).label('total_emails'),
            func.sum(func.cast(Email.is_replied, Integer)).label('replied_emails'),
            func.avg(Email.response_time_hours).label('avg_response_time'),
            func.sum(func.cast(Email.is_sla_breach, Integer)).label('sla_breaches')
        ).join(Department, TeamMember.department_id == Department.id
        ).outerjoin(Email, TeamMember.id == Email.team_member_id
        ).filter(TeamMember.is_active == True
        ).group_by(TeamMember.id)
        
        if team_member_id:
            query = query.filter(TeamMember.id == team_member_id)
        
        results = query.all()
        
        metrics = []
        for result in results:
            total = result.total_emails or 0
            replied = result.replied_emails or 0
            pending = total - replied
            sla_breaches = result.sla_breaches or 0
            
            compliance_rate = ((total - sla_breaches) / total * 100) if total > 0 else 100.0
            
            metric = {
                'team_member_id': result.team_member_id,
                'team_member_name': result.team_member_name,
                'team_member_email': result.team_member_email,
                'department_name': result.department_name,
                'total_emails': total,
                'replied_emails': replied,
                'pending_emails': pending,
                'average_response_time': round(result.avg_response_time, 2) if result.avg_response_time else None,
                'sla_breaches': sla_breaches,
                'sla_compliance_rate': round(compliance_rate, 2)
            }
            metrics.append(metric)
            
            print(f"\n  {result.team_member_name} ({result.department_name}):")
            print(f"    Total: {total}, Replied: {replied}, Pending: {pending}")
            print(f"    Avg Response: {metric['average_response_time']} hrs")
            print(f"    SLA Compliance: {compliance_rate:.2f}%")
        
        return metrics
        
    except Exception as e:
        print(f"❌ Error calculating team member metrics: {e}")
        logger.error(f"Error calculating team member metrics: {e}")
        raise

def get_sla_breaches(db: Session, include_pending: bool = True) -> List[Dict]:
    """
    Get all SLA breaches (including potential breaches for unreplied emails)
    """
    print(f"\n⚠️  Checking SLA breaches...")
    
    try:
        breaches = []
        
        # Get confirmed breaches (replied but exceeded SLA)
        confirmed_breaches = db.query(Email).filter(
            Email.is_sla_breach == True
        ).all()
        
        for email in confirmed_breaches:
            breach_info = {
                'email_id': email.id,
                'subject': email.subject,
                'sender': email.sender,
                'recipient': email.recipient,
                'team_member_name': email.team_member.name if email.team_member else None,
                'department_name': email.department.name if email.department else None,
                'received_at': email.received_at,
                'replied_at': email.replied_at,
                'response_time_hours': email.response_time_hours,
                'sla_threshold': email.department.sla_threshold_hours if email.department else 4.0,
                'status': 'BREACHED',
                'alert_sent': email.alert_sent
            }
            breaches.append(breach_info)
        
        # Get pending breaches (not replied and time elapsed > SLA)
        if include_pending:
            pending_emails = db.query(Email).filter(
                Email.is_replied == False
            ).all()
            
            for email in pending_emails:
                hours_elapsed = (datetime.utcnow() - email.received_at).total_seconds() / 3600
                sla_threshold = email.department.sla_threshold_hours if email.department else 4.0
                
                if hours_elapsed > sla_threshold:
                    breach_info = {
                        'email_id': email.id,
                        'subject': email.subject,
                        'sender': email.sender,
                        'recipient': email.recipient,
                        'team_member_name': email.team_member.name if email.team_member else None,
                        'department_name': email.department.name if email.department else None,
                        'received_at': email.received_at,
                        'replied_at': None,
                        'hours_elapsed': round(hours_elapsed, 2),
                        'sla_threshold': sla_threshold,
                        'status': 'PENDING_BREACH',
                        'alert_sent': email.alert_sent
                    }
                    breaches.append(breach_info)
        
        print(f"  Found {len(breaches)} SLA breach(es)")
        
        return breaches
        
    except Exception as e:
        print(f"❌ Error getting SLA breaches: {e}")
        logger.error(f"Error getting SLA breaches: {e}")
        raise

from sqlalchemy import Integer

def check_and_alert_sla_breaches(db: Session) -> List[Dict]:
    """
    Check for SLA breaches and send alerts
    """
    print(f"\n🚨 Checking for SLA breaches requiring alerts...")
    
    try:
        alerts_sent = []
        
        # Find unreplied emails that exceeded SLA and haven't been alerted
        pending_emails = db.query(Email).filter(
            and_(
                Email.is_replied == False,
                Email.alert_sent == False
            )
        ).all()
        
        for email in pending_emails:
            hours_elapsed = (datetime.utcnow() - email.received_at).total_seconds() / 3600
            sla_threshold = email.department.sla_threshold_hours if email.department else 4.0
            
            if hours_elapsed > sla_threshold:
                print(f"\n  ⚠️  SLA breach detected:")
                print(f"    Email ID: {email.id}")
                print(f"    Subject: {email.subject}")
                print(f"    Elapsed: {hours_elapsed:.2f} hrs")
                print(f"    SLA: {sla_threshold:.2f} hrs")
                
                # Send alert (placeholder - implement actual email sending)
                alert_info = {
                    'email_id': email.id,
                    'subject': email.subject,
                    'hours_elapsed': round(hours_elapsed, 2),
                    'sla_threshold': sla_threshold,
                    'team_member': email.team_member.name if email.team_member else 'Unassigned',
                    'department': email.department.name if email.department else 'Unassigned'
                }
                
                # Mark alert as sent
                email.alert_sent = True
                email.alert_sent_at = datetime.utcnow()
                
                # Log alert in database
                alert = Alert(
                    email_id=email.id,
                    alert_type='SLA_BREACH',
                    message=f"Email '{email.subject}' has exceeded SLA by {hours_elapsed - sla_threshold:.2f} hours",
                    sent_to='admin@company.com'  # Get from config
                )
                db.add(alert)
                
                alerts_sent.append(alert_info)
        
        db.commit()
        
        if alerts_sent:
            print(f"\n✅ Sent {len(alerts_sent)} alert(s)")
        else:
            print(f"\n✅ No new alerts needed")
        
        return alerts_sent
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error checking SLA breaches: {e}")
        logger.error(f"Error checking SLA breaches: {e}")
        raise