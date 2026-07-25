from graph.state import AgentState
from graph.llm import get_llm
from agents.legal.prompt import legal_prompt_template
from agents.legal.parser import parse_legal_response
from agents.legal.rules import run_legal_rules
from utils.logger import get_logger

logger = get_logger("legal_node")

def legal_node(state: AgentState) -> AgentState:
    """
    Legal Agent Node in LangGraph.
    Reads document text from state, executes rules, calls LLM, and validates output schema.
    """
    logger.info("Legal Node started...")
    document_text = state.get("document_text", "")
    if not document_text:
        logger.error("No document text found in state.")
        return {
            "legal_result": {
                "overall_risk": "High",
                "risk_score": 100,
                "summary": "Error: Empty document provided to Legal node.",
                "issues": [],
                "missing_documents": ["Complete document content"]
            }
        }

    # 1. Deterministic Rule Checks
    logger.info("Running deterministic legal rules...")
    rule_check_res = run_legal_rules(document_text)
    deterministic_issues = rule_check_res.get("rule_issues", [])
    deterministic_missing_docs = rule_check_res.get("missing_documents", [])

    # 2. Invoke LLM Chain
    logger.info("Generating prompt and invoking Ollama for Legal Agent...")
    llm = get_llm()
    chain = legal_prompt_template | llm
    response = chain.invoke({"document_text": document_text})

    raw_content = response.content if hasattr(response, "content") else str(response)
    logger.info("LLM response received by Legal Node.")

    # 3. Parse & Validate Response
    legal_parsed = parse_legal_response(raw_content)

    # 4. Merge Rule-Based Findings with LLM Findings
    if deterministic_issues or deterministic_missing_docs:
        logger.info(f"Legal rules detected {len(deterministic_issues)} issue(s) & {len(deterministic_missing_docs)} missing doc(s).")
        existing_issues = legal_parsed.get("issues", [])
        existing_titles = {i.get("issue", "").lower() for i in existing_issues}
        new_rule_issues = [ri for ri in deterministic_issues if ri.get("issue", "").lower() not in existing_titles]
        
        merged_issues = new_rule_issues + existing_issues
        legal_parsed["issues"] = merged_issues
        
        existing_missing = set(legal_parsed.get("missing_documents", []))
        existing_missing.update(deterministic_missing_docs)
        legal_parsed["missing_documents"] = list(existing_missing)
        
        has_critical = any(i.get("severity") == "Critical" for i in merged_issues)
        if has_critical:
            legal_parsed["overall_risk"] = "Critical"
            legal_parsed["risk_score"] = max(legal_parsed.get("risk_score", 50), 90)
        elif len(merged_issues) >= 3:
            legal_parsed["overall_risk"] = "High"
            legal_parsed["risk_score"] = max(legal_parsed.get("risk_score", 50), 75)

    logger.info("Legal Node completed successfully.")
    return {
        "legal_result": legal_parsed
    }
