import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from graph.workflow import app_graph
from utils.pdf_reader import extract_text

def run_test_scenario(name: str, document_text: str):
    print(f"\n==========================================")
    print(f"--- Running {name} ---")
    initial_state = {"document_text": document_text}
    final_state = app_graph.invoke(initial_state)
    legal_res = final_state.get("legal_result", {})
    print("Legal Result Summary:")
    print(f"Overall Risk : {legal_res.get('overall_risk')}")
    print(f"Risk Score   : {legal_res.get('risk_score')}")
    print(f"Summary      : {legal_res.get('summary')}")
    print(f"Issues Count : {len(legal_res.get('issues', []))}")
    print(json.dumps(legal_res, indent=2))

def test_scenario_1():
    doc = """
    Our company stores customer Aadhaar numbers.
    No Privacy Policy exists.
    No Terms & Conditions are available.
    No employee confidentiality agreement.
    """
    run_test_scenario("Test 1: Sensitive IDs & Missing Policies", doc)

def test_scenario_2():
    doc = """
    Customer information is shared with external marketing partners.
    No user opt-in or customer consent was obtained.
    No Data Processing Agreement exists with marketing partners.
    """
    run_test_scenario("Test 2: Data Sharing Without Consent (GDPR Risk)", doc)

def test_scenario_3():
    doc = """
    All customer data is encrypted in transit and at rest.
    A published Privacy Policy and Terms of Service exist.
    Employee NDAs and contracts are fully signed and audited annually.
    """
    run_test_scenario("Test 3: Compliant Setup", doc)

def test_scenario_4():
    doc = """
    User passwords are stored in plain text in database.
    Sensitive financial documents and customer databases are publicly accessible on the web.
    No access controls or encryption configured.
    """
    run_test_scenario("Test 4: Plaintext Passwords & Exposed Data (Critical Risk)", doc)

def test_pdf():
    pdf_path = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
    if os.path.exists(pdf_path):
        text = extract_text(pdf_path)
        run_test_scenario("Test 5: Sample PDF Extraction", text)

if __name__ == "__main__":
    test_scenario_1()
    test_scenario_2()
    test_scenario_3()
    test_scenario_4()
    test_pdf()
