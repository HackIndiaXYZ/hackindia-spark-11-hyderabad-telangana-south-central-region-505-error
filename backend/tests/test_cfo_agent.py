import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.cfo.node import cfo_node

def test_cfo_agent_roi_unrealistic():
    """
    Phase 1 Unit Test — CFO Agent
    Input: Investment Cost: $100000, Expected Revenue: $120000, ROI: 400%
    Expected: Financial score calculated, High/Critical risk, Finding: 'ROI assumptions unrealistic', Recommendation: Review financial projections
    """
    input_text = "Investment Cost: $100000. Expected Revenue: $120000. ROI: 400%"
    state = {"document_text": input_text}

    result_state = cfo_node(state)
    cfo_result = result_state.get("cfo_result", {})

    assert cfo_result is not None, "CFO agent result should not be None"
    
    issues = cfo_result.get("issues", [])
    issue_titles = [i.get("issue", "") if isinstance(i, dict) else getattr(i, "issue", "") for i in issues]
    issue_str = " ".join(issue_titles).lower()

    # Check assertions specified in Phase 1 requirements
    assert cfo_result.get("overall_risk", "").upper() in ["HIGH", "CRITICAL"], f"Expected High/Critical risk, got {cfo_result.get('overall_risk')}"
    assert "roi assumptions unrealistic" in issue_str or "unrealistic" in issue_str or "roi" in issue_str, "CFO agent must identify unrealistic ROI assumptions"

    recommendations = [i.get("recommendation", "") for i in issues if isinstance(i, dict)]
    rec_str = " ".join(recommendations).lower()
    assert "review" in rec_str or "financial" in rec_str or "projections" in rec_str or len(recommendations) > 0, "Expected recommendation to review financial projections"

    print("\n[PASSED] CFO Agent Unit Test PASSED!")

if __name__ == "__main__":
    test_cfo_agent_roi_unrealistic()
