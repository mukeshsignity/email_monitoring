import imaplib
import email
from email.header import decode_header
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
import re
import time

# ============================================================================
# GMAIL INTEGRATION (IMAP)
# ============================================================================

def connect_to_gmail_imap(email_address: str, app_password: str):
    """
    Connect to Gmail via IMAP
    """
    try:
        print(f"🔐 Connecting to Gmail IMAP for: {email_address}")
        
        imap = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        imap.login(email_address, app_password)
        
        print(f"✅ Successfully connected to Gmail")
        return imap
        
    except imaplib.IMAP4.error as e:
        print(f"❌ IMAP authentication failed: {e}")
        print(f"💡 Make sure you're using an App Password, not your regular password")
        raise
    except Exception as e:
        print(f"❌ Failed to connect to Gmail: {e}")
        raise

def fetch_gmail_unread_emails(imap, limit: int = 10) -> List[Dict]:
    """
    Fetch top N unread emails from Gmail inbox
    """
    try:
        # Select inbox
        imap.select("INBOX")
        
        # Search for unread emails
        status, messages = imap.search(None, 'UNSEEN')
        
        if status != 'OK':
            print("❌ Failed to search emails")
            return []
        
        email_ids = messages[0].split()
        
        if not email_ids:
            print(f"📭 No unread emails found")
            return []
        
        print(f"📬 Found {len(email_ids)} unread email(s)")
        
        # Get the most recent emails (reverse order)
        email_ids = email_ids[-limit:] if len(email_ids) > limit else email_ids
        email_ids = list(reversed(email_ids))  # Most recent first
        
        emails = []
        
        for idx, email_id in enumerate(email_ids, 1):
            try:
                print(f"\n   📧 Processing email {idx}/{len(email_ids)}...")
                
                # Fetch email by ID
                status, msg_data = imap.fetch(email_id, '(RFC822)')
                
                if status != 'OK':
                    print(f"   ⚠️ Failed to fetch email ID {email_id}")
                    continue
                
                # Parse email
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        # Decode subject
                        subject_header = msg.get("Subject", "")
                        subject = decode_email_header(subject_header)
                        
                        # Get sender and recipient
                        sender = msg.get("From", "")
                        recipient = msg.get("To", "")
                        date_str = msg.get("Date", "")
                        
                        print(f"      From: {sender[:50]}")
                        print(f"      Subject: {subject[:50]}...")
                        
                        # Extract email body
                        body = extract_email_body(msg)
                        
                        emails.append({
                            "sender": sender,
                            "recipient": recipient,
                            "subject": subject,
                            "body": body[:1000],  # Limit body length
                            "date": date_str,
                            "email_id": email_id.decode(),
                            "source": "gmail"
                        })
                        
                        print(f"      ✅ Email parsed successfully")
                
            except Exception as e:
                print(f"   ⚠️ Error parsing email {idx}: {e}")
                continue
        
        print(f"\n✅ Successfully fetched {len(emails)} email(s)")
        return emails
        
    except Exception as e:
        print(f"❌ Error fetching Gmail emails: {e}")
        import traceback
        traceback.print_exc()
        return []

def decode_email_header(header: str) -> str:
    """
    Decode email header (subject, from, etc.)
    """
    if not header:
        return ""
    
    decoded_parts = decode_header(header)
    decoded_string = ""
    
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try:
                decoded_string += part.decode(encoding or 'utf-8', errors='ignore')
            except:
                decoded_string += part.decode('utf-8', errors='ignore')
        else:
            decoded_string += str(part)
    
    return decoded_string

def extract_email_body(msg) -> str:
    """
    Extract email body from message
    """
    body = ""
    
    try:
        if msg.is_multipart():
            # Walk through email parts
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                # Get text/plain parts
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            charset = part.get_content_charset() or 'utf-8'
                            body = payload.decode(charset, errors='ignore')
                            break
                    except:
                        pass
                
                # Fallback to text/html
                if not body and content_type == "text/html" and "attachment" not in content_disposition:
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            charset = part.get_content_charset() or 'utf-8'
                            body = payload.decode(charset, errors='ignore')
                    except:
                        pass
        else:
            # Not multipart
            try:
                payload = msg.get_payload(decode=True)
                if payload:
                    charset = msg.get_content_charset() or 'utf-8'
                    body = payload.decode(charset, errors='ignore')
            except:
                pass
    
    except Exception as e:
        print(f"   ⚠️ Error extracting body: {e}")
    
    return body or "[Email body could not be extracted]"

# ============================================================================
# EMAIL PROCESSING
# ============================================================================

def extract_email_address(email_string: str) -> str:
    """Extract clean email address from various formats"""
    if not email_string:
        return ""
    
    # Remove angle brackets and extract email
    match = re.search(r'<(.+?)>', email_string)
    if match:
        return match.group(1).strip().lower()
    
    # Clean and return
    cleaned = email_string.strip().lower()
    
    # Remove quotes and extra spaces
    cleaned = cleaned.replace('"', '').replace("'", "")
    
    return cleaned

def process_incoming_email(db: Session, email_data: Dict) -> Optional[object]:
    """
    Process and log incoming email to database
    """
    from services.analytics_service import log_email_received
    from database.models import TeamMember, Email
    
    try:
        # Extract clean email addresses
        recipient_email = extract_email_address(email_data["recipient"])
        sender_email = extract_email_address(email_data["sender"])
        
        print(f"\n📨 Processing email:")
        print(f"   From: {sender_email}")
        print(f"   To: {recipient_email}")
        print(f"   Subject: {email_data['subject'][:50]}...")
        
        # Check if email already exists (avoid duplicates)
        existing_email = db.query(Email).filter(
            Email.sender == sender_email,
            Email.recipient == recipient_email,
            Email.subject == email_data["subject"]
        ).first()
        
        if existing_email:
            print(f"⚠️ Email already exists in database (ID: {existing_email.id}), skipping")
            return None
        
        # Find team member by recipient email
        team_member = db.query(TeamMember).filter(
            TeamMember.email == recipient_email,
            TeamMember.is_active == True
        ).first()
        
        if not team_member:
            print(f"❌ No active team member found for: {recipient_email}")
            return None
        
        print(f"✅ Found team member: {team_member.name} (Dept: {team_member.department_id})")
        
        # Log email to database
        email_record = log_email_received(
            db=db,
            sender=sender_email,
            recipient=recipient_email,
            subject=email_data["subject"],
            body=email_data["body"],
            team_member_id=team_member.id,
            is_client_email=True
        )
        
        print(f"✅ Email logged to database (ID: {email_record.id})")
        return email_record
        
    except Exception as e:
        print(f"❌ Error processing email: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None

def sync_team_member_gmail(db: Session, team_member, app_password: str, limit: int = 10) -> Dict:
    """
    Sync top N unread emails for a single team member from Gmail
    """
    result = {
        "team_member": team_member.email,
        "emails_found": 0,
        "emails_processed": 0,
        "errors": []
    }
    
    imap = None
    
    try:
        # Connect to Gmail IMAP
        imap = connect_to_gmail_imap(team_member.email, app_password)
        
        # Fetch unread emails
        emails = fetch_gmail_unread_emails(imap, limit=limit)
        result["emails_found"] = len(emails)
        
        # Process each email
        for email_data in emails:
            email_record = process_incoming_email(db, email_data)
            if email_record:
                result["emails_processed"] += 1
        
        db.commit()
        
    except Exception as e:
        error_msg = f"Error syncing {team_member.email}: {str(e)}"
        print(f"❌ {error_msg}")
        result["errors"].append(error_msg)
        db.rollback()
    
    finally:
        if imap:
            try:
                imap.logout()
                print(f"🔓 Logged out from Gmail")
            except:
                pass
    
    return result

def sync_all_team_members_gmail(db: Session, limit: int = 10) -> Dict:
    """
    Sync unread emails for all active team members with Gmail addresses
    """
    from database.models import TeamMember
    
    results = {
        "total_members_synced": 0,
        "total_emails_found": 0,
        "total_emails_processed": 0,
        "member_results": [],
        "errors": []
    }
    
    # Get all active team members with Gmail addresses
    team_members = db.query(TeamMember).filter(
        TeamMember.is_active == True,
        TeamMember.email.like('%@gmail.com')
    ).all()
    
    print(f"\n👥 Found {len(team_members)} active team member(s) with Gmail")
    
    for member in team_members:
        print(f"\n{'='*60}")
        print(f"🔍 Syncing: {member.name} ({member.email})")
        print(f"{'='*60}")
        
        # ✅ Get app password from team member record
        app_password = member.app_password  # This is the key line!
        
        if not app_password:
            print(f"⚠️ No app password stored for {member.email}, skipping")
            results["errors"].append(f"No app password for {member.email}")
            continue
        
        member_result = sync_team_member_gmail(db, member, app_password, limit=limit)
        
        results["total_members_synced"] += 1
        results["total_emails_found"] += member_result["emails_found"]
        results["total_emails_processed"] += member_result["emails_processed"]
        results["member_results"].append(member_result)
        
        if member_result["errors"]:
            results["errors"].extend(member_result["errors"])
        
        print(f"\n📊 Member Summary:")
        print(f"   Emails found: {member_result['emails_found']}")
        print(f"   Emails processed (new): {member_result['emails_processed']}")
        
        time.sleep(2)  # Rate limiting between members
    
    print(f"\n{'='*60}")
    print(f"📊 FINAL SYNC SUMMARY")
    print(f"{'='*60}")
    print(f"   Members synced: {results['total_members_synced']}")
    print(f"   Total emails found: {results['total_emails_found']}")
    print(f"   Total emails processed (new): {results['total_emails_processed']}")
    print(f"   Errors: {len(results['errors'])}")
    
    return results

    """
    Sync unread emails for all active team members with Gmail addresses
    """
    from database.models import TeamMember
    
    results = {
        "total_members_synced": 0,
        "total_emails_found": 0,
        "total_emails_processed": 0,
        "member_results": [],
        "errors": []
    }
    
    # Get all active team members with Gmail addresses
    team_members = db.query(TeamMember).filter(
        TeamMember.is_active == True,
        TeamMember.email.like('%@gmail.com')
    ).all()
    
    print(f"\n👥 Found {len(team_members)} active team member(s) with Gmail")
    
    for member in team_members:
        print(f"\n{'='*60}")
        print(f"🔍 Syncing: {member.name} ({member.email})")
        print(f"{'='*60}")
        
        # Get app password from team member record
        # For now, you'll need to store this in the database
        # Or pass it as a parameter
        app_password = getattr(member, 'app_password', None)
        
        if not app_password:
            print(f"⚠️ No app password stored for {member.email}, skipping")
            results["errors"].append(f"No app password for {member.email}")
            continue
        
        member_result = sync_team_member_gmail(db, member, app_password, limit=limit)
        
        results["total_members_synced"] += 1
        results["total_emails_found"] += member_result["emails_found"]
        results["total_emails_processed"] += member_result["emails_processed"]
        results["member_results"].append(member_result)
        
        if member_result["errors"]:
            results["errors"].extend(member_result["errors"])
        
        print(f"\n📊 Member Summary:")
        print(f"   Emails found: {member_result['emails_found']}")
        print(f"   Emails processed (new): {member_result['emails_processed']}")
        
        time.sleep(2)  # Rate limiting between members
    
    print(f"\n{'='*60}")
    print(f"📊 FINAL SYNC SUMMARY")
    print(f"{'='*60}")
    print(f"   Members synced: {results['total_members_synced']}")
    print(f"   Total emails found: {results['total_emails_found']}")
    print(f"   Total emails processed (new): {results['total_emails_processed']}")
    print(f"   Errors: {len(results['errors'])}")
    
    return results
