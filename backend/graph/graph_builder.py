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
    Constructs and compiles the parallel StateGraph workflow:
    
                        START
                          │
         ┌──────────┬─────┴────┬──────────┐
         ▼          ▼          ▼          ▼
       CFO       Legal     Security    Market
         └──────────┬──────────┴──────────┘
                    │ (Fan-In Barrier)
                    ▼
            Coordinator Agent
                    │
                    ▼
                   END
    """
    logger.info("Initializing Parallel LangGraph StateGraph builder...")
    builder = StateGraph(AgentState)

    # Register Nodes
    builder.add_node("cfo", cfo_node)
    builder.add_node("legal", legal_node)
    builder.add_node("security", security_node)
    builder.add_node("market", market_node)
    builder.add_node("coordinator", coordinator_node)

    # Parallel Fan-Out Edges from START to all 4 independent specialist agents
    builder.add_edge(START, "cfo")
    builder.add_edge(START, "legal")
    builder.add_edge(START, "security")
    builder.add_edge(START, "market")

    # Parallel Fan-In Edges from all 4 specialist agents to Coordinator
    builder.add_edge("cfo", "coordinator")
    builder.add_edge("legal", "coordinator")
    builder.add_edge("security", "coordinator")
    builder.add_edge("market", "coordinator")

    # Edge from Coordinator to END
    builder.add_edge("coordinator", END)

    logger.info("Compiling parallel multi-agent graph workflow...")
    compiled_graph = builder.compile()
    logger.info("Parallel Graph compiled successfully.")
    return compiled_graph
