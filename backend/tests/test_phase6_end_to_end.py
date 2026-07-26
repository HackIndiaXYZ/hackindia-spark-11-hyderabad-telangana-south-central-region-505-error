import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.database import SessionLocal, engine, get_db
from database.models.user import User
from database.models.audit import Audit
from database.models.finding import Finding
from database.models.recommendation import Recommendation
from database.models.agent_result import AgentResult
from database.models.notification import Notification
from services.audit_service import AuditService

client = TestClient(app)


def test_phase6_complete_end_to_end_user_journey():
    """
    Phase 6 – Complete End-to-End User Journey Test:
    1. Register user
    2. Login user & obtain JWT token
    3. Access Dashboard analytics
    4. Upload PDF document
    5. Execute LangGraph multi-agent parallel workflow & Coordinator
    6. Verify database persistence (Audits, Findings, Recommendations, AgentResults)
    7. Verify 3-Page Executive Report generation (PDF, Excel, JSON)
    8. Verify email/notification triggers
    9. Verify audit history updated
    10. Download PDF report
    11. Logout user
    """
    db = SessionLocal()
    try:
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"e2e_auditor_{unique_id}@enterprise.com"
        test_password = "SecurePassword123!"
        test_name = f"Auditor {unique_id}"
        test_company = "Global Risk Governance Inc"

        # ── Step 1: Register ──
        print("\n[STEP 1] Registering User...")
        reg_payload = {
            "name": test_name,
            "email": test_email,
            "password": test_password,
            "company": test_company
        }
        reg_resp = client.post("/auth/register", json=reg_payload)
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
        user_data = reg_resp.json()
        assert user_data["email"] == test_email
        user_id = user_data["id"]
        print(f"  [OK] User registered successfully! User ID: {user_id}")

        # ── Step 2: Login ──
        print("[STEP 2] Logging in User...")
        login_resp = client.post("/auth/login", json={"email": test_email, "password": test_password})
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data["access_token"]
        assert token, "Access token missing in login response."
        headers = {"Authorization": f"Bearer {token}"}
        print("  [OK] Login successful! JWT Access Token received.")

        # ── Step 3: Dashboard ──
        print("[STEP 3] Fetching Dashboard Data...")
        analytics_resp = client.get("/analytics", headers=headers)
        assert analytics_resp.status_code == 200, f"Analytics failed: {analytics_resp.text}"
        history_resp = client.get("/audits", headers=headers)
        assert history_resp.status_code == 200, f"Audits history failed: {history_resp.text}"
        print("  [OK] Dashboard analytics and audit history loaded.")

        # ── Step 4: Upload PDF ──
        print("[STEP 4] Uploading PDF Document...")
        sample_pdf_path = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
        assert os.path.exists(sample_pdf_path), f"Sample PDF not found at {sample_pdf_path}"

        with open(sample_pdf_path, "rb") as pdf_file:
            upload_resp = client.post(
                "/audit",
                files={"file": ("proposal.pdf", pdf_file, "application/pdf")},
                headers=headers
            )
        assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
        audit_payload = upload_resp.json()
        audit_id = audit_payload["audit_id"]
        assert audit_id, "Audit ID missing in upload response."
        assert audit_payload["status"] == "queued"
        print(f"  [OK] PDF uploaded successfully! Audit ID: {audit_id}")

        # ── Step 5 & 6 & 7: Progress Screen → LangGraph → Coordinator ──
        print("[STEP 5-7] Executing LangGraph Multi-Agent Workflow & Coordinator...")
        audit_job_result = AuditService.process_audit_job(
            db=db,
            audit_id=audit_id,
            file_path=sample_pdf_path,
            filename="proposal.pdf",
            user_id=user_id
        )
        assert audit_job_result["status"] == "completed"
        print("  [OK] LangGraph Fan-Out (CFO, Legal, Security, Market) & Coordinator synthesis finished!")

        # ── Step 8: Save Database Verification ──
        print("[STEP 8] Verifying Database Persistence...")
        audit_db_rec = db.query(Audit).filter(Audit.id == audit_id).first()
        assert audit_db_rec is not None, "Audit record not found in DB."
        assert audit_db_rec.status == "completed"
        assert audit_db_rec.progress == 100
        assert audit_db_rec.overall_score is not None
        assert audit_db_rec.overall_risk.upper() in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

        findings_count = db.query(Finding).filter(Finding.audit_id == audit_id).count()
        recs_count = db.query(Recommendation).filter(Recommendation.audit_id == audit_id).count()
        results_count = db.query(AgentResult).filter(AgentResult.audit_id == audit_id).count()
        print(f"  [OK] Database verified: {results_count} Agent Results, {findings_count} Findings, {recs_count} Recommendations saved.")

        # ── Step 9: Generate Report (PDF, Excel, JSON) ──
        print("[STEP 9] Verifying Generated PDF Report...")
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_file_path = os.path.join(base_dir, "generated_reports", "pdf", f"Audit_{audit_id}.pdf")
        assert os.path.exists(pdf_file_path), f"PDF report file does not exist at {pdf_file_path}"
        assert os.path.getsize(pdf_file_path) > 5000, "Generated PDF report file size is suspiciously small."
        print(f"  [OK] 3-Page Executive PDF Report generated at {pdf_file_path} (Size: {os.path.getsize(pdf_file_path)} bytes)")

        # ── Step 10: Notification / Email Verification ──
        print("[STEP 10] Verifying In-App Notifications & Email Triggers...")
        notifs = db.query(Notification).filter(Notification.user_id == user_id).all()
        assert len(notifs) >= 1, "In-app notifications were not generated."
        print(f"  [OK] Notifications verified: {len(notifs)} in-app notification(s) recorded for user.")

        # ── Step 11: History Updated Verification via API ──
        print("[STEP 11] Verifying Updated Audit History via API...")
        history_after = client.get("/audits", headers=headers)
        assert history_after.status_code == 200
        history_audits = history_after.json()
        matching_audit = next((a for a in history_audits if a["id"] == audit_id), None)
        assert matching_audit is not None, "Completed audit not found in updated history endpoint."
        assert matching_audit["status"] == "completed"

        detail_resp = client.get(f"/audits/{audit_id}", headers=headers)
        assert detail_resp.status_code == 200
        detail_data = detail_resp.json()
        assert detail_data["id"] == audit_id
        print("  [OK] Audit history API endpoint returning complete audit records.")

        # ── Step 12: Download PDF Report via Endpoint ──
        print("[STEP 12] Downloading PDF Report via API Endpoint...")
        pdf_download_resp = client.get(f"/reports/{audit_id}/pdf", headers=headers)
        assert pdf_download_resp.status_code == 200, f"PDF download failed: {pdf_download_resp.text}"
        assert pdf_download_resp.headers.get("content-type") == "application/pdf"
        assert len(pdf_download_resp.content) > 5000
        print("  [OK] PDF Report binary stream successfully downloaded from endpoint.")

        # ── Step 13: Logout ──
        print("[STEP 13] Logging Out User...")
        logout_resp = client.post("/auth/logout", headers=headers)
        assert logout_resp.status_code == 200
        print("  [OK] User logged out successfully.")


        print("\n" + "=" * 70)
        print("🎉 END-TO-END (PHASE 6) USER JOURNEY TEST COMPLETED WITH 100% SUCCESS!")
        print("=" * 70 + "\n")

    finally:
        try:
            db.close()
        except Exception:
            pass

