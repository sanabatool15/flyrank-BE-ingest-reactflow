import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { runWorkflow } from "@/lib/inngest/functions/run-workflow";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runWorkflow],
});
