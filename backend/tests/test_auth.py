import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app import app
from database.database import SessionLocal
from database.models.user import User

client = TestClient(app)

def test_full_authentication_flow():
    print("\n--- Starting Full Authentication & Security Verification ---")
    
    test_email = "security_test_auditor@corporateauditor.ai"
    test_password = "SecurePassword@2026"
    test_name = "Alex Rivera"

    # Cleanup existing test user if present
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    # 1. Test Registration
    reg_payload = {
        "name": test_name,
        "email": test_email,
        "password": test_password,
        "company": "Apex Global Auditing"
    }
    response = client.post("/auth/register", json=reg_payload)
    print(f"[1/6] Registration Status: {response.status_code}")
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    user_resp = response.json()
    assert user_resp["email"] == test_email
    assert "id" in user_resp
    print(f"      Created User ID={user_resp['id']}, Email={user_resp['email']}")

    # 2. Test Duplicate Registration Prevention
    dup_resp = client.post("/auth/register", json=reg_payload)
    print(f"[2/6] Duplicate Registration Status: {dup_resp.status_code}")
    assert dup_resp.status_code == 400

    # 3. Test Invalid Login Credentials
    invalid_login = client.post("/auth/login", json={"email": test_email, "password": "WrongPassword"})
    print(f"[3/6] Invalid Password Status: {invalid_login.status_code}")
    assert invalid_login.status_code == 401

    # 4. Test Successful Login & JWT Token Generation
    login_resp = client.post("/auth/login", json={"email": test_email, "password": test_password})
    print(f"[4/6] Successful Login Status: {login_resp.status_code}")
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    access_token = token_data["access_token"]
    print(f"      Issued JWT Access Token: {access_token[:25]}...")

    # 5. Test Authenticated Profile (/auth/me) with Bearer Header
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = client.get("/auth/me", headers=headers)
    print(f"[5/6] Protected /auth/me Profile Status: {me_resp.status_code}")
    assert me_resp.status_code == 200
    profile = me_resp.json()
    assert profile["email"] == test_email
    assert profile["name"] == test_name
    print(f"      Authenticated Profile Verified for '{profile['name']}'")

    # 6. Test Protected API Access (/audits & /analytics)
    unauth_resp = client.get("/audits")
    print(f"[6/6] Unauthenticated /audits Status (Expected 403/401): {unauth_resp.status_code}")
    assert unauth_resp.status_code in [401, 403]

    auth_audits_resp = client.get("/audits", headers=headers)
    print(f"      Authenticated /audits Status: {auth_audits_resp.status_code}")
    assert auth_audits_resp.status_code == 200

    # 7. Test Logout
    logout_resp = client.post("/auth/logout", headers=headers)
    assert logout_resp.status_code == 200

    print("\n--- Full Authentication & Security Verification Completed Successfully! ---\n")

if __name__ == "__main__":
    test_full_authentication_flow()
