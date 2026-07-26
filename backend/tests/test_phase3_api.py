import sys
import os
import time
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.database import SessionLocal
from database.models.user import User

client = TestClient(app)

# Helper function to get valid auth headers
def get_auth_token_headers():
    unique_email = f"api_test_{int(time.time())}_{os.getpid()}@corporateauditor.ai"
    password = "TestPassword123!"
    
    reg_res = client.post("/auth/register", json={
        "name": "API Test Auditor",
        "email": unique_email,
        "password": password,
        "company": "API Quality Assurance"
    })

    login_res = client.post("/auth/login", json={
        "email": unique_email,
        "password": password
    })
    token = login_res.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

# 1. Health & Root Endpoint
def test_root_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "online"
    assert "agents" in data

# 2. Auth Endpoints: Register & Login & Invalid Input
def test_auth_registration_and_login_flow():
    unique_email = f"auth_flow_{int(time.time())}_{os.getpid()}@corporateauditor.ai"
    password = "SecurePassword2026!"

    # Test Registration Success (201 Created)
    reg_response = client.post("/auth/register", json={
        "name": "Auth Flow User",
        "email": unique_email,
        "password": password,
        "company": "Enterprise Testing"
    })
    assert reg_response.status_code == 201, f"Expected 201 Created, got {reg_response.status_code}"
    reg_data = reg_response.json()
    assert reg_data.get("email") == unique_email
    assert "id" in reg_data

    # Test Duplicate Email Registration Error (400 Bad Request)
    dup_response = client.post("/auth/register", json={
        "name": "Auth Flow User",
        "email": unique_email,
        "password": password,
        "company": "Enterprise Testing"
    })
    assert dup_response.status_code == 400, f"Expected 400 Bad Request, got {dup_response.status_code}"

    # Test Login Success (200 OK)
    login_response = client.post("/auth/login", json={
        "email": unique_email,
        "password": password
    })
    assert login_response.status_code == 200, f"Expected 200 OK, got {login_response.status_code}"
    login_data = login_response.json()
    assert "access_token" in login_data

    # Test Login Invalid Password Error (401 Unauthorized)
    invalid_login = client.post("/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword123!"
    })
    assert invalid_login.status_code == 401, f"Expected 401 Unauthorized, got {invalid_login.status_code}"

# 3. Profile Endpoint: GET /auth/me
def test_auth_me_profile_endpoint():
    headers = get_auth_token_headers()
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    user_data = response.json()
    assert "email" in user_data
    assert "name" in user_data

# 4. Audit Document Upload Endpoint: POST /audit
def test_audit_upload_endpoint():
    headers = get_auth_token_headers()

    # Read valid PDF bytes
    sample_pdf_path = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
    if os.path.exists(sample_pdf_path):
        with open(sample_pdf_path, "rb") as f:
            pdf_bytes = f.read()
    else:
        pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"

    files = {"file": ("api_test_document.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/audit", headers=headers, files=files)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    data = response.json()
    assert "audit_id" in data
    assert "task_id" in data
    assert data.get("status") == "queued"

    # Non-PDF Rejection Test (400 Bad Request)
    txt_files = {"file": ("unsupported_document.txt", b"plain text", "text/plain")}
    err_response = client.post("/audit", headers=headers, files=txt_files)
    assert err_response.status_code == 400, f"Expected 400 Bad Request, got {err_response.status_code}"

# 5. Audits History & Detail Endpoints: GET /audits & GET /audits/{id}
def test_audits_history_and_detail_endpoints():
    headers = get_auth_token_headers()

    # GET /audits
    list_response = client.get("/audits", headers=headers)
    assert list_response.status_code == 200
    audits = list_response.json()
    assert isinstance(audits, list)

    if len(audits) > 0:
        valid_id = audits[0]["id"]
        detail_response = client.get(f"/audits/{valid_id}", headers=headers)
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        assert detail_data["id"] == valid_id

    # Test Non-existent Audit ID (404 Not Found)
    non_existent = client.get("/audits/999999", headers=headers)
    assert non_existent.status_code == 404, f"Expected 404 Not Found, got {non_existent.status_code}"

# 6. Analytics Endpoint: GET /analytics
def test_analytics_endpoint():
    headers = get_auth_token_headers()
    response = client.get("/analytics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_audits" in data
    assert "average_risk_score" in data
    assert "critical_findings_count" in data

# 7. Notifications Endpoint: GET /notifications
def test_notifications_endpoint():
    headers = get_auth_token_headers()
    response = client.get("/notifications", headers=headers)
    assert response.status_code == 200
    notifs = response.json()
    assert isinstance(notifs, list)

# 8. Settings Endpoints: GET /settings & PUT /settings
def test_settings_endpoints():
    headers = get_auth_token_headers()

    # GET /settings
    get_res = client.get("/settings", headers=headers)
    assert get_res.status_code == 200

    # PUT /settings
    put_res = client.put("/settings", headers=headers, json={
        "theme": "dark",
        "language": "en",
        "notifications_enabled": True
    })
    assert put_res.status_code == 200
    updated_data = put_res.json()
    assert updated_data.get("theme") == "dark"

# 9. Multi-Format Report Export Endpoints: GET /reports/{id}/pdf, excel, json
def test_reports_export_endpoints():
    headers = get_auth_token_headers()
    list_res = client.get("/audits", headers=headers)
    audits = list_res.json()

    if len(audits) > 0:
        audit_id = audits[0]["id"]

        # PDF Export
        pdf_res = client.get(f"/reports/{audit_id}/pdf")
        assert pdf_res.status_code == 200
        assert "application/pdf" in pdf_res.headers.get("content-type", "")

        # Excel Export
        excel_res = client.get(f"/reports/{audit_id}/excel")
        assert excel_res.status_code == 200
        assert "spreadsheetml" in excel_res.headers.get("content-type", "")

        # JSON Export
        json_res = client.get(f"/reports/{audit_id}/json")
        assert json_res.status_code == 200
        assert "application/json" in json_res.headers.get("content-type", "")
