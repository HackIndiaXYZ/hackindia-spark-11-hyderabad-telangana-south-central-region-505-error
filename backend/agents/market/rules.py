import re
from typing import Dict, Any, List

def run_market_rules(text: str) -> Dict[str, Any]:
    """
    Executes deterministic business heuristic checks against proposal text
    to identify missing commercial strategy, target audience, pricing, or competition data.
    """
    rule_issues = []
    text_lower = text.lower()

    # Rule 1: High Pricing Risk vs Competitors
    if re.search(r'priced\s*(\d+)%\s*higher\s*than\s*competitors', text_lower) or 'higher than competitors' in text_lower:
        rule_issues.append({
            "issue": "Pricing Risk",
            "severity": "High",
            "category": "Pricing Strategy",
            "reason": "Product pricing is significantly higher than established market competitors without clear value justification.",
            "recommendation": "Review pricing strategy, benchmark against competitor tiers, or justify premium with unique value proposition.",
            "reference": "Value-Based Pricing & Competitive Benchmarking"
        })

    # Rule 2: No competitor mentioned
    if not re.search(r'\b(competitors?|competition|competing|alternatives|versus|vs\.?)\b', text_lower) or 'no competitor' in text_lower or 'no competitors' in text_lower:
        rule_issues.append({
            "issue": "Competitive Analysis Missing",
            "severity": "High",
            "category": "Competition",
            "reason": "The proposal does not analyze existing market competitors or industry alternatives.",
            "recommendation": "Conduct a competitor analysis matrix highlighting key features, advantages, and pricing benchmarks.",
            "reference": "Competitive Strategy Framework (Porter's Five Forces)"
        })

    # Rule 3: No pricing strategy mentioned
    if not re.search(r'\b(price|priced|pricing|tier|cost|subscription|fee|month|year|\$|\u20b9|rate)\b', text_lower) or 'no pricing' in text_lower:
        rule_issues.append({
            "issue": "Pricing Strategy Missing",
            "severity": "High",
            "category": "Pricing",
            "reason": "No monetization tiers, subscription fees, or pricing structure are defined.",
            "recommendation": "Establish explicit pricing tiers (e.g. Starter, Business, Enterprise) based on willingness to pay.",
            "reference": "Monetization & Value-Based Pricing Principles"
        })

    # Rule 4: Undefined / Generic Customer Segment ("for everyone")
    if 'product for everyone' in text_lower or 'everyone' in text_lower and not re.search(r'\b(smes?|enterprises?|b2b|b2c|consumers?|developers?|clients?|customers?)\b', text_lower) or 'no customer' in text_lower:
        rule_issues.append({
            "issue": "Undefined Customer Segment",
            "severity": "High",
            "category": "Target Audience",
            "reason": "The target market is stated generically ('for everyone') without clear niche positioning or ICP definition.",
            "recommendation": "Narrow target customer segments down to specific industry verticals and company sizes.",
            "reference": "Target Market Segmentation Framework"
        })

    return {
        "rule_issues": rule_issues
    }
