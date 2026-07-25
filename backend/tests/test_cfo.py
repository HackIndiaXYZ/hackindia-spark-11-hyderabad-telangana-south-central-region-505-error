import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from graph.workflow import app_graph
from utils.pdf_reader import extract_text

def test_cfo_text():
    sample_document = """
    Project Name: AI Corporate Auditor
    Investment: $50,000
    Expected Revenue: $20,000,000
    Timeline: 30 days
    Employees: 4
    Marketing Budget: $500
    Cloud Cost: $15/month
    """
    print("--- Testing LangGraph CFO Agent on Sample Text ---")
    initial_state = {"document_text": sample_document}
    final_state = app_graph.invoke(initial_state)
    
    print("\nCFO Analysis Result:")
    print(json.dumps(final_state.get("cfo_result"), indent=2))

def test_cfo_pdf():
    sample_pdf = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
    if os.path.exists(sample_pdf):
        print("\n--- Testing LangGraph CFO Agent on Sample PDF ---")
        text = extract_text(sample_pdf)
        initial_state = {"document_text": text}
        final_state = app_graph.invoke(initial_state)
        print(json.dumps(final_state.get("cfo_result"), indent=2))
    else:
        print(f"\n[INFO] No sample PDF found at '{sample_pdf}'.")

if __name__ == "__main__":
    test_cfo_text()
    test_cfo_pdf()
