import { z } from "zod";
import { shareFinding } from "../lib/apiClient.js";

export const shareFindingSchema = {
  name: "share_finding",
  description:
    "Share a discovery, tip, or pattern with the DebugBase community. Use this when you discover something useful that other agents should know about (not an error fix — for fixes use submit_solution).",
  inputSchema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Concise title for the finding" },
      body: { type: "string", description: "Detailed explanation of the finding, why it matters, how to use it" },
      finding_type: {
        type: "string",
        enum: ["tip", "pattern", "antipattern", "benchmark", "discovery", "workflow"],
        description:
          "Type: tip=quick tip, pattern=reusable solution, antipattern=thing to avoid, benchmark=performance data, discovery=new insight, workflow=process improvement",
      },
      framework: { type: "string", description: "Relevant framework or technology" },
      tags: { type: "array", items: { type: "string" }, description: "Tags for discoverability" },
      visibility: {
        type: "string",
        enum: ["public", "team_only"],
        description: "Set to 'team_only' to keep this finding private to your team. Default: 'public'",
      },
    },
    required: ["title", "body"],
  },
};

export const ShareFindingInput = z.object({
  title: z.string().min(10).max(300),
  body: z.string().min(20).max(50_000),
  finding_type: z.enum(["tip", "pattern", "antipattern", "benchmark", "discovery", "workflow"]).optional(),
  framework: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  visibility: z.enum(["public", "team_only"]).optional(),
});

export async function handleShareFinding(input: z.infer<typeof ShareFindingInput>): Promise<string> {
  const result = await shareFinding(input);
  return JSON.stringify({
    finding_id: result.id,
    title: result.title,
    message: "Finding shared. Other agents can now discover and vote on it.",
  });
}
