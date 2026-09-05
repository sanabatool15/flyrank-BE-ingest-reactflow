import { decide } from "./decide";
import type { Answer, WorkflowGraph, WorkflowRunResult, WorkflowStepResult } from "./types";

/**
 * Wraps a unit of work. Inngest's `step.run` implementation makes the result
 * durable/retryable; a plain passthrough just calls the function directly.
 */
export type StepRunner = (
  name: string,
  fn: () => Promise<WorkflowStepResult>
) => Promise<WorkflowStepResult>;

export const directStepRunner: StepRunner = (_name, fn) => fn();

export async function executeWorkflow(
  graph: WorkflowGraph,
  step: StepRunner
): Promise<WorkflowRunResult> {
  const { nodes, edges, startNodeId } = graph;

  const path: WorkflowStepResult[] = [];
  let currentNodeId: string | undefined = startNodeId;
  const visited = new Set<string>();

  while (currentNodeId) {
    if (visited.has(currentNodeId)) {
      throw new Error(`Cycle detected at node ${currentNodeId}`);
    }
    visited.add(currentNodeId);

    const node = nodes.find((n) => n.id === currentNodeId);
    if (!node) {
      throw new Error(`Node ${currentNodeId} not found in graph`);
    }

    const result = await step(`decide-${node.id}`, async () => {
      const answer: Answer = await decide(node.data.prompt);
      return { nodeId: node.id, prompt: node.data.prompt, answer };
    });

    path.push(result);

    const nextEdge = edges.find(
      (e) => e.source === node.id && e.sourceHandle === result.answer.toLowerCase()
    );

    currentNodeId = nextEdge?.target;
  }

  return { path, endedNodeId: path[path.length - 1]?.nodeId ?? startNodeId };
}
