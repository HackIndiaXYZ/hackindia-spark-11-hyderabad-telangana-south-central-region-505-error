import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal, engine
from database.models import (
    Base, User, Document, Audit, AgentResult, Finding,
    Recommendation, AuditLog, ApiKey, Notification, Setting
)
import database.crud as crud
import database.schemas as schemas

def test_full_saas_architecture():
    print("\n--- Starting 10-Table SaaS Architecture Verification ---")
    db = SessionLocal()

    try:
        # 1. Verify Table Registration
        table_names = list(Base.metadata.tables.keys())
        print(f"[1/6] Registered Tables in SQLAlchemy ({len(table_names)} tables):")
        for t in table_names:
            print(f"   - {t}")
        assert len(table_names) >= 10, f"Expected at least 10 tables, found {len(table_names)}"

        # 2. Test User, Settings, & API Key Retrieval
        users = crud.get_users(db)
        print(f"[2/6] Total Active Users in DB: {len(users)}")
        assert len(users) >= 1, "Should have at least 1 user from seed data"

        test_user = users[0]
        settings = crud.get_user_settings(db, test_user.id)
        assert settings is not None, "Settings should exist"
        print(f"   - User Settings: Theme={settings.theme}, Model={settings.selected_model}")

        api_keys = crud.get_user_api_keys(db, test_user.id)
        print(f"   - API Keys Count: {len(api_keys)}")

        # 3. Test Analytics Endpoint Logic
        analytics = crud.get_audit_analytics(db)
        print(f"[3/6] Analytics Summary:")
        print(f"   - Total Audits: {analytics['total_audits']}")
        print(f"   - Avg Risk Score: {analytics['average_risk_score']}")
        print(f"   - Critical/High Findings: {analytics['critical_findings_count']}")
        print(f"   - Risk Breakdown: {analytics['audits_by_risk']}")

        # 4. Test Findings Search
        sec_findings = crud.search_findings(db, agent_name="Security")
        print(f"[4/6] Search Findings ('Security'): {len(sec_findings)} results found.")
        for f in sec_findings:
            print(f"   - Finding #{f.id}: [{f.severity}] {f.title}")

        # 5. Test Audit History & Detailed Relationships
        audits = crud.get_audits(db)
        print(f"[5/6] Total Audits in DB: {len(audits)}")
        if len(audits) > 0:
            audit = crud.get_audit_by_id(db, audits[0].id)
            print(f"   - Audit #{audit.id} Document: {audit.document.filename if audit.document else 'N/A'}")
            print(f"   - Specialist Agent Results: {len(audit.agent_results)}")
            print(f"   - Findings: {len(audit.findings)}")
            print(f"   - Recommendations: {len(audit.recommendations)}")
            print(f"   - Audit Logs: {len(audit.audit_logs)}")

        # 6. Test Notifications
        notifs = crud.get_user_notifications(db, test_user.id)
        print(f"[6/6] User Notifications: {len(notifs)} unread/read messages.")

        print("\n--- 10-Table Enterprise SaaS Architecture Verification Completed Successfully! ---\n")

    except Exception as e:
        print("Verification Failed:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_full_saas_architecture()
