import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal
from database.models import User
from auth.hashing import verify_password

try:
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@enterpriseauditor.ai").first()
    if user:
        is_valid = verify_password("admin123", user.password_hash)
        print("Password check matches for admin123:", is_valid)
        print("Stored hash:", user.password_hash)
    else:
        print("User admin@enterpriseauditor.ai not found")
    db.close()
except Exception as e:
    print("Check failed:", e)
