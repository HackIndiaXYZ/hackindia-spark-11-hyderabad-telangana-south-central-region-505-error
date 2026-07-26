import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.legal.node import legal_node

def test_legal_agent_gdpr_privacy():
    """
    Phase 1 Unit Test — Legal Agent
    Input: The company stores customer information.
    Expected: GDPR Issues, High Risk, Missing Privacy Policy
    """
    input_text = "The company stores customer information without privacy consent clause."
    state = {"document_text": input_text}

    result_state = legal_node(state)
    legal_result = result_state.get("legal_result", {})

    assert legal_result is not None, "Legal agent result should not be None"

    issues = legal_result.get("issues", [])
    missing_docs = legal_result.get("missing_documents", [])
    
    issue_titles = [i.get("issue", "") if isinstance(i, dict) else getattr(i, "issue", "") for i in issues]
    issue_str = " ".join(issue_titles).lower() + " " + " ".join(missing_docs).lower()

    # Check assertions specified in Phase 1 requirements
    assert legal_result.get("overall_risk", "").upper() in ["HIGH", "CRITICAL"], f"Expected High Risk, got {legal_result.get('overall_risk')}"
    assert "gdpr" in issue_str or "privacy" in issue_str, "Legal agent must detect GDPR / Privacy issues"
    assert "privacy policy" in issue_str or "privacy policy" in [d.lower() for d in missing_docs], "Legal agent must identify Missing Privacy Policy"

    print("\n[PASSED] Legal Agent Unit Test PASSED!")

if __name__ == "__main__":
    test_legal_agent_gdpr_privacy()
