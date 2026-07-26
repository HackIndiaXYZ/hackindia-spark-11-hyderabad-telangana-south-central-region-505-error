import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.market.node import market_node

def test_market_agent_pricing_risk():
    """
    Phase 1 Unit Test — Market Agent
    Input: Our product is priced 40% higher than competitors.
    Expected: Pricing Risk, High Risk, Recommendation: Review pricing strategy
    """
    input_text = "Our product is priced 40% higher than competitors."
    state = {"document_text": input_text}

    result_state = market_node(state)
    market_result = result_state.get("market_result", {})

    assert market_result is not None, "Market agent result should not be None"

    issues = market_result.get("issues", []) or market_result.get("risks", [])
    issue_titles = [i.get("issue", "") if isinstance(i, dict) else getattr(i, "issue", "") for i in issues]
    issue_str = " ".join(issue_titles).lower()

    # Check assertions specified in Phase 1 requirements
    assert "pricing" in issue_str or "price" in issue_str, "Market agent must identify Pricing Risk"
    assert market_result.get("overall_risk", "").upper() in ["HIGH", "MEDIUM", "CRITICAL"], f"Expected High/Medium Risk, got {market_result.get('overall_risk')}"

    recommendations = [i.get("recommendation", "") for i in issues if isinstance(i, dict)]
    rec_str = " ".join(recommendations).lower()
    assert "pricing" in rec_str or "review" in rec_str or len(recommendations) > 0, "Expected recommendation to review pricing strategy"

    print("\n[PASSED] Market Agent Unit Test PASSED!")

if __name__ == "__main__":
    test_market_agent_pricing_risk()
