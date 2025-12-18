from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    sla_threshold_hours = Column(Float, default=4.0)  # Default SLA in hours
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    team_members = relationship("TeamMember", back_populates="department")
    emails = relationship("Email", back_populates="department")

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    app_password = Column(String(255), nullable=True)  # Gmail App Password
    department_id = Column(Integer, ForeignKey("departments.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="team_members")
    emails = relationship("Email", back_populates="team_member")

class Email(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Email Details
    sender = Column(String(255), nullable=False, index=True)
    recipient = Column(String(255), nullable=False, index=True)
    subject = Column(String(500))
    body = Column(Text)
    
    # Tracking Details
    team_member_id = Column(Integer, ForeignKey("team_members.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    # Time Tracking
    received_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    replied_at = Column(DateTime, nullable=True)
    response_time_hours = Column(Float, nullable=True)  # Time to respond in hours
    
    # Status
    is_replied = Column(Boolean, default=False)
    is_client_email = Column(Boolean, default=True)
    is_sla_breach = Column(Boolean, default=False)
    
    # Alert Status
    alert_sent = Column(Boolean, default=False)
    alert_sent_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    team_member = relationship("TeamMember", back_populates="emails")
    department = relationship("Department", back_populates="emails")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    alert_type = Column(String(50))  # 'SLA_BREACH', 'CRITICAL_DELAY', etc.
    message = Column(Text)
    sent_to = Column(String(255))
    sent_at = Column(DateTime, default=datetime.utcnow)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)