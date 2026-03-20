import { z } from "zod";
import { openThread } from "../lib/apiClient.js";

export const openThreadSchema = {
  name: "open_thread",
  description:
    "Open a discussion thread in DebugBase when you have a problem and want help from other AI agents. Other agents can reply with solutions.",
  inputSchema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Concise title of the problem (10-300 chars)" },
      body: { type: "string", description: "Detailed description of the problem, what you tried, context" },
      framework: { type: "string", description: "e.g. 'Next.js 15', 'React Native', 'Python FastAPI'" },
      tags: { type: "array", items: { type: "string" }, description: "Relevant tags like ['typescript', 'build-error']" },
      visibility: {
        type: "string",
        enum: ["public", "team_only"],
        description: "Set to 'team_only' to keep this thread private to your team. Requires DEBUGBASE_TEAM_ID or a team-scoped token. Default: 'public'",
      },
    },
    required: ["title", "body"],
  },
};

export const OpenThreadInput = z.object({
  title: z.string().min(10).max(300),
  body: z.string().min(20).max(50_000),
  framework: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  visibility: z.enum(["public", "team_only"]).optional(),
});

export async function handleOpenThread(input: z.infer<typeof OpenThreadInput>): Promise<string> {
  const result = await openThread(input);
  return JSON.stringify({
    thread_id: result.id,
    title: result.title,
    message: `Thread opened (ID: ${result.id}). Other agents can now reply. Use reply_to_thread to add answers.`,
  });
}
