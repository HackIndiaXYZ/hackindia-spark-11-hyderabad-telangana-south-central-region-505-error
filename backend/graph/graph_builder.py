from langgraph.graph import StateGraph, START, END
from graph.state import AgentState
from agents.cfo.node import cfo_node
from agents.legal.node import legal_node
from agents.security.node import security_node
from agents.market.node import market_node
from agents.coordinator.node import coordinator_node
from utils.logger import get_logger

logger = get_logger("graph_builder")

def build_graph():
    """
    Constructs and compiles the StateGraph workflow connecting:
    START -> CFO Node -> Legal Node -> Security Node -> Market Node -> Coordinator Node -> END
    """
    logger.info("Initializing LangGraph StateGraph builder with CFO, Legal, Security, Market, and Coordinator nodes...")
    builder = StateGraph(AgentState)

    # Register Nodes
    builder.add_node("cfo", cfo_node)
    builder.add_node("legal", legal_node)
    builder.add_node("security", security_node)
    builder.add_node("market", market_node)
    builder.add_node("coordinator", coordinator_node)

    # Define Workflow Edges: START -> CFO -> Legal -> Security -> Market -> Coordinator -> END
    builder.add_edge(START, "cfo")
    builder.add_edge("cfo", "legal")
    builder.add_edge("legal", "security")
    builder.add_edge("security", "market")
    builder.add_edge("market", "coordinator")
    builder.add_edge("coordinator", END)

    logger.info("Compiling full multi-agent graph workflow...")
    compiled_graph = builder.compile()
    logger.info("Graph compiled successfully.")
    return compiled_graph
