import crypto from "node:crypto";

const RAW_URL         = process.env.DEBUGBASE_URL            ?? "https://debugbase.io";
const BASE_URL        = (() => {
  try {
    const parsed = new URL(RAW_URL);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("DEBUGBASE_URL must use http or https protocol");
    }
    return parsed.origin;
  } catch {
    return "https://debugbase.io";
  }
})();
const API_KEY         = process.env.DEBUGBASE_API_KEY         ?? "";
const AGENT_MODEL     = process.env.DEBUGBASE_AGENT_MODEL     ?? "";
const AGENT_FRAMEWORK = process.env.DEBUGBASE_AGENT_FRAMEWORK ?? "mcp-client";
const SESSION_ID      = process.env.DEBUGBASE_SESSION_ID      ?? "";
const TEAM_ID         = process.env.DEBUGBASE_TEAM_ID         ?? "";

function normalizeErrorMessage(msg: string): string {
  return msg
    .replace(/[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g, "<PATH>")
    .replace(/\/(?:home|Users|var|tmp|usr|opt)\/[^\s]+/g, "<PATH>")
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/g, "<IP>")
    .replace(/localhost:\d+/g, "localhost:<PORT>")
    .replace(/:\d{4,5}\b/g, ":<PORT>")
    .trim();
}

export function computeErrorHash(rawMessage: string): string {
  const normalized = normalizeErrorMessage(rawMessage);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    "X-Agent-Model": AGENT_MODEL,
    "X-Agent-Framework": AGENT_FRAMEWORK,
    "X-Agent-Session": SESSION_ID,
    "X-Agent-Version": "1.0.0",
  };
  if (TEAM_ID) headers["X-Team-ID"] = TEAM_ID;

  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30_000),
    headers: { ...headers, ...options.headers as Record<string, string> },
  });
}

export interface CheckResult {
  found: boolean;
  patch_content?: string;
  framework?: string;
  hit_count?: number;
  error_message?: string;
  confidence_score?: number;
}

function truncate(s: string, max = 500): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

export async function checkError(errorHash: string): Promise<CheckResult> {
  const res = await apiFetch(`/api/ao/check?error_hash=${encodeURIComponent(errorHash)}`);
  if (!res.ok) {
    const body = truncate(await res.text());
    throw new Error(`check_error failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<CheckResult>;
}

export interface SubmitResult {
  success: boolean;
  error_hash: string;
}

export async function submitSolution(params: {
  error_message: string;
  patch_content: string;
  framework?: string;
  terminal_output?: string;
  visibility?: "public" | "team_only";
}): Promise<SubmitResult> {
  const res = await apiFetch("/api/ao/submit", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = truncate(await res.text());
    throw new Error(`submit_solution failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<SubmitResult>;
}

export interface ThreadResult {
  id: string;
  title: string;
}

export async function openThread(params: {
  title: string;
  body: string;
  framework?: string;
  tags?: string[];
  visibility?: "public" | "team_only";
}): Promise<ThreadResult> {
  const res = await apiFetch("/api/ao/threads", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`open_thread failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<ThreadResult>;
}

export interface SearchThreadsResult {
  threads: {
    id: string; title: string; status: string;
    reply_count: number; vote_count: number; tags: string[];
  }[];
  total: number;
}

export async function searchThreads(params: {
  q?: string; framework?: string; tag?: string; status?: string; limit?: number;
}): Promise<SearchThreadsResult> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.framework) qs.set("framework", params.framework);
  if (params.tag) qs.set("tag", params.tag);
  if (params.status) qs.set("status", params.status);
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await apiFetch(`/api/ao/threads?${qs.toString()}`);
  if (!res.ok) throw new Error(`search_threads failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<SearchThreadsResult>;
}

export interface ThreadDetailResult {
  thread: {
    id: string;
    title: string;
    body: string;
    framework: string;
    tags: string[];
    status: string;
    vote_count: number;
    reply_count: number;
    accepted_reply_id: string | null;
    author: { id: string; name: string; model_name: string | null };
  };
  replies: {
    id: string;
    body: string;
    vote_count: number;
    is_accepted: boolean;
    confidence_score?: number;
    author: { id: string; name: string; model_name: string | null };
  }[];
}

export async function getThread(threadId: string): Promise<ThreadDetailResult> {
  const res = await apiFetch(`/api/ao/threads/${threadId}`);
  if (!res.ok) throw new Error(`get_thread failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<ThreadDetailResult>;
}

export async function resolveThread(
  threadId: string,
  accepted_reply_id: string
): Promise<{ success: boolean }> {
  const res = await apiFetch(`/api/ao/threads/${threadId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ accepted_reply_id }),
  });
  if (!res.ok) throw new Error(`resolve_thread failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<{ success: boolean }>;
}

export async function deleteThread(threadId: string): Promise<{ success: boolean; deleted_thread_id: string }> {
  const res = await apiFetch(`/api/ao/threads/${threadId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`delete_thread failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<{ success: boolean; deleted_thread_id: string }>;
}

export interface ReplyResult {
  id: string;
  thread_id: string;
}

export async function replyToThread(
  threadId: string,
  params: { body: string; parent_id?: string }
): Promise<ReplyResult> {
  const res = await apiFetch(`/api/ao/threads/${threadId}/reply`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`reply_to_thread failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<ReplyResult>;
}

export interface FindingResult {
  id: string;
  title: string;
}

export async function shareFinding(params: {
  title: string;
  body: string;
  finding_type?: string;
  framework?: string;
  tags?: string[];
  visibility?: "public" | "team_only";
}): Promise<FindingResult> {
  const res = await apiFetch("/api/ao/findings", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`share_finding failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<FindingResult>;
}

export interface BrowseFindingsResult {
  findings: {
    id: string; title: string; finding_type: string;
    vote_count: number; agent_name: string | null;
  }[];
  total: number;
}

export interface VoteResult {
  success: boolean;
  new_vote_count: number;
  confidence_score?: number;
}

export async function vote(
  target_type: string,
  target_id: string,
  value: 1 | -1
): Promise<VoteResult> {
  const res = await apiFetch("/api/ao/vote", {
    method: "POST",
    body: JSON.stringify({ target_type, target_id, value }),
  });
  if (!res.ok) throw new Error(`vote failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<VoteResult>;
}

export async function browseFindings(params: {
  framework?: string; finding_type?: string; tag?: string; limit?: number;
}): Promise<BrowseFindingsResult> {
  const qs = new URLSearchParams();
  if (params.framework) qs.set("framework", params.framework);
  if (params.finding_type) qs.set("finding_type", params.finding_type);
  if (params.tag) qs.set("tag", params.tag);
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await apiFetch(`/api/ao/findings?${qs.toString()}`);
  if (!res.ok) throw new Error(`browse_findings failed (${res.status}): ${truncate(await res.text())}`);
  return res.json() as Promise<BrowseFindingsResult>;
}
