import type { Env } from "./env.js";
import { corsHeaders, handlePreflight } from "./lib/cors.js";
import { checkIpRateLimit, rateLimitHeaders } from "./lib/rateLimit.js";
import { handleMarkets } from "./handlers/markets.js";

/**
 * Polymarket-IL API Worker.
 *
 * Step 1 surface area:
 *   GET  /              → liveness
 *   GET  /healthz       → JSON status
 *   GET  /api/markets   → cached gamma /markets, normalized
 *
 * Cross-cutting:
 *   - CORS (allow-list driven by env.ALLOWED_ORIGINS)
 *   - Per-IP soft rate limit (60 req/min, KV bucketed)
 *   - Single-flight + KV cache + stale-while-revalidate + 429 backoff
 */

export default {
  async fetch(
    req: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const preflight = handlePreflight(req, env);
    if (preflight) return preflight;

    const cors = corsHeaders(req, env);
    const url = new URL(req.url);

    // ── Rate limit (per IP) ────────────────────────────────────────────────
    if (url.pathname.startsWith("/api/")) {
      const ip =
        req.headers.get("CF-Connecting-IP") ??
        req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
        "0.0.0.0";
      const rl = await checkIpRateLimit(env, ip, 60);
      if (!rl.ok) {
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: "Too many requests. Try again shortly.",
            resetSeconds: rl.resetSeconds,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...cors,
              ...rateLimitHeaders(rl),
              "Retry-After": String(rl.resetSeconds),
            },
          },
        );
      }
    }

    try {
      // ── Routes ──────────────────────────────────────────────────────────
      if (url.pathname === "/" && req.method === "GET") {
        return text("polymarket-il-api: ok", cors);
      }

      if (url.pathname === "/healthz" && req.method === "GET") {
        return json(
          { ok: true, time: new Date().toISOString() },
          200,
          cors,
        );
      }

      if (url.pathname === "/api/markets" && req.method === "GET") {
        const res = await handleMarkets(req, env, ctx);
        return withHeaders(res, cors);
      }

      return json({ error: "not_found", path: url.pathname }, 404, cors);
    } catch (err) {
      console.error("[worker] unhandled error:", err);
      const status =
        (err as { status?: number } | undefined)?.status &&
        (err as { status?: number }).status! >= 400 &&
        (err as { status?: number }).status! < 600
          ? (err as { status: number }).status
          : 502;
      return json(
        {
          error: "upstream_error",
          status,
          message: err instanceof Error ? err.message : String(err),
        },
        status,
        cors,
      );
    }
  },
} satisfies ExportedHandler<Env>;

// ── Helpers ─────────────────────────────────────────────────────────────────

function json(
  body: unknown,
  status: number,
  extra: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extra,
    },
  });
}

function text(body: string, extra: Record<string, string>): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...extra },
  });
}

function withHeaders(res: Response, extra: Record<string, string>): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: h,
  });
}
