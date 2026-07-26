import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal, engine
from database.models import Base, User, Document, Audit, Finding, AgentResult
import database.crud as crud
import database.schemas as schemas

def test_full_database_lifecycle():
    print("\n--- Starting Neon PostgreSQL Integration Test ---")
    db = SessionLocal()
    try:
        # 1. Ensure tables exist
        Base.metadata.create_all(bind=engine)
        print("[1/5] Tables created/verified in Neon PostgreSQL.")

        # 2. Test User Creation
        test_email = "auditor_test@corporateauditor.ai"
        existing_user = crud.get_user_by_email(db, test_email)
        if not existing_user:
            user_data = schemas.UserCreate(
                name="Test Lead Auditor",
                email=test_email,
                password="secure_password_123",
                role="lead_auditor"
            )
            user = crud.create_user(db, user_data)
            print(f"[2/5] Created Test User ID={user.id}, Email={user.email}")
        else:
            user = existing_user
            print(f"[2/5] Found Existing Test User ID={user.id}")

        # 3. Save Sample Audit Record
        mock_audit_result = {
            "overall_risk": "HIGH",
            "overall_score": 35,
            "executive_summary": "Critical security and financial compliance risks identified.",
            "overall_health_verdict": "High Risk - Immediate Remediation Required",
            "critical_findings": [
                {
                    "title": "Unencrypted Database Connection String",
                    "severity": "Critical",
                    "category": "Security",
                    "reported_by": ["Security", "Legal"],
                    "reason": "Hardcoded credentials in plaintext config",
                    "recommendation": "Use secrets manager and environment variables"
                },
                {
                    "title": "Missing Cash Flow Reconciliation",
                    "severity": "High",
                    "category": "Financial",
                    "reported_by": ["CFO"],
                    "reason": "Discrepancy in quarterly revenue reporting",
                    "recommendation": "Perform 30-day financial audit"
                }
            ]
        }

        mock_agent_reports = {
            "cfo": {"risk_score": 40, "verdict": "Financial Anomaly Detected"},
            "legal": {"risk_score": 30, "verdict": "Contract Breach Vulnerability"},
            "security": {"risk_score": 20, "verdict": "Critical Vulnerability Present"},
            "market": {"risk_score": 50, "verdict": "Market Alignment Moderate"}
        }

        saved_audit = crud.save_audit_record(
            db=db,
            filename="sample_corporate_report.pdf",
            file_path="/path/to/sample_corporate_report.pdf",
            file_size=1024500,
            audit_result=mock_audit_result,
            agent_reports=mock_agent_reports,
            processing_time=4.85,
            user_id=user.id
        )

        print(f"[3/5] Successfully saved Audit Record ID={saved_audit.id} into Neon PostgreSQL.")

        # 4. Fetch & Verify Saved Audit Record
        fetched_audit = crud.get_audit_by_id(db, saved_audit.id)
        assert fetched_audit is not None, "Fetched audit should not be None"
        assert fetched_audit.overall_score == 35, f"Expected score 35, got {fetched_audit.overall_score}"
        assert len(fetched_audit.findings) == 2, f"Expected 2 findings, got {len(fetched_audit.findings)}"
        assert len(fetched_audit.agent_results) == 4, f"Expected 4 agent results, got {len(fetched_audit.agent_results)}"

        print(f"[4/5] Verification Passed: Audit ID {fetched_audit.id} has {len(fetched_audit.findings)} findings & {len(fetched_audit.agent_results)} agent reports.")

        # 5. List All Audits
        all_audits = crud.get_audits(db, limit=10)
        print(f"[5/5] Total Audits in DB: {len(all_audits)}")

        print("--- Neon PostgreSQL Integration Test Completed Successfully! ---\n")

    except Exception as e:
        print("Integration Test Failed:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_full_database_lifecycle()
