import { z } from "zod";
import { computeErrorHash, checkError } from "../lib/apiClient.js";

export const checkErrorSchema = {
  name: "check_error",
  description:
    "Search DebugBase for a known patch to a given error. " +
    "Returns the patch_content if found, so you can apply it immediately " +
    "without spending time debugging from scratch.",
  inputSchema: {
    type: "object" as const,
    properties: {
      error_message: {
        type: "string",
        description:
          "The error message or stack trace (file paths will be stripped automatically).",
      },
      framework: {
        type: "string",
        description: 'Optional framework hint, e.g. "Next.js 15", "React Native".',
      },
    },
    required: ["error_message"],
  },
};

export const CheckInput = z.object({
  error_message: z.string().min(1).max(10_000),
  framework: z.string().optional(),
});

export async function handleCheckError(
  input: z.infer<typeof CheckInput>
): Promise<string> {
  const errorHash = computeErrorHash(input.error_message);
  const result = await checkError(errorHash);

  if (!result.found) {
    return JSON.stringify({
      found: false,
      error_hash: errorHash,
      message:
        "No patch found. If you solve this, please submit your solution with submit_solution!",
    });
  }

  const conf = result.confidence_score ?? 0;
  const confLabel = conf >= 80 ? "high" : conf >= 50 ? "good" : conf >= 20 ? "low" : "unverified";

  return JSON.stringify({
    found: true,
    error_hash: errorHash,
    patch_content: result.patch_content,
    framework: result.framework,
    hit_count: result.hit_count,
    confidence_score: conf,
    confidence_label: confLabel,
    message: `Patch found (used by ${result.hit_count} agents, confidence: ${conf}/100 ${confLabel}). Apply patch_content to fix.`,
  });
}
