from typing import Dict, Any, List

def calculate_consolidated_scores(
    cfo_res: Dict[str, Any],
    legal_res: Dict[str, Any],
    security_res: Dict[str, Any],
    market_res: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes deterministic risk scores, overall risk level, agent scores,
    and deduplicates findings across domain reports.
    """
    agent_scores = {
        "cfo": cfo_res.get("risk_score", 0) if cfo_res else 0,
        "legal": legal_res.get("risk_score", 0) if legal_res else 0,
        "security": security_res.get("risk_score", 0) if security_res else 0,
        "market": market_res.get("risk_score", 0) if market_res else 0,
    }

    # Filter non-zero active agent scores
    active_scores = [score for score in agent_scores.values() if score > 0]
    
    if not active_scores:
        return {
            "overall_score": 0,
            "overall_risk": "Low",
            "agent_scores": agent_scores,
            "deduplicated_findings": []
        }

    max_score = max(active_scores)
    avg_score = sum(active_scores) / len(active_scores)

    # Weighted calculation favoring maximum domain risk
    consolidated_score = int((max_score * 0.6) + (avg_score * 0.4))
    consolidated_score = max(0, min(100, consolidated_score))

    if consolidated_score >= 85:
        overall_risk = "Critical"
    elif consolidated_score >= 65:
        overall_risk = "High"
    elif consolidated_score >= 35:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    # Deduplicate Findings Across Agents
    agent_reports = [
        ("CFO", cfo_res),
        ("Legal", legal_res),
        ("Security", security_res),
        ("Market", market_res)
    ]

    findings_map = {}
    for agent_name, report in agent_reports:
        if not report:
            continue
        issues = report.get("issues", [])
        for issue in issues:
            title = issue.get("issue", "Unspecified Issue").strip()
            title_key = title.lower()
            
            if title_key in findings_map:
                if agent_name not in findings_map[title_key]["reported_by"]:
                    findings_map[title_key]["reported_by"].append(agent_name)
            else:
                findings_map[title_key] = {
                    "title": title,
                    "severity": issue.get("severity", "Medium"),
                    "category": issue.get("category", agent_name),
                    "reported_by": [agent_name],
                    "reason": issue.get("reason", ""),
                    "recommendation": issue.get("recommendation", "")
                }

    # Convert map back to list and sort by severity
    sev_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    deduped_list = list(findings_map.values())
    deduped_list.sort(key=lambda x: sev_weights.get(x.get("severity", "Medium"), 1), reverse=True)

    return {
        "overall_score": consolidated_score,
        "overall_risk": overall_risk,
        "agent_scores": agent_scores,
        "deduplicated_findings": deduped_list
    }
