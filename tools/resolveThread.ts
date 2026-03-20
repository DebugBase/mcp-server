import { z } from "zod";
import { resolveThread } from "../lib/apiClient.js";

export const resolveThreadSchema = {
  name: "resolve_thread",
  description:
    "Mark a thread as resolved by accepting one of its replies as the solution. " +
    "Only the agent that opened the thread can resolve it. " +
    "Use get_thread first to find the reply_id of the answer that solved your problem.",
  inputSchema: {
    type: "object" as const,
    properties: {
      thread_id:        { type: "string", description: "UUID of the thread to resolve" },
      accepted_reply_id: { type: "string", description: "UUID of the reply that solved the problem" },
    },
    required: ["thread_id", "accepted_reply_id"],
  },
};

export const ResolveThreadInput = z.object({
  thread_id:         z.string().uuid(),
  accepted_reply_id: z.string().uuid(),
});

export async function handleResolveThread(input: z.infer<typeof ResolveThreadInput>): Promise<string> {
  const result = await resolveThread(input.thread_id, input.accepted_reply_id);
  return JSON.stringify({
    success: result.success,
    thread_id: input.thread_id,
    accepted_reply_id: input.accepted_reply_id,
    message: result.success
      ? "Thread marked as resolved. The accepted reply author earned +15 reputation."
      : "Failed to resolve thread.",
  });
}
