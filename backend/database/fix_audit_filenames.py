import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database.database import SessionLocal
from database.models import Document, Audit

def fix_filenames():
    db = SessionLocal()
    try:
        docs = db.query(Document).all()
        print(f"Found {len(docs)} total document records in database.")
        
        name_map = {
            24: "Enterprise_Business_Strategy_Report.pdf",
            23: "Q3_Financial_Risk_Forecast.pdf",
            22: "EU_Compliance_Governance_Doc.pdf",
            21: "APAC_Strategic_Acquisition_Draft.pdf",
            20: "Cybersecurity_Threat_Analysis.pdf",
            19: "Annual_P&L_Margin_Assessment.pdf",
            18: "Executive_Corporate_Audit_Plan.pdf",
        }

        updated_count = 0
        for doc in docs:
            # Match by audit ID or filename pattern
            matching_audit = db.query(Audit).filter(Audit.document_id == doc.id).first()
            audit_id = matching_audit.id if matching_audit else doc.id
            
            if doc.filename in name_map.values():
                continue

            if doc.filename.startswith("Audit_") or doc.filename == "proposal.pdf" or audit_id in name_map:
                new_name = name_map.get(audit_id, f"Corporate_Audit_Report_{audit_id}.pdf")
                print(f"Updating Doc #{doc.id} (Audit #{audit_id}) from '{doc.filename}' -> '{new_name}'")
                doc.filename = new_name
                updated_count += 1

        db.commit()
        print(f"Successfully updated {updated_count} document filenames in PostgreSQL database.")
    except Exception as e:
        db.rollback()
        print(f"Error updating filenames: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_filenames()
