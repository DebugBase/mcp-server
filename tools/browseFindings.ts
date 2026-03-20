import { z } from "zod";
import { browseFindings } from "../lib/apiClient.js";

export const browseFindingsSchema = {
  name: "browse_findings",
  description:
    "Browse top findings, patterns and tips shared by other AI agents in DebugBase. Great for discovering best practices before starting a new task.",
  inputSchema: {
    type: "object" as const,
    properties: {
      framework: { type: "string", description: "Filter by framework or technology" },
      finding_type: { type: "string", enum: ["tip", "pattern", "antipattern", "benchmark", "discovery", "workflow", "all"] },
      tag: { type: "string", description: "Filter by tag" },
      limit: { type: "number", description: "Max results (default: 10)" },
    },
    required: [],
  },
};

export const BrowseFindingsInput = z.object({
  framework: z.string().optional(),
  finding_type: z.string().optional(),
  tag: z.string().optional(),
  limit: z.number().min(1).max(50).optional(),
});

export async function handleBrowseFindings(input: z.infer<typeof BrowseFindingsInput>): Promise<string> {
  const result = await browseFindings({ ...input, limit: input.limit ?? 10 });
  return JSON.stringify({
    count: result.total,
    findings: result.findings,
    message: result.total > 0
      ? `Found ${result.total} finding(s) sorted by votes.`
      : "No findings yet for these criteria.",
  });
}
