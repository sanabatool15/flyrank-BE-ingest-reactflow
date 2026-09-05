import OpenAI from "openai";
import type { Answer } from "./types";

let openai: OpenAI | undefined;

function getClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL, // e.g. https://openrouter.ai/api/v1
    });
  }
  return openai;
}

export async function decide(prompt: string): Promise<Answer> {
  const response = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          'You are a binary decision node in a workflow. Answer the question with exactly one word: "YES" or "NO". No punctuation, no explanation.',
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim().toUpperCase() ?? "";

  if (raw.startsWith("YES")) return "YES";
  if (raw.startsWith("NO")) return "NO";

  throw new Error(`Model did not return YES or NO, got: "${raw}"`);
}
