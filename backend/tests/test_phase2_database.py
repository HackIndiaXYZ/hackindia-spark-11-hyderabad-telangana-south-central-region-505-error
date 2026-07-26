import sys
import os
import time
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from database.models.user import User
from database.models.document import Document
from database.models.audit import Audit
from database.models.finding import Finding
from database.models.recommendation import Recommendation
from database.models.agent_result import AgentResult
from services.audit_service import AuditService
import database.crud as crud

def test_phase2_database_persistence():
    """
    Phase 2 Database Test:
    1. Records initial row counts for Document, Audit, Finding, Recommendation, and AgentResult tables.
    2. Uploads and processes a corporate audit document.
    3. Verifies row count increases across all target database tables.
    4. Verifies data fidelity and foreign key relationships.
    """
    db = SessionLocal()
    try:
        # Step 1: Ensure active test user exists
        test_user = db.query(User).filter(User.is_deleted == False).first()
        if not test_user:
            from auth.hashing import hash_password
            test_user = User(
                name="DB Test Auditor",
                email="db_test_auditor@corporateauditor.ai",
                password_hash=hash_password("dbtest123"),
                company="Database Quality Assurance"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        # Step 2: Record Initial Baseline Row Counts
        initial_doc_count = db.query(Document).count()
        initial_audit_count = db.query(Audit).count()
        initial_finding_count = db.query(Finding).count()
        initial_rec_count = db.query(Recommendation).count()
        initial_agent_result_count = db.query(AgentResult).count()

        print("\n--- Phase 2 Initial Database Row Counts ---")
        print(f"Documents: {initial_doc_count}")
        print(f"Audits: {initial_audit_count}")
        print(f"Findings: {initial_finding_count}")
        print(f"Recommendations: {initial_rec_count}")
        print(f"Agent Results: {initial_agent_result_count}")

        # Step 3: Create Document Record & File
        sample_pdf_path = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
        if not os.path.exists(sample_pdf_path):
            os.makedirs(os.path.dirname(sample_pdf_path), exist_ok=True)
            with open(sample_pdf_path, "wb") as f:
                f.write(b"%PDF-1.4 sample proposal content for database testing. Investment Cost: $100000. Expected Revenue: $120000. ROI: 400%")

        filename = "Database_Phase2_Verification_Proposal.pdf"
        file_size = os.path.getsize(sample_pdf_path)

        doc = Document(
            filename=filename,
            file_type="application/pdf",
            file_size=file_size,
            file_path=sample_pdf_path,
            user_id=test_user.id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        audit_rec = Audit(
            document_id=doc.id,
            user_id=test_user.id,
            overall_score=50,
            overall_risk="HIGH",
            status="queued",
            progress=0,
            executive_summary="Database verification audit job."
        )
        db.add(audit_rec)
        db.commit()
        db.refresh(audit_rec)

        audit_id = audit_rec.id

        # Step 4: Execute Full Audit Workflow Service Logic
        print(f"\nProcessing Audit #{audit_id} for Database Persistence Verification...")
        AuditService.process_audit_job(
            db=db,
            audit_id=audit_id,
            file_path=sample_pdf_path,
            filename=filename,
            user_id=test_user.id
        )

        # Step 5: Fetch Final Row Counts
        final_doc_count = db.query(Document).count()
        final_audit_count = db.query(Audit).count()
        final_finding_count = db.query(Finding).count()
        final_rec_count = db.query(Recommendation).count()
        final_agent_result_count = db.query(AgentResult).count()

        print("\n--- Phase 2 Final Database Row Counts ---")
        print(f"Documents: {final_doc_count} (Delta: +{final_doc_count - initial_doc_count})")
        print(f"Audits: {final_audit_count} (Delta: +{final_audit_count - initial_audit_count})")
        print(f"Findings: {final_finding_count} (Delta: +{final_finding_count - initial_finding_count})")
        print(f"Recommendations: {final_rec_count} (Delta: +{final_rec_count - initial_rec_count})")
        print(f"Agent Results: {final_agent_result_count} (Delta: +{final_agent_result_count - initial_agent_result_count})")

        # Step 6: Verify Row Count Increases
        assert final_doc_count > initial_doc_count, "Document table row count must increase"
        assert final_audit_count > initial_audit_count, "Audit table row count must increase"
        assert final_finding_count > initial_finding_count, "Finding table row count must increase"
        assert final_rec_count > initial_rec_count, "Recommendation table row count must increase"

        # Step 7: Verify Data Fidelity & Foreign Key Relationships
        audit_entry = db.query(Audit).filter(Audit.id == audit_id).first()
        assert audit_entry is not None, f"Audit record #{audit_id} must exist in database"
        assert audit_entry.status.lower() == "completed", f"Expected completed status, got {audit_entry.status}"
        assert audit_entry.progress == 100, f"Expected 100% progress, got {audit_entry.progress}"
        assert audit_entry.document_id == doc.id, "Audit document_id must match Document PK"
        assert audit_entry.user_id == test_user.id, "Audit user_id must match User PK"

        findings = db.query(Finding).filter(Finding.audit_id == audit_id).all()
        assert len(findings) > 0, "Audit must have associated findings saved in database"
        for f in findings:
            assert f.audit_id == audit_id, f"Finding audit_id ({f.audit_id}) must match Audit PK ({audit_id})"

        recommendations = db.query(Recommendation).filter(Recommendation.audit_id == audit_id).all()
        assert len(recommendations) > 0, "Audit must have associated recommendations saved in database"
        for r in recommendations:
            assert r.audit_id == audit_id, f"Recommendation audit_id ({r.audit_id}) must match Audit PK ({audit_id})"

        print("\n[PASSED] Phase 2 Database Persistence & Foreign Key Verification Test PASSED!")

    finally:
        db.close()

if __name__ == "__main__":
    test_phase2_database_persistence()
