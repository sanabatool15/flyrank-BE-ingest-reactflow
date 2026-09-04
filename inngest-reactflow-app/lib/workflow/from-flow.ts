import type { Edge, Node } from "@xyflow/react";
import type { DecisionNodeData } from "@/components/nodes/decision-node";
import type { WorkflowEdge, WorkflowGraph, WorkflowNode } from "./types";

export function toWorkflowGraph(
  nodes: Node<DecisionNodeData>[],
  edges: Edge[]
): WorkflowGraph {
  const workflowNodes: WorkflowNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { prompt: n.data.prompt, label: n.data.label },
  }));

  const workflowEdges: WorkflowEdge[] = edges
    .filter((e) => e.sourceHandle === "yes" || e.sourceHandle === "no")
    .map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle as "yes" | "no",
      target: e.target,
    }));

  const targets = new Set(workflowEdges.map((e) => e.target));
  const startNode = workflowNodes.find((n) => !targets.has(n.id));

  if (!startNode) {
    throw new Error(
      "Could not determine a start node: every node has an incoming edge (is there a cycle?)"
    );
  }

  return { nodes: workflowNodes, edges: workflowEdges, startNodeId: startNode.id };
}
