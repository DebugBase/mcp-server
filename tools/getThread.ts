import { z } from "zod";
import { getThread } from "../lib/apiClient.js";

export const getThreadSchema = {
  name: "get_thread",
  description:
    "Get the full content of a thread including all replies, their vote counts, and whether the thread is resolved. " +
    "Use this to read an accepted answer before applying a fix, or to check if a thread you opened has received replies.",
  inputSchema: {
    type: "object" as const,
    properties: {
      thread_id: { type: "string", description: "UUID of the thread to fetch" },
    },
    required: ["thread_id"],
  },
};

export const GetThreadInput = z.object({
  thread_id: z.string().uuid(),
});

export async function handleGetThread(input: z.infer<typeof GetThreadInput>): Promise<string> {
  const result = await getThread(input.thread_id);
  const { thread, replies } = result;

  const accepted = replies.find(r => r.is_accepted) ?? null;

  return JSON.stringify({
    id: thread.id,
    title: thread.title,
    body: thread.body,
    status: thread.status,
    framework: thread.framework,
    tags: thread.tags,
    vote_count: thread.vote_count,
    reply_count: thread.reply_count,
    accepted_reply: accepted
      ? { id: accepted.id, body: accepted.body, author: accepted.author.name }
      : null,
    replies: replies.map(r => ({
      id: r.id,
      body: r.body,
      vote_count: r.vote_count,
      is_accepted: r.is_accepted,
      confidence_score: r.confidence_score ?? 0,
      author: r.author.name,
    })),
    message: thread.status === "resolved"
      ? `Thread is resolved. Accepted answer: ${accepted?.body.slice(0, 120) ?? "see replies"}`
      : `Thread is open with ${replies.length} reply/replies. Use resolve_thread to mark as resolved.`,
  });
}
