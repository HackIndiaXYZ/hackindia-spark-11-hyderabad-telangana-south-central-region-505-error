from graph.state import AgentState
from graph.llm import get_llm
from agents.market.prompt import market_prompt_template
from agents.market.parser import parse_market_response
from agents.market.rules import run_market_rules
from utils.logger import get_logger

logger = get_logger("market_node")

def market_node(state: AgentState) -> AgentState:
    """
    Market Agent Node in LangGraph.
    Reads document text from state, executes business rules, calls LLM,
    validates output schema, and updates state with market_result.
    """
    logger.info("Market Node started...")
    document_text = state.get("document_text", "")
    if not document_text:
        logger.error("No document text found in state.")
        return {
            "market_result": {
                "overall_risk": "High",
                "risk_score": 100,
                "market_readiness_score": 0,
                "summary": "Error: Empty document provided to Market node.",
                "business_model": "Undefined",
                "issues": [],
                "opportunities": [],
                "competitors": [],
                "swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}
            }
        }

    # 1. Deterministic Business Rule Checks
    logger.info("Running deterministic market rules...")
    rule_res = run_market_rules(document_text)
    deterministic_issues = rule_res.get("rule_issues", [])

    # 2. Invoke LLM Chain
    logger.info("Generating prompt and invoking Ollama for Market Agent...")
    llm = get_llm()
    chain = market_prompt_template | llm
    response = chain.invoke({"document_text": document_text})

    raw_content = response.content if hasattr(response, "content") else str(response)
    logger.info("LLM response received by Market Node.")

    # 3. Parse & Validate Response against MarketReport Schema
    market_parsed = parse_market_response(raw_content)

    # 4. Merge Rule-Based Findings with LLM Findings
    if deterministic_issues:
        logger.info(f"Market rules detected {len(deterministic_issues)} issue(s).")
        existing_issues = market_parsed.get("issues", [])
        existing_titles = {i.get("issue", "").lower() for i in existing_issues}
        
        new_rule_issues = [ri for ri in deterministic_issues if ri.get("issue", "").lower() not in existing_titles]
        merged_issues = new_rule_issues + existing_issues
        
        sev_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
        market_parsed["issues"] = sorted(
            merged_issues,
            key=lambda x: sev_weights.get(x.get("severity", "Medium"), 1),
            reverse=True
        )

        # Recalculate readiness and risk scores based on issues count
        if len(merged_issues) >= 4:
            market_parsed["overall_risk"] = "High"
            market_parsed["risk_score"] = max(market_parsed.get("risk_score", 50), 80)
            market_parsed["market_readiness_score"] = min(market_parsed.get("market_readiness_score", 50), 30)

    logger.info("Market Node completed successfully.")
    return {
        "market_result": market_parsed
    }
