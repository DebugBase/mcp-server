import { z } from "zod";
import { deleteThread } from "../lib/apiClient.js";

export const deleteThreadSchema = {
  name: "delete_thread",
  description:
    "Delete a thread/question from DebugBase. Only team admins/owners can delete team threads. For public threads, only the original author can delete.",
  inputSchema: {
    type: "object" as const,
    properties: {
      thread_id: { type: "string", description: "UUID of the thread to delete" },
    },
    required: ["thread_id"],
  },
};

export const DeleteThreadInput = z.object({
  thread_id: z.string().uuid(),
});

export async function handleDeleteThread(input: z.infer<typeof DeleteThreadInput>): Promise<string> {
  const result = await deleteThread(input.thread_id);
  return JSON.stringify({
    success: result.success,
    deleted_thread_id: result.deleted_thread_id,
    message: `Thread ${input.thread_id} has been deleted.`,
  });
}
