import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.coordinator.node import coordinator_node

def test_coordinator_agent_synthesis():
    """
    Phase 1 Unit Test — Coordinator Agent
    Input: Simulated outputs from all 4 domain specialist agents (CFO, Legal, Security, Market).
    Expected: Overall Score, Top Findings, Combined Recommendations, Executive Summary
    """
    cfo_output = {
        "overall_risk": "High",
        "risk_score": 85,
        "summary": "ROI assumptions unrealistic for baseline OPEX.",
        "issues": [{"issue": "ROI assumptions unrealistic", "severity": "High", "recommendation": "Review financial projections"}]
    }

    legal_output = {
        "overall_risk": "High",
        "risk_score": 80,
        "summary": "Customer data stored without documented privacy policy.",
        "issues": [{"issue": "GDPR Issues & Missing Privacy Policy", "severity": "High", "recommendation": "Publish GDPR privacy policy"}]
    }

    security_output = {
        "overall_risk": "Critical",
        "risk_score": 95,
        "summary": "Prompt injection pattern detected in document input.",
        "vulnerabilities": [{"issue": "Prompt Injection Detected", "severity": "Critical", "recommendation": "Sanitize prompt inputs"}]
    }

    market_output = {
        "overall_risk": "High",
        "risk_score": 75,
        "summary": "Product priced 40% higher than market competitors.",
        "issues": [{"issue": "Pricing Risk", "severity": "High", "recommendation": "Review pricing strategy"}]
    }

    state = {
        "cfo_result": cfo_output,
        "legal_result": legal_output,
        "security_result": security_output,
        "market_result": market_output,
        "document_text": "Sample document for coordinator synthesis test."
    }

    result_state = coordinator_node(state)
    audit_result = result_state.get("audit_result", {})

    assert audit_result is not None, "Coordinator audit_result should not be None"

    # Assert overall score presence
    overall_score = audit_result.get("overall_score")
    assert overall_score is not None and isinstance(overall_score, (int, float)), f"Expected numerical overall_score, got {overall_score}"

    # Assert Executive Summary presence
    exec_summary = audit_result.get("executive_summary", "")
    assert len(exec_summary) > 0, "Coordinator must generate Executive Summary"

    # Assert Critical / Top Findings presence
    findings = audit_result.get("critical_findings", [])
    assert len(findings) > 0, "Coordinator must consolidate Top Findings"

    # Assert Combined Recommendations presence
    recs = audit_result.get("recommendations", [])
    assert len(recs) > 0, "Coordinator must consolidate Combined Recommendations"

    print(f"\n[PASSED] Coordinator Agent Unit Test PASSED! Overall Score: {overall_score}/100, Risk: {audit_result.get('overall_risk')}")

if __name__ == "__main__":
    test_coordinator_agent_synthesis()
