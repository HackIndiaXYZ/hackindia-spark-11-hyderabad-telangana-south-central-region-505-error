import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.coordinator.node import coordinator_node
from graph.workflow import app_graph
from utils.pdf_reader import extract_text

def print_audit_result(name: str, audit_res: dict):
    print(f"\n==========================================")
    print(f"--- Running {name} ---")
    print(f"Overall Risk    : {audit_res.get('overall_risk')}")
    print(f"Overall Score   : {audit_res.get('overall_score')}")
    print(f"Verdict         : {audit_res.get('overall_health_verdict')}")
    print(f"Agent Scores    : {audit_res.get('agent_scores')}")
    print(f"Summary         : {audit_res.get('executive_summary')}")
    print(f"Critical Count  : {len(audit_res.get('critical_findings', []))}")
    print(json.dumps(audit_res, indent=2))

def test_scenario_1():
    # All agents return Low Risk
    state = {
        "cfo_result": {"overall_risk": "Low", "risk_score": 15, "issues": []},
        "legal_result": {"overall_risk": "Low", "risk_score": 20, "issues": []},
        "security_result": {"overall_risk": "Low", "risk_score": 10, "issues": []},
        "market_result": {"overall_risk": "Low", "risk_score": 25, "issues": []}
    }
    res = coordinator_node(state).get("audit_result", {})
    print_audit_result("Test 1: All Agents Low Risk", res)

def test_scenario_2():
    # Security = Critical, Others = Low
    state = {
        "cfo_result": {"overall_risk": "Low", "risk_score": 15, "issues": []},
        "legal_result": {"overall_risk": "Low", "risk_score": 20, "issues": []},
        "security_result": {
            "overall_risk": "Critical",
            "risk_score": 95,
            "issues": [{
                "issue": "Hardcoded API Keys",
                "severity": "Critical",
                "category": "Secrets Management",
                "reason": "Production API keys are hardcoded.",
                "recommendation": "Use environment variables."
            }]
        },
        "market_result": {"overall_risk": "Low", "risk_score": 25, "issues": []}
    }
    res = coordinator_node(state).get("audit_result", {})
    print_audit_result("Test 2: Security Critical Risk Spike", res)

def test_scenario_3():
    # CFO = High, Legal = High, Security = Medium, Market = Low
    state = {
        "cfo_result": {
            "overall_risk": "High",
            "risk_score": 85,
            "issues": [{
                "issue": "Unrealistic Revenue Multiplier",
                "severity": "High",
                "category": "CFO",
                "reason": "400x ROI in 30 days.",
                "recommendation": "Revise assumptions."
            }]
        },
        "legal_result": {
            "overall_risk": "High",
            "risk_score": 80,
            "issues": [{
                "issue": "Missing Privacy Policy",
                "severity": "High",
                "category": "Legal",
                "reason": "Customer data shared without privacy policy.",
                "recommendation": "Draft privacy policy."
            }]
        },
        "security_result": {"overall_risk": "Medium", "risk_score": 50, "issues": []},
        "market_result": {"overall_risk": "Low", "risk_score": 20, "issues": []}
    }
    res = coordinator_node(state).get("audit_result", {})
    print_audit_result("Test 3: Financial & Legal High Risk", res)

def test_scenario_4():
    # All agents return Critical
    state = {
        "cfo_result": {"overall_risk": "Critical", "risk_score": 95, "issues": []},
        "legal_result": {"overall_risk": "Critical", "risk_score": 90, "issues": []},
        "security_result": {"overall_risk": "Critical", "risk_score": 98, "issues": []},
        "market_result": {"overall_risk": "Critical", "risk_score": 88, "issues": []}
    }
    res = coordinator_node(state).get("audit_result", {})
    print_audit_result("Test 4: All Agents Critical Risk", res)

def test_scenario_5():
    # Missing Agent Reports (Partial State)
    state = {
        "cfo_result": {"overall_risk": "Medium", "risk_score": 50, "issues": []},
        "legal_result": None,
        "security_result": None,
        "market_result": None
    }
    res = coordinator_node(state).get("audit_result", {})
    print_audit_result("Test 5: Partial State (Missing Agents)", res)

def test_full_pdf_audit():
    pdf_path = os.path.join(os.path.dirname(__file__), "sample_documents", "proposal.pdf")
    if os.path.exists(pdf_path):
        text = extract_text(pdf_path)
        final_state = app_graph.invoke({"document_text": text})
        audit_res = final_state.get("audit_result", {})
        print_audit_result("Test 6: Full End-to-End PDF Audit Graph Execution", audit_res)

if __name__ == "__main__":
    test_scenario_1()
    test_scenario_2()
    test_scenario_3()
    test_scenario_4()
    test_scenario_5()
    test_full_pdf_audit()
