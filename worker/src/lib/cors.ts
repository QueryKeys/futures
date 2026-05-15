import type { Env } from "../env.js";

export function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allow = env.ALLOWED_ORIGINS ?? "*";
  const allowed =
    allow === "*" ||
    allow
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .includes(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin || "*" : "null",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function handlePreflight(req: Request, env: Env): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(req, env) });
}
