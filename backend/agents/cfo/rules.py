import re
from typing import Dict, Any, List

def run_cfo_rules(text: str) -> List[Dict[str, Any]]:
    """
    Executes rule-based Python checks on the document text to detect 
    impossible ROI ratios, unrealistic timelines, or severe cost imbalances.
    """
    deterministic_issues = []
    
    cost_match = re.search(r'(?:cost|investment|investment cost|budget)\s*:\s*\$?([\d,]+)', text, re.IGNORECASE)
    rev_match = re.search(r'(?:revenue|expected revenue)\s*:\s*\$?([\d,]+)\s*(million|m|billion|b)?', text, re.IGNORECASE)
    roi_match = re.search(r'roi\s*:\s*([\d,]+)%?', text, re.IGNORECASE)
    timeline_match = re.search(r'timeline\s*:\s*(\d+)\s*(days?|months?|years?)', text, re.IGNORECASE)
    
    if cost_match and rev_match:
        try:
            cost_val = float(cost_match.group(1).replace(',', ''))
            rev_val = float(rev_match.group(1).replace(',', ''))
            unit = (rev_match.group(2) or '').lower()
            if unit in ['million', 'm']:
                rev_val *= 1_000_000
            elif unit in ['billion', 'b']:
                rev_val *= 1_000_000_000
                
            if cost_val > 0:
                roi_multiplier = rev_val / cost_val
                calc_roi = ((rev_val - cost_val) / cost_val) * 100
                
                if roi_match:
                    claimed_roi = float(roi_match.group(1).replace(',', ''))
                    if abs(claimed_roi - calc_roi) > 10 or claimed_roi > 100:
                        deterministic_issues.append({
                            "issue": "ROI assumptions unrealistic",
                            "severity": "High",
                            "reason": f"Claimed ROI ({claimed_roi:.0f}%) contradicts actual calculated return ({calc_roi:.1f}%) for cost (${cost_val:,.0f}) and revenue (${rev_val:,.0f}).",
                            "recommendation": "Review financial projections and align ROI calculations with actual baseline revenue model."
                        })
                elif roi_multiplier > 50:
                    deterministic_issues.append({
                        "issue": "Unrealistic Financial Multiplier / ROI Anomaly",
                        "severity": "Critical",
                        "reason": f"Projected revenue (${rev_val:,.0f}) is {roi_multiplier:.1f}x higher than initial investment (${cost_val:,.0f}).",
                        "recommendation": "Provide detailed unit economics and sales funnel metrics to justify hyper-growth assumptions."
                    })
        except Exception:
            pass

    if timeline_match:
        try:
            days = int(timeline_match.group(1))
            unit = timeline_match.group(2).lower()
            if 'day' in unit and days <= 60 and rev_match:
                deterministic_issues.append({
                    "issue": "Overly Aggressive Execution Timeline",
                    "severity": "High",
                    "reason": f"Execution timeline of {days} days is insufficient to realize multi-million dollar revenue pipelines.",
                    "recommendation": "Extend product development, go-to-market, and sales cycle timeline to realistic multi-quarter horizons."
                })
        except Exception:
            pass
            
    return deterministic_issues
