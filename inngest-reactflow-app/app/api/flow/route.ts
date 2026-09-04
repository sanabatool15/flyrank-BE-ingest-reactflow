import { inngest } from "@/lib/inngest/client";
import type { WorkflowGraph } from "@/lib/workflow/types";

export async function POST(request: Request) {
  const body = (await request.json()) as WorkflowGraph;

  if (!body.startNodeId || !body.nodes?.length) {
    return Response.json(
      { error: "startNodeId and nodes are required" },
      { status: 400 }
    );
  }

  const { ids } = await inngest.send({
    name: "workflow/run",
    data: body,
  });

  return Response.json({ eventId: ids[0] });
}
