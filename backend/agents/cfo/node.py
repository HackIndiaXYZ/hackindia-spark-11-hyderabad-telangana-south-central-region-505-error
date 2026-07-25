from graph.state import AgentState
from graph.llm import get_llm
from agents.cfo.prompt import cfo_prompt_template
from agents.cfo.parser import parse_cfo_response
from agents.cfo.rules import run_cfo_rules
from utils.logger import get_logger

logger = get_logger("cfo_node")

def cfo_node(state: AgentState) -> AgentState:
    """
    CFO Agent Node in LangGraph.
    Reads document text from state, calls LLM, applies rules, and validates output schema.
    """
    logger.info("CFO Node started...")
    document_text = state.get("document_text", "")
    if not document_text:
        logger.error("No document text found in state.")
        return {
            "cfo_result": {
                "overall_risk": "High",
                "risk_score": 100,
                "summary": "Error: Empty document provided to CFO node.",
                "issues": [],
                "missing_information": ["Complete document content"]
            }
        }

    # 1. Prepare Prompt & Call LLM
    logger.info("Generating prompt and invoking Ollama for CFO Agent...")
    llm = get_llm()
    chain = cfo_prompt_template | llm
    response = chain.invoke({"document_text": document_text})
    
    raw_content = response.content if hasattr(response, "content") else str(response)
    logger.info("LLM response received by CFO Node.")

    # 2. Parse & Validate Response against Pydantic Schema
    cfo_parsed = parse_cfo_response(raw_content)

    # 3. Apply Deterministic Python Rule-Based Financial Checks
    logger.info("Running deterministic CFO rules...")
    deterministic_issues = run_cfo_rules(document_text)
    if deterministic_issues:
        logger.info(f"CFO rules detected {len(deterministic_issues)} deterministic issue(s).")
        existing_issues = cfo_parsed.get("issues", [])
        cfo_parsed["issues"] = deterministic_issues + existing_issues
        cfo_parsed["risk_score"] = max(cfo_parsed.get("risk_score", 50), 85)
        cfo_parsed["overall_risk"] = "High"

    logger.info("CFO Node completed successfully.")
    return {
        "cfo_result": cfo_parsed
    }
