import json
from graph.state import AgentState
from graph.llm import get_llm
from agents.coordinator.prompt import coordinator_prompt_template
from agents.coordinator.parser import parse_audit_response
from agents.coordinator.scorer import calculate_consolidated_scores
from utils.logger import get_logger

logger = get_logger("coordinator_node")

def coordinator_node(state: AgentState) -> AgentState:
    """
    Coordinator Agent Node in LangGraph.
    Consumes outputs from CFO, Legal, Security, and Market nodes,
    computes deterministic scores, synthesizes an executive summary via LLM,
    and updates state with audit_result.
    """
    logger.info("Coordinator Node started...")
    
    cfo_res = state.get("cfo_result") or {}
    legal_res = state.get("legal_result") or {}
    security_res = state.get("security_result") or {}
    market_res = state.get("market_result") or {}

    # 1. Deterministic Scoring & Deduplication
    logger.info("Computing deterministic scores and deduplicating cross-agent findings...")
    scores_res = calculate_consolidated_scores(cfo_res, legal_res, security_res, market_res)
    
    overall_score = scores_res["overall_score"]
    overall_risk = scores_res["overall_risk"]
    agent_scores = scores_res["agent_scores"]
    deduped_findings = scores_res["deduplicated_findings"]

    # 2. Invoke LLM Chain for Executive Synthesis
    logger.info("Formatting prompt and invoking Ollama for Coordinator Agent...")
    llm = get_llm()
    chain = coordinator_prompt_template | llm
    
    response = chain.invoke({
        "cfo_json": json.dumps(cfo_res, indent=2),
        "legal_json": json.dumps(legal_res, indent=2),
        "security_json": json.dumps(security_res, indent=2),
        "market_json": json.dumps(market_res, indent=2)
    })

    raw_content = response.content if hasattr(response, "content") else str(response)
    logger.info("LLM response received by Coordinator Node.")

    # 3. Parse & Validate Response against AuditReport Schema
    audit_parsed = parse_audit_response(raw_content)

    # 4. Inject Deterministic Python Scoring & Findings into Result
    audit_parsed["overall_score"] = overall_score
    audit_parsed["overall_risk"] = overall_risk
    audit_parsed["agent_scores"] = agent_scores
    
    if deduped_findings:
        audit_parsed["critical_findings"] = deduped_findings

    # Set verdict based on risk level
    if overall_risk == "Critical":
        audit_parsed["overall_health_verdict"] = "Rejected - Severe Critical Risks"
    elif overall_risk == "High":
        audit_parsed["overall_health_verdict"] = "High Risk - Requires Immediate Remediation"
    elif overall_risk == "Medium":
        audit_parsed["overall_health_verdict"] = "Conditional Approval - Remediate Moderate Gaps"
    else:
        audit_parsed["overall_health_verdict"] = "Approved - Low Risk Infrastructure"

    logger.info("Coordinator Node completed successfully.")
    return {
        "audit_result": audit_parsed
    }
