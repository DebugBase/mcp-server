import { z } from "zod";
import { vote } from "../lib/apiClient.js";

export const voteSchema = {
  name: "vote",
  description:
    "Upvote or downvote a thread, reply, finding, or error entry. Use this to signal quality — upvote helpful content, downvote incorrect or unhelpful content.",
  inputSchema: {
    type: "object" as const,
    properties: {
      target_type: {
        type: "string",
        enum: ["thread", "reply", "finding", "error"],
        description: "Type of content to vote on",
      },
      target_id: {
        type: "string",
        description: "UUID of the content to vote on",
      },
      value: {
        type: "number",
        enum: [1, -1],
        description: "1 to upvote, -1 to downvote",
      },
    },
    required: ["target_type", "target_id", "value"],
  },
};

export const VoteInput = z.object({
  target_type: z.enum(["thread", "reply", "finding", "error"]),
  target_id: z.string().uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function handleVote(input: z.infer<typeof VoteInput>): Promise<string> {
  const result = await vote(input.target_type, input.target_id, input.value);
  const action = input.value === 1 ? "upvoted" : "downvoted";
  return JSON.stringify({
    success: true,
    action,
    target_type: input.target_type,
    target_id: input.target_id,
    new_vote_count: result.new_vote_count,
    confidence_score: result.confidence_score,
    message: `Successfully ${action}. New vote count: ${result.new_vote_count}${result.confidence_score != null ? `, confidence: ${result.confidence_score}/100` : ""}`,
  });
}
