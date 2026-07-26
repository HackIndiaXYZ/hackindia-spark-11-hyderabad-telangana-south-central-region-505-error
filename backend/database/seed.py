import sys
import os
import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal, engine
from database.models import (
    Base, User, Document, Audit, AgentResult, Finding,
    Recommendation, AuditLog, ApiKey, Notification, Setting
)
from auth.hashing import hash_password

def seed_database():
    print("Initializing Database Schema & Seeding SaaS Data into Neon PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Demo Admin User
        admin_email = "admin@enterpriseauditor.ai"
        user = db.query(User).filter(User.email == admin_email).first()
        admin_pass_hash = hash_password("admin123")
        
        if not user:
            user = User(
                name="Sarah Jenkins",
                email=admin_email,
                password_hash=admin_pass_hash,
                role="admin",
                company="Acme Global Financials"
            )
            db.add(user)
            db.flush()
            print(f"Created User: {user.name} ({user.email})")
        else:
            user.password_hash = admin_pass_hash
            db.commit()
            print(f"Updated password hash for {admin_email}")

        # 2. Seed Default Settings for User
        setting = db.query(Setting).filter(Setting.user_id == user.id).first()
        if not setting:
            setting = Setting(
                user_id=user.id,
                selected_model="qwen2.5:7b",
                theme="dark",
                language="en",
                notifications_enabled=True
            )
            db.add(setting)
            print("Seeded Default User Settings")

        # 3. Seed Sample ApiKey
        api_key = db.query(ApiKey).filter(ApiKey.user_id == user.id).first()
        if not api_key:
            api_key = ApiKey(
                user_id=user.id,
                provider="Ollama Local Engine",
                encrypted_key="enc_v1_ollama_qwen_2_5_local_node"
            )
            db.add(api_key)
            print("Seeded Default API Key Config")

        # 4. Seed Sample Document
        doc = db.query(Document).filter(Document.filename == "Q4_Financial_Acquisition_Report.pdf").first()
        if not doc:
            doc = Document(
                user_id=user.id,
                filename="Q4_Financial_Acquisition_Report.pdf",
                file_type="application/pdf",
                file_size=2450800,
                file_path="/uploads/Q4_Financial_Acquisition_Report.pdf",
                status="Completed"
            )
            db.add(doc)
            db.flush()
            print(f"Created Document: {doc.filename}")

        # 5. Seed Sample Audit
        audit = db.query(Audit).filter(Audit.document_id == doc.id).first()
        if not audit:
            audit = Audit(
                document_id=doc.id,
                user_id=user.id,
                overall_score=42,
                overall_risk="HIGH",
                executive_summary="Critical findings detected across financial reporting integrity, regulatory data privacy, and third-party vendor dependencies.",
                overall_health_verdict="High Risk - Immediate Leadership Remediation Required",
                processing_time=6.42,
                model_used="LangGraph + Ollama (qwen2.5:7b)",
                status="Completed"
            )
            db.add(audit)
            db.flush()
            print(f"Created Audit Record ID={audit.id}")

            # 6. Seed Specialist Agent Results
            agents_data = [
                ("CFO", 45, "Moderate Risk", {"revenue_discrepancy": "$1.2M", "cash_flow": "Unverified"}),
                ("Legal", 35, "High Risk", {"compliance_gap": "GDPR Article 28 breach", "jurisdiction": "EU-US"}),
                ("Security", 25, "Critical Risk", {"data_leak": "Unencrypted customer PII", "auth_protocol": "Deprecated"}),
                ("Market", 60, "Low Risk", {"competitive_position": "Strong", "market_growth": "+14%"}),
                ("Coordinator", 42, "High Risk", {"synthesis": "Consolidated high risk profile"})
            ]

            for a_name, a_score, a_verdict, a_json in agents_data:
                agent_res = AgentResult(
                    audit_id=audit.id,
                    agent_name=a_name,
                    risk_score=a_score,
                    risk_level=a_verdict,
                    execution_time=1.2,
                    result_json=a_json
                )
                db.add(agent_res)
            print("Seeded Specialist Agent Results (CFO, Legal, Security, Market, Coordinator)")

            # 7. Seed Findings
            findings_data = [
                {
                    "agent_name": "Security",
                    "title": "SEC-001: Plaintext Database Credentials in PDF Proposal",
                    "description": "Hardcoded database password found in Section 4.2 architecture diagram.",
                    "severity": "Critical",
                    "category": "Data Security",
                    "confidence": 0.98,
                    "recommendation": "Rotate database credentials immediately and store them in vault environment.",
                    "status": "Open"
                },
                {
                    "agent_name": "Legal",
                    "title": "LEG-104: Non-Compliant Cross-Border Data Transfer",
                    "description": "Agreement lacks Standard Contractual Clauses (SCCs) for EU customer data transfers.",
                    "severity": "High",
                    "category": "Legal Compliance",
                    "confidence": 0.92,
                    "recommendation": "Execute updated Data Processing Addendum (DPA) with legal team.",
                    "status": "Under_Review"
                },
                {
                    "agent_name": "CFO",
                    "title": "FIN-203: Unreconciled EBITDA Adjustment",
                    "description": "$1.2M unbacked EBITDA adjustment reported without backing ledger notes.",
                    "severity": "High",
                    "category": "Financial Reporting",
                    "confidence": 0.89,
                    "recommendation": "Require third-party audit verification prior to merger agreement sign-off.",
                    "status": "Open"
                }
            ]

            for f in findings_data:
                finding_rec = Finding(
                    audit_id=audit.id,
                    agent_name=f["agent_name"],
                    title=f["title"],
                    description=f["description"],
                    severity=f["severity"],
                    category=f["category"],
                    confidence=f["confidence"],
                    recommendation=f["recommendation"],
                    status=f["status"]
                )
                db.add(finding_rec)
            print("Seeded Findings")

            # 8. Seed Recommendations
            recs_data = [
                ("Immediate", "Rotate database credentials and enforce SSL mode on Neon PostgreSQL connections.", "Low"),
                ("Short-Term", "Execute DPA with standard contractual clauses for regulatory compliance.", "Medium"),
                ("Long-Term", "Implement continuous automated multi-agent audit pipeline in CI/CD.", "High")
            ]

            for prio, rec_text, effort in recs_data:
                rec_obj = Recommendation(
                    audit_id=audit.id,
                    priority=prio,
                    recommendation=rec_text,
                    estimated_effort=effort
                )
                db.add(rec_obj)
            print("Seeded Structured Recommendations")

            # 9. Seed Audit Logs
            logs_data = [
                ("PDF Uploaded", "Completed", "Successfully validated PDF file integrity."),
                ("Fan-Out Parallel Agents Initialized", "Completed", "Spawned CFO, Legal, Security, Market agents."),
                ("Specialist Agents Execution", "Completed", "All 4 specialist agents finished analysis in 4.2s."),
                ("Coordinator Synthesis", "Completed", "Consolidated findings and executive summary."),
                ("Database Persistence", "Completed", "Saved full audit trajectory to Neon PostgreSQL.")
            ]

            for step_name, log_status, msg in logs_data:
                audit_log = AuditLog(
                    audit_id=audit.id,
                    step=step_name,
                    status=log_status,
                    message=msg
                )
                db.add(audit_log)
            print("Seeded Audit Execution Logs")

            # 10. Seed Notification
            notif = Notification(
                user_id=user.id,
                message=f"Audit #{audit.id} completed for '{doc.filename}' with Overall Score: {audit.overall_score}/100.",
                status="Unread"
            )
            db.add(notif)
            print("Seeded User Notification")

        db.commit()
        print("\n--- Neon PostgreSQL Database Seeding Complete! ---")

    except Exception as e:
        db.rollback()
        print("Seeding Failed:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
