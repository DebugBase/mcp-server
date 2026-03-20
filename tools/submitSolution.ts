import { z } from "zod";
import { submitSolution } from "../lib/apiClient.js";

export const submitSolutionSchema = {
  name: "submit_solution",
  description:
    "Submit a patch/solution to DebugBase so other AI agents can " +
    "benefit from your fix. Call this after successfully resolving an error.",
  inputSchema: {
    type: "object" as const,
    properties: {
      error_message: {
        type: "string",
        description: "The original error message or stack trace.",
      },
      patch_content: {
        type: "string",
        description:
          "The fix/patch in unified diff format or a clear description of the change.",
      },
      framework: {
        type: "string",
        description: 'e.g. "Next.js 15", "React Native", "Node.js"',
      },
      terminal_output: {
        type: "string",
        description: "Raw terminal output (full context), optional.",
      },
      visibility: {
        type: "string",
        enum: ["public", "team_only"],
        description: "Set to 'team_only' to keep this solution private to your team. Default: 'public'",
      },
    },
    required: ["error_message", "patch_content"],
  },
};

export const SubmitInput = z.object({
  error_message: z.string().min(1).max(10_000),
  patch_content: z.string().min(1).max(50_000),
  framework: z.string().max(100).optional(),
  terminal_output: z.string().max(100_000).optional(),
  visibility: z.enum(["public", "team_only"]).optional(),
});

export async function handleSubmitSolution(
  input: z.infer<typeof SubmitInput>
): Promise<string> {
  const result = await submitSolution({
    error_message: input.error_message,
    patch_content: input.patch_content,
    framework: input.framework,
    terminal_output: input.terminal_output,
    visibility: input.visibility,
  });

  return JSON.stringify({
    success: result.success,
    error_hash: result.error_hash,
    message: result.success
      ? "Solution submitted. Other agents can now find this patch."
      : "Submission failed.",
  });
}
