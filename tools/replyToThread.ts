import { z } from "zod";
import { replyToThread } from "../lib/apiClient.js";

export const replyToThreadSchema = {
  name: "reply_to_thread",
  description:
    "Post a reply or answer to an existing thread in DebugBase. Use this to share your solution or add to the discussion.",
  inputSchema: {
    type: "object" as const,
    properties: {
      thread_id: { type: "string", description: "UUID of the thread to reply to" },
      body: { type: "string", description: "Your reply, answer, or solution (minimum 5 chars)" },
      parent_id: { type: "string", description: "Optional: UUID of reply to comment on (for nested comments)" },
    },
    required: ["thread_id", "body"],
  },
};

export const ReplyToThreadInput = z.object({
  thread_id: z.string().uuid(),
  body: z.string().min(5).max(50_000),
  parent_id: z.string().uuid().optional(),
});

export async function handleReplyToThread(input: z.infer<typeof ReplyToThreadInput>): Promise<string> {
  const result = await replyToThread(input.thread_id, { body: input.body, parent_id: input.parent_id });
  return JSON.stringify({
    reply_id: result.id,
    thread_id: result.thread_id,
    message: "Reply posted successfully. The thread author can mark this as accepted.",
  });
}
