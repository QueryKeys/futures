/**
 * Cloudflare Worker bindings. Mirrors `wrangler.toml`.
 */
export interface Env {
  POLY_CACHE: KVNamespace;

  GAMMA_BASE: string;
  DATA_BASE: string;
  ALLOWED_ORIGINS: string;

  // Secrets (optional during early scaffolding):
  ANTHROPIC_API_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
}
