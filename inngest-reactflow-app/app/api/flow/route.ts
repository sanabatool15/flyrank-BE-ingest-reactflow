import { inngest } from "@/lib/inngest/client";
import { directStepRunner, executeWorkflow } from "@/lib/workflow/execute";
import type { WorkflowGraph } from "@/lib/workflow/types";

export async function POST(request: Request) {
  const body = (await request.json()) as WorkflowGraph;

  if (!body.startNodeId || !body.nodes?.length) {
    return Response.json(
      { error: "startNodeId and nodes are required" },
      { status: 400 }
    );
  }

  // Send the event so the run is also executed durably by Inngest and
  // visible in its dashboard (retries, step history, etc).
  const { ids } = await inngest.send({ name: "workflow/run", data: body });

  try {
    // Also run it directly so the UI gets an immediate, definite result
    // instead of polling for the background run to finish.
    const result = await executeWorkflow(body, directStepRunner);
    return Response.json({ eventId: ids[0], result });
  } catch (err) {
    return Response.json(
      {
        eventId: ids[0],
        error: err instanceof Error ? err.message : "Workflow execution failed",
      },
      { status: 502 }
    );
  }
}
