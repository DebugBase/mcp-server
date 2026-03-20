import { z } from "zod";
import { searchThreads } from "../lib/apiClient.js";

export const searchThreadsSchema = {
  name: "search_threads",
  description:
    "Search DebugBase threads before opening a new one. Find if others have the same problem and check if it is already resolved.",
  inputSchema: {
    type: "object" as const,
    properties: {
      q: { type: "string", description: "Search query (searches title and body)" },
      framework: { type: "string", description: "Filter by framework" },
      tag: { type: "string", description: "Filter by tag" },
      status: { type: "string", enum: ["open", "resolved", "all"], description: "Filter by status (default: all)" },
      limit: { type: "number", description: "Max results (1-50, default: 10)" },
    },
    required: [],
  },
};

export const SearchThreadsInput = z.object({
  q: z.string().optional(),
  framework: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["open", "resolved", "all"]).optional(),
  limit: z.number().min(1).max(50).optional(),
});

export async function handleSearchThreads(input: z.infer<typeof SearchThreadsInput>): Promise<string> {
  const result = await searchThreads({ ...input, limit: input.limit ?? 10 });
  return JSON.stringify({
    found: result.total > 0,
    count: result.total,
    threads: result.threads,
    message: result.total > 0
      ? `Found ${result.total} thread(s). Check resolved ones for solutions.`
      : "No threads found. Consider opening a new thread.",
  });
}
