import re
from typing import Dict, Any, List

def run_market_rules(text: str) -> Dict[str, Any]:
    """
    Executes deterministic business heuristic checks against proposal text
    to identify missing commercial strategy, target audience, pricing, or competition data.
    """
    rule_issues = []
    text_lower = text.lower()

    # Rule 1: No competitor mentioned
    if not re.search(r'\b(competitors?|competition|competing|alternatives|versus|vs\.?)\b', text_lower) or 'no competitor' in text_lower or 'no competitors' in text_lower:
        rule_issues.append({
            "issue": "Competitive Analysis Missing",
            "severity": "High",
            "category": "Competition",
            "reason": "The proposal does not analyze existing market competitors or industry alternatives.",
            "recommendation": "Conduct a competitor analysis matrix highlighting key features, advantages, and pricing benchmarks.",
            "reference": "Competitive Strategy Framework (Porter's Five Forces)"
        })

    # Rule 2: No pricing strategy mentioned
    if not re.search(r'\b(price|pricing|tier|cost|subscription|fee|month|year|\$|\u20b9|rate)\b', text_lower) or 'no pricing' in text_lower:
        rule_issues.append({
            "issue": "Pricing Strategy Missing",
            "severity": "High",
            "category": "Pricing",
            "reason": "No monetization tiers, subscription fees, or pricing structure are defined.",
            "recommendation": "Establish explicit pricing tiers (e.g. Starter, Business, Enterprise) based on willingness to pay.",
            "reference": "Monetization & Value-Based Pricing Principles"
        })

    # Rule 3: Undefined / Generic Customer Segment ("for everyone")
    if 'product for everyone' in text_lower or 'everyone' in text_lower and not re.search(r'\b(smes?|enterprises?|b2b|b2c|consumers?|developers?|clients?|customers?)\b', text_lower) or 'no customer' in text_lower:
        rule_issues.append({
            "issue": "Undefined Customer Segment",
            "severity": "High",
            "category": "Target Audience",
            "reason": "The target market is stated generically ('for everyone') without clear niche positioning or ICP definition.",
            "recommendation": "Narrow target customer segments down to specific industry verticals and company sizes.",
            "reference": "Target Market Segmentation Framework"
        })

    # Rule 4: Single Revenue Source Risk / One-time payment
    if 'one-time payment' in text_lower or 'one time payment' in text_lower:
        rule_issues.append({
            "issue": "Single Non-Recurring Revenue Stream Risk",
            "severity": "Medium",
            "category": "Business Model",
            "reason": "Relying solely on one-time payments limits Customer Lifetime Value (LTV) and predictable ARR.",
            "recommendation": "Introduce recurring subscription modules, maintenance plans, or add-on service models.",
            "reference": "SaaS Unit Economics (LTV/CAC Optimization)"
        })

    # Rule 5: No Scalability / Expansion Plan
    if not re.search(r'\b(scalab|expans|growth|apac|global|enterprises|scale|pipeline)\b', text_lower) or 'no expansion' in text_lower:
        rule_issues.append({
            "issue": "Scalability & Expansion Strategy Undefined",
            "severity": "Medium",
            "category": "Growth & Scalability",
            "reason": "The proposal lacks a clear roadmap for scaling operationally and expanding into new markets.",
            "recommendation": "Outline a multi-phase growth roadmap covering geographic, enterprise, and product expansions.",
            "reference": "Product-Led & Sales-Led Growth Frameworks"
        })

    # Rule 6: No Marketing / Go-To-Market Strategy
    if 'no marketing' in text_lower or not re.search(r'\b(marketing|sales|channels|gtm|go-to-market|acquisition|outreach|seo|campaign)\b', text_lower):
        rule_issues.append({
            "issue": "Go-To-Market & Marketing Strategy Missing",
            "severity": "High",
            "category": "Marketing & GTM",
            "reason": "No customer acquisition channels, marketing budgets, or sales outreach strategies are outlined.",
            "recommendation": "Formulate a Go-To-Market strategy with defined CAC targets, inbound SEO, and outbound sales channels.",
            "reference": "Go-To-Market Execution Blueprint"
        })

    # Rule 7: No Unique Selling Proposition (USP)
    if 'no usp' in text_lower or not re.search(r'\b(unique|differentiats?|advantage|defensib|moat|proprietary|patented|unique features?)\b', text_lower):
        rule_issues.append({
            "issue": "Unique Selling Proposition (USP) Undefined",
            "severity": "High",
            "category": "Product Differentiation",
            "reason": "The proposal does not clearly state what makes the product unique compared to market alternatives.",
            "recommendation": "Define a clear USP and competitive moat (e.g. proprietary AI models, workflow integration speed).",
            "reference": "Value Proposition Canvas"
        })

    return {
        "rule_issues": rule_issues
    }
