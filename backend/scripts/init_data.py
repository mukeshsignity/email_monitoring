# """
# Script to initialize database with sample data for testing
# """
# import sys
# import os

# # Add parent directory to path
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# from database.connection import SessionLocal, init_db
# from database.models import Department, TeamMember, Email
# from datetime import datetime, timedelta
# import random

# def init_sample_data():
#     """
#     Initialize database with sample departments, team members, and emails
#     """
#     print("\n" + "="*60)
#     print("🌱 Initializing sample data")
#     print("="*60)
    
#     # First, ensure tables are created
#     init_db()
    
#     db = SessionLocal()
    
#     try:
#         # Check if data already exists
#         existing_depts = db.query(Department).count()
#         if existing_depts > 0:
#             print("\n⚠️  Database already contains data!")
#             response = input("Do you want to continue and add more data? (yes/no): ")
#             if response.lower() not in ['yes', 'y']:
#                 print("❌ Cancelled")
#                 return
        
#         print("\n📝 Creating departments...")
        
#         # Create Departments
#         departments = [
#             Department(name="Customer Support", sla_threshold_hours=4.0),
#             Department(name="Sales", sla_threshold_hours=2.0),
#             Department(name="Technical Support", sla_threshold_hours=6.0),
#             Department(name="Billing", sla_threshold_hours=4.0),
#         ]
        
#         for dept in departments:
#             db.add(dept)
#         db.commit()
        
#         for dept in departments:
#             db.refresh(dept)
#             print(f"  ✅ {dept.name} (ID: {dept.id}, SLA: {dept.sla_threshold_hours}h)")
        
#         print("\n👥 Creating team members...")
        
#         # Create Team Members
#         team_members = [
#             # Customer Support
#             TeamMember(name="John Smith", email="john.smith@company.com", department_id=departments[0].id),
#             TeamMember(name="Sarah Johnson", email="sarah.johnson@company.com", department_id=departments[0].id),
#             TeamMember(name="Mike Davis", email="mike.davis@company.com", department_id=departments[0].id),
            
#             # Sales
#             TeamMember(name="Emily Brown", email="emily.brown@company.com", department_id=departments[1].id),
#             TeamMember(name="David Wilson", email="david.wilson@company.com", department_id=departments[1].id),
            
#             # Technical Support
#             TeamMember(name="Lisa Anderson", email="lisa.anderson@company.com", department_id=departments[2].id),
#             TeamMember(name="Robert Taylor", email="robert.taylor@company.com", department_id=departments[2].id),
            
#             # Billing
#             TeamMember(name="Jennifer Martinez", email="jennifer.martinez@company.com", department_id=departments[3].id),
#         ]
        
#         for member in team_members:
#             db.add(member)
#         db.commit()
        
#         for member in team_members:
#             db.refresh(member)
#             dept_name = db.query(Department).filter(Department.id == member.department_id).first().name
#             print(f"  ✅ {member.name} - {dept_name} ({member.email})")
        
#         print("\n📧 Creating sample emails...")
        
#         # Create Sample Emails
#         client_emails = [
#             "client1@example.com",
#             "client2@example.com",
#             "client3@example.com",
#             "customer@business.com",
#             "support@clientcompany.com"
#         ]
        
#         subjects = [
#             "Question about pricing",
#             "Technical issue with product",
#             "Request for refund",
#             "Feature request",
#             "Bug report",
#             "Account access problem",
#             "Invoice inquiry",
#             "Product demonstration request",
#             "Complaint about service",
#             "Upgrade options"
#         ]
        
#         # Create emails from the past week
#         emails_created = 0
#         for i in range(50):  # Create 50 sample emails
#             # Random timestamps over the past 7 days
#             days_ago = random.randint(0, 7)
#             hours_ago = random.randint(0, 23)
#             received_at = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
            
#             # Random team member and their department
#             team_member = random.choice(team_members)
#             department = db.query(Department).filter(Department.id == team_member.department_id).first()
            
#             # Random client email and subject
#             sender = random.choice(client_emails)
#             subject = random.choice(subjects)
            
#             email = Email(
#                 sender=sender,
#                 recipient=team_member.email,
#                 subject=subject,
#                 body=f"Sample email body for: {subject}",
#                 team_member_id=team_member.id,
#                 department_id=department.id,
#                 received_at=received_at,
#                 is_client_email=True
#             )
            
#             # 70% of emails are replied
#             if random.random() < 0.7:
#                 # Reply time: 0.5 to 8 hours
#                 reply_hours = random.uniform(0.5, 8.0)
#                 email.replied_at = received_at + timedelta(hours=reply_hours)
#                 email.response_time_hours = reply_hours
#                 email.is_replied = True
                
#                 # Check if it's an SLA breach
#                 email.is_sla_breach = reply_hours > department.sla_threshold_hours
            
#             db.add(email)
#             emails_created += 1
            
#             if emails_created % 10 == 0:
#                 db.commit()
#                 print(f"  ✅ Created {emails_created} emails...")
        
#         db.commit()
#         print(f"  ✅ Total: {emails_created} sample emails created")
        
#         # Print summary
#         print("\n" + "="*60)
#         print("📊 Summary:")
#         print("="*60)
#         print(f"  Departments: {len(departments)}")
#         print(f"  Team Members: {len(team_members)}")
#         print(f"  Emails: {emails_created}")
        
#         replied_count = db.query(Email).filter(Email.is_replied == True).count()
#         pending_count = db.query(Email).filter(Email.is_replied == False).count()
#         breach_count = db.query(Email).filter(Email.is_sla_breach == True).count()
        
#         print(f"\n  Replied: {replied_count}")
#         print(f"  Pending: {pending_count}")
#         print(f"  SLA Breaches: {breach_count}")
#         print("="*60)
        
#         print("\n✅ Sample data initialized successfully!")
#         print("\n🚀 You can now start the API server with: python main.py")
#         print("📚 API Documentation: http://localhost:8000/docs\n")
        
#     except Exception as e:
#         db.rollback()
#         print(f"\n❌ Error initializing data: {e}")
#         raise
#     finally:
#         db.close()

# if __name__ == "__main__":
#     init_sample_data()




#==========================Production Version==========================
"""
Script to initialize database with sample data for testing
Production-ready version with proper error handling
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import SessionLocal, init_db
from database.models import Department, TeamMember, Email, Alert
from datetime import datetime, timedelta
import random


def init_sample_data():
    """
    Initialize database with sample departments, team members, and emails
    """
    print("\n" + "="*60)
    print("🌱 Initializing sample data for Email Monitoring System")
    print("="*60)
    
    # First, ensure tables are created
    init_db()
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_depts = db.query(Department).count()
        if existing_depts > 0:
            print("\n⚠️  Database already contains data!")
            print(f"   - Departments: {db.query(Department).count()}")
            print(f"   - Team Members: {db.query(TeamMember).count()}")
            print(f"   - Emails: {db.query(Email).count()}")
            response = input("\nDo you want to continue and add more data? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("❌ Cancelled")
                return
        
        print("\n📝 Creating departments...")
        
        # Create Departments with realistic SLA thresholds
        departments = [
            Department(
                name="Customer Support", 
                sla_threshold_hours=4.0,
                created_at=datetime.utcnow()
            ),
            Department(
                name="Sales", 
                sla_threshold_hours=2.0,
                created_at=datetime.utcnow()
            ),
            Department(
                name="Technical Support", 
                sla_threshold_hours=6.0,
                created_at=datetime.utcnow()
            ),
            Department(
                name="Billing", 
                sla_threshold_hours=4.0,
                created_at=datetime.utcnow()
            ),
            Department(
                name="Account Management", 
                sla_threshold_hours=8.0,
                created_at=datetime.utcnow()
            ),
        ]
        
        for dept in departments:
            db.add(dept)
        db.commit()
        
        for dept in departments:
            db.refresh(dept)
            print(f"  ✅ {dept.name} (ID: {dept.id}, SLA: {dept.sla_threshold_hours}h)")
        
        print("\n👥 Creating team members...")
        
        # Create Team Members with app_password field
        team_members = [
            # Customer Support Team
            TeamMember(
                name="John Smith", 
                email="john.smith@yopmail.com",
                app_password="test_password_123",  # Dummy password for testing
                department_id=departments[0].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            TeamMember(
                name="Sarah Johnson", 
                email="sarah.johnson@yopmail.com",
                app_password="test_password_123",
                department_id=departments[0].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            TeamMember(
                name="Mike Davis", 
                email="mike.davis@yopmail.com",
                app_password="test_password_123",
                department_id=departments[0].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            
            # Sales Team
            TeamMember(
                name="Emily Brown", 
                email="emily.brown@yopmail.com",
                app_password="test_password_123",
                department_id=departments[1].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            TeamMember(
                name="David Wilson", 
                email="david.wilson@yopmail.com",
                app_password="test_password_123",
                department_id=departments[1].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            
            # Technical Support Team
            TeamMember(
                name="Lisa Anderson", 
                email="lisa.anderson@yopmail.com",
                app_password="test_password_123",
                department_id=departments[2].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            TeamMember(
                name="Robert Taylor", 
                email="robert.taylor@yopmail.com",
                app_password="test_password_123",
                department_id=departments[2].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            
            # Billing Team
            TeamMember(
                name="Jennifer Martinez", 
                email="jennifer.martinez@yopmail.com",
                app_password="test_password_123",
                department_id=departments[3].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
            
            # Account Management Team
            TeamMember(
                name="Michael Chen", 
                email="michael.chen@yopmail.com",
                app_password="test_password_123",
                department_id=departments[4].id,
                is_active=True,
                created_at=datetime.utcnow()
            ),
        ]
        
        for member in team_members:
            db.add(member)
        db.commit()
        
        for member in team_members:
            db.refresh(member)
            dept_name = db.query(Department).filter(Department.id == member.department_id).first().name
            print(f"  ✅ {member.name} - {dept_name} ({member.email})")
        
        print("\n📧 Creating sample emails...")
        
        # Client emails using yopmail.com for testing
        client_emails = [
            "client1@yopmail.com",
            "client2@yopmail.com",
            "client3@yopmail.com",
            "customer.support@yopmail.com",
            "business.inquiry@yopmail.com",
            "tech.help@yopmail.com",
            "billing.dept@yopmail.com",
            "sales.team@yopmail.com",
            "info@yopmail.com",
            "contact@yopmail.com"
        ]
        
        # Realistic email subjects
        subjects = [
            "Question about pricing plans",
            "Technical issue with login",
            "Request for refund processing",
            "Feature request: Dark mode",
            "Bug report: Dashboard not loading",
            "Account access problem - Urgent",
            "Invoice inquiry for order #12345",
            "Product demonstration request",
            "Complaint about delayed response",
            "Upgrade to premium plan",
            "Password reset not working",
            "Integration with third-party tools",
            "Data export functionality",
            "Mobile app availability",
            "API documentation request",
            "Billing discrepancy issue",
            "Contract renewal discussion",
            "Trial period extension request",
            "Feature comparison inquiry",
            "Custom solution requirements"
        ]
        
        # Create emails from the past 30 days
        emails_created = 0
        sla_breaches = 0
        
        for i in range(100):  # Create 100 sample emails
            # Random timestamps over the past 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            received_at = datetime.utcnow() - timedelta(
                days=days_ago, 
                hours=hours_ago, 
                minutes=minutes_ago
            )
            
            # Random team member and their department
            team_member = random.choice(team_members)
            department = db.query(Department).filter(
                Department.id == team_member.department_id
            ).first()
            
            # Random client email and subject
            sender = random.choice(client_emails)
            subject = random.choice(subjects)
            
            # Create email body
            body = f"""Dear {team_member.name.split()[0]},

{subject}

I would appreciate your assistance with this matter at your earliest convenience.

Best regards,
{sender.split('@')[0].title()}
"""
            
            email = Email(
                sender=sender,
                recipient=team_member.email,
                subject=subject,
                body=body,
                team_member_id=team_member.id,
                department_id=department.id,
                received_at=received_at,
                is_client_email=True,
                is_replied=False,
                is_sla_breach=False,
                alert_sent=False
            )
            
            # 75% of emails are replied
            if random.random() < 0.75:
                # Reply time: 0.5 to 12 hours
                reply_hours = random.uniform(0.5, 12.0)
                email.replied_at = received_at + timedelta(hours=reply_hours)
                email.response_time_hours = reply_hours
                email.is_replied = True
                
                # Check if it's an SLA breach
                if reply_hours > department.sla_threshold_hours:
                    email.is_sla_breach = True
                    sla_breaches += 1
                    
                    # 50% of breaches have alerts sent
                    if random.random() < 0.5:
                        email.alert_sent = True
                        email.alert_sent_at = email.replied_at + timedelta(minutes=5)
            else:
                # For unreplied emails, check if they're overdue
                hours_elapsed = (datetime.utcnow() - received_at).total_seconds() / 3600
                if hours_elapsed > department.sla_threshold_hours:
                    email.is_sla_breach = False  # Not yet marked as breach until replied
                    # But should trigger alert (handled by check_and_alert_sla_breaches)
            
            db.add(email)
            emails_created += 1
            
            if emails_created % 20 == 0:
                db.commit()
                print(f"  ✅ Created {emails_created} emails...")
        
        db.commit()
        print(f"  ✅ Total: {emails_created} sample emails created")
        
        # Print detailed summary
        print("\n" + "="*60)
        print("📊 DATABASE SUMMARY:")
        print("="*60)
        
        print(f"\n📁 Departments: {len(departments)}")
        for dept in departments:
            member_count = db.query(TeamMember).filter(
                TeamMember.department_id == dept.id
            ).count()
            email_count = db.query(Email).filter(
                Email.department_id == dept.id
            ).count()
            print(f"   • {dept.name:25} SLA: {dept.sla_threshold_hours}h | "
                  f"Members: {member_count} | Emails: {email_count}")
        
        print(f"\n👥 Team Members: {len(team_members)}")
        print(f"   • Active: {db.query(TeamMember).filter(TeamMember.is_active == True).count()}")
        print(f"   • Inactive: {db.query(TeamMember).filter(TeamMember.is_active == False).count()}")
        
        print(f"\n📧 Emails: {emails_created}")
        replied_count = db.query(Email).filter(Email.is_replied == True).count()
        pending_count = db.query(Email).filter(Email.is_replied == False).count()
        breach_count = db.query(Email).filter(Email.is_sla_breach == True).count()
        client_emails_count = db.query(Email).filter(Email.is_client_email == True).count()
        
        print(f"   • Replied: {replied_count} ({replied_count/emails_created*100:.1f}%)")
        print(f"   • Pending: {pending_count} ({pending_count/emails_created*100:.1f}%)")
        print(f"   • SLA Breaches: {breach_count} ({breach_count/emails_created*100:.1f}%)")
        print(f"   • Client Emails: {client_emails_count}")
        
        # Calculate average response time
        avg_response = db.query(Email).filter(
            Email.response_time_hours.isnot(None)
        ).with_entities(Email.response_time_hours).all()
        
        if avg_response:
            avg_time = sum(r[0] for r in avg_response) / len(avg_response)
            print(f"   • Average Response Time: {avg_time:.2f} hours")
        
        print("\n" + "="*60)
        print("✅ Sample data initialized successfully!")
        print("="*60)
        
        print("\n📝 NEXT STEPS:")
        print("   1. Start the API server:")
        print("      uvicorn main:app --reload")
        print("\n   2. Access API documentation:")
        print("      http://localhost:8000/docs")
        print("\n   3. Test emails at yopmail.com:")
        print("      https://yopmail.com")
        print("      Example: john.smith@yopmail.com")
        print("\n   4. View metrics:")
        print("      GET /api/metrics/departments/")
        print("      GET /api/metrics/team-members/")
        print("\n   5. Check SLA breaches:")
        print("      GET /api/sla/breaches/")
        print("="*60 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error initializing data: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_sample_data()
