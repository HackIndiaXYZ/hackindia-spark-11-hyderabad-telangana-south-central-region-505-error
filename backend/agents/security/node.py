from graph.state import AgentState
from graph.llm import get_llm
from agents.security.prompt import security_prompt_template
from agents.security.parser import parse_security_response
from agents.security.rules import run_security_rules
from utils.logger import get_logger

logger = get_logger("security_node")

def security_node(state: AgentState) -> AgentState:
    """
    Security Agent Node in LangGraph.
    Reads document text from state, executes rules, calls LLM, validates output schema,
    and updates state with security_result.
    """
    logger.info("Security Node started...")
    document_text = state.get("document_text", "")
    if not document_text:
        logger.error("No document text found in state.")
        return {
            "security_result": {
                "overall_risk": "High",
                "risk_score": 100,
                "summary": "Error: Empty document provided to Security node.",
                "issues": [],
                "attack_surface": ["Complete document content"]
            }
        }

    # 1. Deterministic Rule Checks
    logger.info("Running deterministic security rules...")
    rule_res = run_security_rules(document_text)
    deterministic_issues = rule_res.get("rule_issues", [])
    deterministic_surface = rule_res.get("attack_surface", [])

    # 2. Invoke LLM Chain
    logger.info("Generating prompt and invoking Ollama for Security Agent...")
    llm = get_llm()
    chain = security_prompt_template | llm
    response = chain.invoke({"document_text": document_text})

    raw_content = response.content if hasattr(response, "content") else str(response)
    logger.info("LLM response received by Security Node.")

    # 3. Parse & Validate Response against SecurityReport Schema
    security_parsed = parse_security_response(raw_content)

    # 4. Merge Rule-Based Findings with LLM Findings
    if deterministic_issues or deterministic_surface:
        logger.info(f"Security rules detected {len(deterministic_issues)} issue(s) & {len(deterministic_surface)} attack vector(s).")
        existing_issues = security_parsed.get("issues", [])
        existing_titles = {i.get("issue", "").lower() for i in existing_issues}
        
        new_rule_issues = [ri for ri in deterministic_issues if ri.get("issue", "").lower() not in existing_titles]
        merged_issues = new_rule_issues + existing_issues
        
        # Re-sort merged issues by severity
        sev_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
        security_parsed["issues"] = sorted(
            merged_issues,
            key=lambda x: sev_weights.get(x.get("severity", "Medium"), 1),
            reverse=True
        )

        existing_surface = set(security_parsed.get("attack_surface", []))
        existing_surface.update(deterministic_surface)
        security_parsed["attack_surface"] = list(existing_surface)

        has_critical = any(i.get("severity") == "Critical" for i in merged_issues)
        if has_critical:
            security_parsed["overall_risk"] = "Critical"
            security_parsed["risk_score"] = max(security_parsed.get("risk_score", 50), 92)
        elif len(merged_issues) >= 3:
            security_parsed["overall_risk"] = "High"
            security_parsed["risk_score"] = max(security_parsed.get("risk_score", 50), 75)

    logger.info("Security Node completed successfully.")
    return {
        "security_result": security_parsed
    }
