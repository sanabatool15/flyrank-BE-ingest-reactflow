"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "@/components/flow-canvas";

export default function Home() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="border-b px-4 py-2">
        <h1 className="text-sm font-semibold">AI Workflow Builder</h1>
      </header>
      <div className="flex-1">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
