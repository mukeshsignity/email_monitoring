from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# Department Models
class DepartmentCreate(BaseModel):
    name: str
    sla_threshold_hours: float = 4.0

class DepartmentResponse(BaseModel):
    id: int
    name: str
    sla_threshold_hours: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Team Member Models
class TeamMemberCreate(BaseModel):
    name: str
    email: str
    app_password: Optional[str] = None  # Gmail App Password
    department_id: int

class TeamMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    app_password: Optional[str] = None  # Include app_password in response
    department_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Email Models
class EmailRequest(BaseModel):
    sender: EmailStr
    recipient: EmailStr
    subject: str
    body: str
    team_member_id: Optional[int] = None
    is_client_email: bool = True

class EmailReplyRequest(BaseModel):
    email_id: int

class EmailResponse(BaseModel):
    id: int
    sender: str
    recipient: str
    subject: str
    received_at: datetime
    replied_at: Optional[datetime]
    response_time_hours: Optional[float]
    is_replied: bool
    is_sla_breach: bool
    team_member_id: Optional[int]
    department_id: Optional[int]
    
    class Config:
        from_attributes = True

# Metrics Models
class DepartmentMetrics(BaseModel):
    department_id: int
    department_name: str
    total_emails: int
    replied_emails: int
    pending_emails: int
    average_response_time: Optional[float]
    sla_breaches: int
    sla_compliance_rate: float

class TeamMemberMetrics(BaseModel):
    team_member_id: int
    team_member_name: str
    team_member_email: str
    department_name: str
    total_emails: int
    replied_emails: int
    pending_emails: int
    average_response_time: Optional[float]
    sla_breaches: int
    sla_compliance_rate: float

class SLABreachResponse(BaseModel):
    email_id: int
    subject: str
    sender: str
    recipient: str
    team_member_name: Optional[str]
    department_name: Optional[str]
    received_at: datetime
    hours_elapsed: float
    sla_threshold: float
    alert_sent: bool

# Alert Models
class AlertRequest(BaseModel):
    recipient: EmailStr
    subject: str
    body: str