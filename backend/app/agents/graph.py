from __future__ import annotations

from typing import Literal
from langgraph.graph import END, StateGraph

from app.agents.nodes import (
    dispatcher_agent,
    sentinel_agent,
    sleuth_agent,
    strategist_agent,
)
from app.agents.state import SmugglingIncidentState


def _route_after_sleuth(state: SmugglingIncidentState) -> Literal["strategist", "__end__"]:
    """
    Evaluates cumulative risk score. If CRITICAL (>= 80), triggers the Strategist agent.
    Otherwise routes directly to END with dispatch_status='SKIPPED'.
    """
    risk_score = state.get("risk_score", 0)
    if risk_score >= 80:
        return "strategist"
    return "__end__"


def create_interdiction_graph():
    """
    Constructs and compiles the event-driven Multi-Agent AI Interdiction pipeline.
    """
    workflow = StateGraph(SmugglingIncidentState)

    # 1. Add Nodes
    workflow.add_node("sentinel", sentinel_agent)
    workflow.add_node("sleuth", sleuth_agent)
    workflow.add_node("strategist", strategist_agent)
    workflow.add_node("dispatcher", dispatcher_agent)

    # 2. Add Edges
    workflow.set_entry_point("sentinel")
    workflow.add_edge("sentinel", "sleuth")

    # Conditional branching after Sleuth agent
    workflow.add_conditional_edges(
        "sleuth",
        _route_after_sleuth,
        {
            "strategist": "strategist",
            "__end__": END,
        },
    )

    workflow.add_edge("strategist", "dispatcher")
    workflow.add_edge("dispatcher", END)

    return workflow.compile()


interdiction_pipeline = create_interdiction_graph()
