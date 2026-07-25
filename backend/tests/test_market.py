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
    mkt_res = final_state.get("market_result", {})
    print("Market Result Summary:")
    print(f"Overall Risk           : {mkt_res.get('overall_risk')}")
    print(f"Risk Score             : {mkt_res.get('risk_score')}")
    print(f"Market Readiness Score : {mkt_res.get('market_readiness_score')}")
    print(f"Business Model         : {mkt_res.get('business_model')}")
    print(f"Summary                : {mkt_res.get('summary')}")
    print(f"Competitors Count      : {len(mkt_res.get('competitors', []))}")
    print(f"Issues Count           : {len(mkt_res.get('issues', []))}")
    print(json.dumps(mkt_res, indent=2))

def test_scenario_1():
    doc = """
    We are building a new AI product.
    No competitor analysis included.
    No pricing model defined yet.
    No marketing strategy.
    """
    run_test_scenario("Test 1: Unstructured AI Pitch (No Pricing/Competitors)", doc)

def test_scenario_2():
    doc = """
    Target customers are small and medium enterprises (SMEs).
    SaaS subscription model at $99/month.
    Competitor analysis matrix compares vs Competitor A, Competitor B, and Competitor C.
    Unique features include automated multi-agent AI compliance auditing.
    Marketing strategy includes digital ad campaigns and direct sales outreach.
    Expansion plan covers European markets in Q3.
    """
    run_test_scenario("Test 2: Well-Structured SME SaaS Pitch", doc)

def test_scenario_3():
    doc = """
    Our product is designed for everyone in the world.
    No target audience segmentation.
    No specific ICP defined.
    """
    run_test_scenario("Test 3: Generic Target Audience ('For Everyone')", doc)

def test_scenario_4():
    doc = """
    One-time payment model of $500.
    No marketing plan.
    No expansion or scalability roadmap.
    No recurring revenue stream.
    """
    run_test_scenario("Test 4: One-Time Payment Model Without GTM", doc)

def test_scenario_5():
    doc = """
    Enterprise AI Platform targeting mid-market and fortune 500 accounts.
    Pricing: ₹10,000/month per seat.
    Marketing: Outbound SDR team, industry events, and content marketing.
    Expansion: Scaling from India to APAC in 12 months.
    Competitor Comparison: Compared with Legacy Auditor X (faster execution) and Tool Y (better UI).
    SWOT: Strengths: Deep AI integration; Weaknesses: Brand awareness; Opportunities: High market demand; Threats: Fast followers.
    """
    run_test_scenario("Test 5: Enterprise Market Pitch with Full SWOT & Matrix", doc)

def test_pdf():
    pdf_path = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
    if os.path.exists(pdf_path):
        text = extract_text(pdf_path)
        run_test_scenario("Test 6: Sample PDF Market Ingestion", text)

if __name__ == "__main__":
    test_scenario_1()
    test_scenario_2()
    test_scenario_3()
    test_scenario_4()
    test_scenario_5()
    test_pdf()
