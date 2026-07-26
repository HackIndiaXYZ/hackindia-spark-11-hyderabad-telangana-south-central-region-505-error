import os
import sys
import time
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from graph.workflow import app_graph
from utils.pdf_reader import extract_text

def test_parallel_execution():
    doc = """
    Project Name: Enterprise AI Corporate Auditor
    Investment: $50,000
    Expected Revenue: $20,000,000
    Timeline: 30 days
    
    DATABASE_PASSWORD=admin123
    OPENAI_API_KEY=sk-proj-99887766554433221100
    
    Customer data is shared with third-party marketing companies without opt-in consent.
    No Privacy Policy or Terms & Conditions exist.
    
    Pricing model is undefined and no competitor analysis was performed.
    """
    print("\n==========================================")
    print("--- Testing Parallel LangGraph Execution ---")
    start = time.time()
    
    initial_state = {"document_text": doc}
    final_state = app_graph.invoke(initial_state)
    
    elapsed = round(time.time() - start, 2)
    print(f"\nExecution Completed in {elapsed} seconds!")
    
    audit_res = final_state.get("audit_result", {})
    print(f"Overall Risk    : {audit_res.get('overall_risk')}")
    print(f"Overall Score   : {audit_res.get('overall_score')}")
    print(f"Verdict         : {audit_res.get('overall_health_verdict')}")
    print(f"Agent Scores    : {audit_res.get('agent_scores')}")
    print(f"Critical Count  : {len(audit_res.get('critical_findings', []))}")
    print("\nConsolidated Audit Report:")
    print(json.dumps(audit_res, indent=2))

def test_pdf_parallel():
    pdf_path = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
    if os.path.exists(pdf_path):
        print("\n==========================================")
        print("--- Testing Parallel PDF Audit Execution ---")
        start = time.time()
        text = extract_text(pdf_path)
        final_state = app_graph.invoke({"document_text": text})
        elapsed = round(time.time() - start, 2)
        print(f"PDF Parallel Audit Completed in {elapsed} seconds!")
        print(json.dumps(final_state.get("audit_result"), indent=2))

if __name__ == "__main__":
    test_parallel_execution()
    test_pdf_parallel()
