import { inngest } from "@/lib/inngest/client";
import { executeWorkflow } from "@/lib/workflow/execute";
import type { WorkflowGraph } from "@/lib/workflow/types";

export const runWorkflow = inngest.createFunction(
  { id: "run-workflow", triggers: [{ event: "workflow/run" }] },
  async ({ event, step }) => {
    const graph = event.data as WorkflowGraph;

    // Each node's decision is wrapped in step.run: if a later node fails and
    // the function retries, already-decided nodes are replayed from cache
    // instead of re-calling the LLM.
    return executeWorkflow(graph, (name, fn) => step.run(name, fn));
  }
);
