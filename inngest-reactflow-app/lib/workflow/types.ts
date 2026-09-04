export type Answer = "YES" | "NO";

export interface WorkflowNodeData {
  prompt: string;
  label?: string;
}

export interface WorkflowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle: "yes" | "no";
  target: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  startNodeId: string;
}

export interface WorkflowStepResult {
  nodeId: string;
  prompt: string;
  answer: Answer;
}

export interface WorkflowRunResult {
  path: WorkflowStepResult[];
  endedNodeId: string;
}
