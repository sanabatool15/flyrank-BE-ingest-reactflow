import { inngest } from "@/lib/inngest/client";
import { decide } from "@/lib/workflow/decide";
import type {
  WorkflowGraph,
  WorkflowRunResult,
  WorkflowStepResult,
} from "@/lib/workflow/types";

export const runWorkflow = inngest.createFunction(
  { id: "run-workflow", triggers: [{ event: "workflow/run" }] },
  async ({ event, step }) => {
    const { nodes, edges, startNodeId } = event.data as WorkflowGraph;

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

      // Each node is its own Inngest step: retried independently, and its
      // result is persisted so re-runs after a crash don't re-call the LLM.
      const result = await step.run(`decide-${node.id}`, async () => {
        const answer = await decide(node.data.prompt);
        return { nodeId: node.id, prompt: node.data.prompt, answer };
      });

      path.push(result);

      const nextEdge = edges.find(
        (e) => e.source === node.id && e.sourceHandle === result.answer.toLowerCase()
      );

      currentNodeId = nextEdge?.target;
    }

    const final: WorkflowRunResult = {
      path,
      endedNodeId: path[path.length - 1]?.nodeId ?? startNodeId,
    };

    return final;
  }
);
