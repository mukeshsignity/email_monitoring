from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database.connection import get_db
from database.models import Department, TeamMember, Email
from api.models import (
    DepartmentCreate, DepartmentResponse,
    TeamMemberCreate, TeamMemberResponse,
    EmailRequest, EmailReplyRequest, EmailResponse,
    DepartmentMetrics, TeamMemberMetrics, SLABreachResponse,
    AlertRequest
)
from services.analytics_service import (
    log_email_received,
    log_email_reply,
    get_department_metrics,
    get_team_member_metrics,
    get_sla_breaches,
    check_and_alert_sla_breaches
)
from services.email_service import send_email, send_sla_breach_alert

router = APIRouter()

# ============================================================================
# DEPARTMENT ENDPOINTS
# ============================================================================

@router.post("/departments/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    """
    Create a new department
    """
    print(f"\n🏢 Creating new department: {department.name}")
    
    try:
        # Check if department already exists
        existing = db.query(Department).filter(Department.name == department.name).first()
        if existing:
            print(f"❌ Department '{department.name}' already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department '{department.name}' already exists"
            )
        
        db_department = Department(
            name=department.name,
            sla_threshold_hours=department.sla_threshold_hours
        )
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        
        print(f"✅ Department created successfully (ID: {db_department.id})")
        return db_department
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating department: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/departments/", response_model=List[DepartmentResponse])
async def list_departments(db: Session = Depends(get_db)):
    """
    Get all departments
    """
    print(f"\n📋 Fetching all departments")
    try:
        departments = db.query(Department).all()
        print(f"✅ Found {len(departments)} department(s)")
        return departments
    except Exception as e:
        print(f"❌ Error fetching departments: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/departments/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: int, db: Session = Depends(get_db)):
    """
    Get a specific department
    """
    print(f"\n🔍 Fetching department ID: {department_id}")
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        print(f"❌ Department {department_id} not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    
    print(f"✅ Found department: {department.name}")
    return department

# ============================================================================
# TEAM MEMBER ENDPOINTS
# ============================================================================

@router.post("/team-members/", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_team_member(team_member: TeamMemberCreate, db: Session = Depends(get_db)):
    """
    Create a new team member
    """
    print(f"\n👤 Creating new team member: {team_member.name}")
    
    try:
        # Check if email already exists
        existing = db.query(TeamMember).filter(TeamMember.email == team_member.email).first()
        if existing:
            print(f"❌ Team member with email '{team_member.email}' already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team member with email '{team_member.email}' already exists"
            )
        
        # Check if department exists
        department = db.query(Department).filter(Department.id == team_member.department_id).first()
        if not department:
            print(f"❌ Department {team_member.department_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department {team_member.department_id} not found"
            )
        
        db_team_member = TeamMember(
            name=team_member.name,
            email=team_member.email,
            app_password=team_member.app_password,  # ✅ ADD THIS LINE
            department_id=team_member.department_id
        )
        db.add(db_team_member)
        db.commit()
        db.refresh(db_team_member)
        
        print(f"✅ Team member created successfully (ID: {db_team_member.id})")
        return db_team_member
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating team member: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/team-members/", response_model=List[TeamMemberResponse])
async def list_team_members(
    department_id: Optional[int] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db)
):
    """
    Get all team members (optionally filtered by department)
    """
    print(f"\n👥 Fetching team members (department_id: {department_id}, active: {is_active})")
    
    try:
        query = db.query(TeamMember)
        
        if department_id:
            query = query.filter(TeamMember.department_id == department_id)
        
        if is_active is not None:
            query = query.filter(TeamMember.is_active == is_active)
        
        team_members = query.all()
        print(f"✅ Found {len(team_members)} team member(s)")
        return team_members
        
    except Exception as e:
        print(f"❌ Error fetching team members: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/team-members/{team_member_id}", response_model=TeamMemberResponse)
async def get_team_member(team_member_id: int, db: Session = Depends(get_db)):
    """
    Get a specific team member
    """
    print(f"\n🔍 Fetching team member ID: {team_member_id}")
    
    team_member = db.query(TeamMember).filter(TeamMember.id == team_member_id).first()
    if not team_member:
        print(f"❌ Team member {team_member_id} not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    
    print(f"✅ Found team member: {team_member.name}")
    return team_member

# ============================================================================
# EMAIL ENDPOINTS
# ============================================================================

@router.post("/emails/receive/", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def receive_email(email_req: EmailRequest, db: Session = Depends(get_db)):
    """
    Log a received email
    """
    print(f"\n📨 Receiving email from {email_req.sender}")
    
    try:
        # Verify team member exists if provided
        if email_req.team_member_id:
            team_member = db.query(TeamMember).filter(TeamMember.id == email_req.team_member_id).first()
            if not team_member:
                print(f"❌ Team member {email_req.team_member_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Team member {email_req.team_member_id} not found"
                )
        
        email = log_email_received(
            db=db,
            sender=email_req.sender,
            recipient=email_req.recipient,
            subject=email_req.subject,
            body=email_req.body,
            team_member_id=email_req.team_member_id,
            is_client_email=email_req.is_client_email
        )
        
        return email
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error receiving email: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/emails/reply/", response_model=EmailResponse)
async def reply_to_email(reply_req: EmailReplyRequest, db: Session = Depends(get_db)):
    """
    Mark an email as replied
    """
    print(f"\n💬 Marking email {reply_req.email_id} as replied")
    
    try:
        email = log_email_reply(db=db, email_id=reply_req.email_id)
        return email
        
    except ValueError as e:
        print(f"❌ {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        print(f"❌ Error marking email as replied: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/emails/", response_model=List[EmailResponse])
async def list_emails(
    team_member_id: Optional[int] = None,
    department_id: Optional[int] = None,
    is_replied: Optional[bool] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all emails (with optional filters)
    """
    print(f"\n📬 Fetching emails (filters: team={team_member_id}, dept={department_id}, replied={is_replied})")
    
    try:
        query = db.query(Email)
        
        if team_member_id:
            query = query.filter(Email.team_member_id == team_member_id)
        
        if department_id:
            query = query.filter(Email.department_id == department_id)
        
        if is_replied is not None:
            query = query.filter(Email.is_replied == is_replied)
        
        emails = query.order_by(Email.received_at.desc()).limit(limit).all()
        print(f"✅ Found {len(emails)} email(s)")
        return emails
        
    except Exception as e:
        print(f"❌ Error fetching emails: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ============================================================================
# METRICS ENDPOINTS
# ============================================================================

@router.get("/metrics/departments/", response_model=List[DepartmentMetrics])
async def get_departments_metrics(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get metrics for all departments or a specific department
    """
    print(f"\n📊 Fetching department metrics")
    
    try:
        metrics = get_department_metrics(db=db, department_id=department_id)
        return metrics
    except Exception as e:
        print(f"❌ Error fetching department metrics: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/metrics/team-members/", response_model=List[TeamMemberMetrics])
async def get_team_members_metrics(
    team_member_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get metrics for all team members or a specific team member
    """
    print(f"\n👥 Fetching team member metrics")
    
    try:
        metrics = get_team_member_metrics(db=db, team_member_id=team_member_id)
        return metrics
    except Exception as e:
        print(f"❌ Error fetching team member metrics: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ============================================================================
# SLA & ALERTS ENDPOINTS
# ============================================================================

@router.get("/sla/breaches/")
async def get_sla_breaches_endpoint(
    include_pending: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get all SLA breaches
    """
    print(f"\n⚠️  Fetching SLA breaches")
    
    try:
        breaches = get_sla_breaches(db=db, include_pending=include_pending)
        return {"sla_breaches": breaches, "total_count": len(breaches)}
    except Exception as e:
        print(f"❌ Error fetching SLA breaches: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/alerts/check-sla/")
async def check_sla_and_send_alerts(db: Session = Depends(get_db)):
    """
    Check for SLA breaches and send alerts
    """
    print(f"\n🚨 Checking SLA breaches and sending alerts")
    
    try:
        alerts = check_and_alert_sla_breaches(db=db)
        
        # Send actual email alerts if enabled
        from config.settings import settings
        if settings.enable_alerts and alerts:
            for alert in alerts:
                send_sla_breach_alert(settings.alert_email, alert)
        
        return {
            "status": "success",
            "alerts_sent": len(alerts),
            "alerts": alerts
        }
    except Exception as e:
        print(f"❌ Error checking SLA breaches: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/alerts/send/")
async def send_alert_endpoint(alert_req: AlertRequest):
    """
    Send a custom alert email
    """
    print(f"\n📧 Sending custom alert to {alert_req.recipient}")
    
    try:
        success = send_email(
            recipient=alert_req.recipient,
            subject=alert_req.subject,
            body=alert_req.body
        )
        
        if success:
            return {"status": "success", "message": "Alert sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send alert"
            )
    except Exception as e:
        print(f"❌ Error sending alert: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    


# ============================================================================
@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int, 
    department: DepartmentCreate, 
    db: Session = Depends(get_db)
):
    """
    Update an existing department
    """
    print(f"\n🔄 Updating department ID: {department_id}")
    
    try:
        db_department = db.query(Department).filter(Department.id == department_id).first()
        if not db_department:
            print(f"❌ Department {department_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found"
            )
        
        # Check if new name conflicts with existing
        if department.name != db_department.name:
            existing = db.query(Department).filter(
                Department.name == department.name,
                Department.id != department_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Department '{department.name}' already exists"
                )
        
        db_department.name = department.name
        db_department.sla_threshold_hours = department.sla_threshold_hours
        
        db.commit()
        db.refresh(db_department)
        
        print(f"✅ Department updated successfully")
        return db_department
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating department: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(department_id: int, db: Session = Depends(get_db)):
    """
    Delete a department
    """
    print(f"\n🗑️  Deleting department ID: {department_id}")
    
    try:
        db_department = db.query(Department).filter(Department.id == department_id).first()
        if not db_department:
            print(f"❌ Department {department_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found"
            )
        
        # Check if department has team members
        team_members_count = db.query(TeamMember).filter(
            TeamMember.department_id == department_id
        ).count()
        
        if team_members_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete department with {team_members_count} team member(s)"
            )
        
        db.delete(db_department)
        db.commit()
        
        print(f"✅ Department deleted successfully")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting department: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/team-members/{team_member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    team_member_id: int,
    team_member: TeamMemberCreate,
    db: Session = Depends(get_db)
):
    """
    Update an existing team member
    """
    print(f"\n🔄 Updating team member ID: {team_member_id}")
    
    try:
        db_member = db.query(TeamMember).filter(TeamMember.id == team_member_id).first()
        if not db_member:
            print(f"❌ Team member {team_member_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        
        # Check if new email conflicts with existing
        if team_member.email != db_member.email:
            existing = db.query(TeamMember).filter(
                TeamMember.email == team_member.email,
                TeamMember.id != team_member_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{team_member.email}' already exists"
                )
        
        # Check if department exists
        department = db.query(Department).filter(
            Department.id == team_member.department_id
        ).first()
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department {team_member.department_id} not found"
            )
        
        db_member.name = team_member.name
        db_member.email = team_member.email
        db_member.department_id = team_member.department_id
        
        db.commit()
        db.refresh(db_member)
        
        print(f"✅ Team member updated successfully")
        return db_member
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating team member: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/team-members/{team_member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team_member(team_member_id: int, db: Session = Depends(get_db)):
    """
    Delete a team member
    """
    print(f"\n🗑️  Deleting team member ID: {team_member_id}")
    
    try:
        db_member = db.query(TeamMember).filter(TeamMember.id == team_member_id).first()
        if not db_member:
            print(f"❌ Team member {team_member_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        
        # Optionally: Check if member has emails
        emails_count = db.query(Email).filter(Email.team_member_id == team_member_id).count()
        if emails_count > 0:
            # Instead of deleting, mark as inactive
            db_member.is_active = False
            db.commit()
            print(f"✅ Team member marked as inactive (has {emails_count} email(s))")
        else:
            db.delete(db_member)
            db.commit()
            print(f"✅ Team member deleted successfully")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting team member: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/departments/{department_id}/metrics", response_model=DepartmentMetrics)
async def get_single_department_metrics(department_id: int, db: Session = Depends(get_db)):
    """
    Get metrics for a specific department
    """
    print(f"\n📊 Fetching metrics for department ID: {department_id}")
    
    try:
        metrics = get_department_metrics(db=db, department_id=department_id)
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found"
            )
        return metrics[0]  # Return first result since we filtered by ID
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching department metrics: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/team-members/{team_member_id}/metrics", response_model=TeamMemberMetrics)
async def get_single_team_member_metrics(team_member_id: int, db: Session = Depends(get_db)):
    """
    Get metrics for a specific team member
    """
    print(f"\n📊 Fetching metrics for team member ID: {team_member_id}")
    
    try:
        metrics = get_team_member_metrics(db=db, team_member_id=team_member_id)
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        return metrics[0]  # Return first result since we filtered by ID
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching team member metrics: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/emails/{email_id}", response_model=EmailResponse)
async def get_email_details(email_id: int, db: Session = Depends(get_db)):
    """
    Get details of a specific email
    """
    print(f"\n🔍 Fetching email ID: {email_id}")
    
    try:
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        return email
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching email: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
# END OF FILE

@router.post("/emails/sync/gmail/")
async def sync_gmail_emails(limit: int = 10, db: Session = Depends(get_db)):
    """
    Sync top N unread emails from Gmail for all team members
    """
    print(f"\n🚀 Starting Gmail email sync (limit: {limit})...")
    
    try:
        from services.email_integration_service import sync_all_team_members_gmail
        
        results = sync_all_team_members_gmail(db, limit=limit)
        
        return {
            "status": "success",
            "members_synced": results["total_members_synced"],
            "emails_found": results["total_emails_found"],
            "emails_processed": results["total_emails_processed"],
            "member_results": results["member_results"],
            "errors": results["errors"]
        }
        
    except Exception as e:
        print(f"❌ Error syncing Gmail emails: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    


# ============================================================================
from services.auto_sync_service import auto_sync_service
from config.settings import settings
import time
# ============================================================================
# AUTO-SYNC ENDPOINTS
# ============================================================================

@router.post("/auto-sync/start/")
async def start_auto_sync():
    """
    Start automatic email synchronization
    """
    print(f"\n🚀 Starting auto-sync service...")
    
    success = auto_sync_service.start()
    
    if success:
        return {
            "status": "success",
            "message": "Auto-sync started",
            "interval_minutes": auto_sync_service.interval_seconds / 60
        }
    else:
        return {
            "status": "already_running",
            "message": "Auto-sync is already running"
        }

@router.post("/auto-sync/stop/")
async def stop_auto_sync():
    """
    Stop automatic email synchronization
    """
    print(f"\n🛑 Stopping auto-sync service...")
    
    success = auto_sync_service.stop()
    
    if success:
        return {
            "status": "success",
            "message": "Auto-sync stopped"
        }
    else:
        return {
            "status": "not_running",
            "message": "Auto-sync is not running"
        }

@router.get("/auto-sync/status/")
async def get_auto_sync_status():
    """
    Get current auto-sync status
    """
    status = auto_sync_service.get_status()
    
    return {
        "status": "running" if status["is_running"] else "stopped",
        "is_running": status["is_running"],
        "interval_minutes": status["interval_minutes"],
        "interval_seconds": status["interval_minutes"] * 60,
        "enabled_in_settings": settings.enable_auto_sync
    }

@router.put("/auto-sync/interval/")
async def update_auto_sync_interval(interval_minutes: int):
    """
    Update auto-sync interval (requires restart)
    """
    if interval_minutes < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interval must be at least 1 minute"
        )
    
    # Update settings
    settings.auto_sync_interval_minutes = interval_minutes
    auto_sync_service.interval_seconds = interval_minutes * 60
    
    was_running = auto_sync_service.is_running
    
    # Restart if running
    if was_running:
        auto_sync_service.stop()
        time.sleep(1)
        auto_sync_service.start()
    
    return {
        "status": "success",
        "message": f"Interval updated to {interval_minutes} minute(s)",
        "interval_minutes": interval_minutes,
        "auto_sync_restarted": was_running
    }
