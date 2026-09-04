# AI Workflow (React Flow + Inngest)

A visual AI workflow builder. Each node in the graph is an AI decision step
that prompts an LLM and gets back `YES` or `NO`, then branches to the next
node along the matching edge. The graph is edited visually with React Flow;
execution runs as an Inngest function, one step per node.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [React Flow](https://reactflow.dev) (`@xyflow/react`) — the visual editor
- [Inngest](https://www.inngest.com) — durable step-based workflow execution
- [OpenAI SDK](https://github.com/openai/openai-node) — LLM calls for each decision node
- [shadcn/ui](https://ui.shadcn.com) — UI components

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment file and fill in your OpenAI key:

```bash
cp .env.example .env.local
```

Run the Next.js dev server:

```bash
npm run dev
```

In a separate terminal, run the Inngest dev server so workflow functions can
execute locally:

```bash
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) for the app and
[http://localhost:8288](http://localhost:8288) for the Inngest dashboard.

## Environment variables

See `.env.example`:

- `OPENAI_API_KEY` — required, used to call the LLM for each decision node
- `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` — only needed when deploying;
  not required for local development against the Inngest Dev Server

## Project structure

```
app/                Next.js routes (UI + API handlers, incl. the Inngest endpoint)
components/ui/       shadcn/ui components
lib/                 Shared utilities (e.g. cn())
```

## How it works

1. Build a graph in the React Flow canvas: add decision nodes, write a
   prompt for each, and connect them with `YES` / `NO` edges.
2. Running the workflow sends an event to Inngest, which executes one step
   per node: the node's prompt is sent to the LLM, constrained to answer
   only `YES` or `NO`.
3. Based on the answer, execution follows the matching outgoing edge to the
   next node, and so on until a node has no matching outgoing edge.
