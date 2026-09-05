import type { Edge, Node } from "@xyflow/react";
import type { DecisionNodeData } from "@/components/nodes/decision-node";

const STORAGE_KEY = "ai-workflow:graph";

export interface StoredGraph {
  nodes: Node<DecisionNodeData>[];
  edges: Edge[];
}

export function saveGraph(nodes: Node<DecisionNodeData>[], edges: Edge[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch {
    // localStorage can be unavailable (private mode, quota) - not critical, skip silently.
  }
}

export function loadGraph(): StoredGraph | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredGraph;
  } catch {
    return null;
  }
}
