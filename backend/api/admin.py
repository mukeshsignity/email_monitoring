"""
Admin endpoints for database management
"""
import os
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
 
router = APIRouter()

@router.post("/init-sample-data")
async def initialize_sample_data(
    secret: str = Query(..., description="Admin secret key"),
    db: Session = Depends(get_db)
):
    """
    Initialize database with sample data
    
    **Security:** Requires ADMIN_SECRET environment variable
    
    **Usage:** POST /api/admin/init-sample-data?secret=YOUR_SECRET_KEY
    """
    
    # Check secret key
    admin_secret = os.getenv("ADMIN_SECRET", "please-change-this-secret")
    
    if secret != admin_secret:
        raise HTTPException(
            status_code=403,
            detail="Invalid admin secret key"
        )
    
    try:
        # Override input() for non-interactive execution
        import builtins
        original_input = builtins.input
        builtins.input = lambda *args: "yes"
        
        # Import and run sample data script
        from scripts.init_data import init_sample_data
        
        # Execute
        init_sample_data()
        
        # Restore original input
        builtins.input = original_input
        
        # Count records
        from database.models import Department, TeamMember, Email
        
        dept_count = db.query(Department).count()
        member_count = db.query(TeamMember).count()
        email_count = db.query(Email).count()
        
        return {
            "success": True,
            "message": "Sample data initialized successfully",
            "data": {
                "departments": dept_count,
                "team_members": member_count,
                "emails": email_count
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize sample data: {str(e)}"
        )


@router.get("/database-stats")
async def get_database_stats(db: Session = Depends(get_db)):
    """
    Get current database statistics (no auth required)
    """
    from database.models import Department, TeamMember, Email, Alert
    
    try:
        return {
            "departments": db.query(Department).count(),
            "team_members": db.query(TeamMember).count(),
            "emails": db.query(Email).count(),
            "alerts": db.query(Alert).count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )
