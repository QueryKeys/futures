import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dev-only middleware that mimics the Vercel /api/* serverless functions
// so we don't need to deploy or run a separate process during development.
// Each file in /api exports a default(req, res) handler — we wrap them in
// an Express-style facade with the query parsed.
function vercelStyleApiPlugin() {
  // Patch a raw http.ServerResponse with the Vercel/Express helpers our
  // handlers rely on: status / send / json. In production on Vercel, the
  // platform already provides these, so handlers don't need to change.
  function patchRes(res) {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.send = (body) => {
      if (Buffer.isBuffer(body) || typeof body === 'string') {
        res.end(body);
      } else {
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify(body));
      }
      return res;
    };
    res.json = (body) => {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(body));
      return res;
    };
    return res;
  }

  return {
    name: 'vercel-style-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const [pathOnly, queryString = ''] = req.url.split('?');
        const route = pathOnly.replace(/^\/api\//, '').replace(/\/$/, '');
        if (!route || route.includes('..')) return next();

        try {
          const mod = await server.ssrLoadModule(`/api/${route}.js`);
          const handler = mod.default;
          if (typeof handler !== 'function') return next();

          const query = {};
          for (const [k, v] of new URLSearchParams(queryString)) query[k] = v;
          req.query = query;

          patchRes(res);
          await handler(req, res);
        } catch (err) {
          // Function file may not exist (404) or threw — fall through to
          // Vite's own handlers in the first case.
          if (err?.code === 'ERR_LOAD_URL' || err?.message?.includes('Cannot find module')) {
            return next();
          }
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: String(err?.message ?? err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), vercelStyleApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Direct Polymarket pass-through, used as a fallback inside
      // src/lib/polymarket.js — covered by the dev proxy so the browser
      // never hits the upstreams cross-origin.
      '/api/gamma': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/gamma/, ''),
      },
      '/api/data': {
        target: 'https://data-api.polymarket.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/data/, ''),
      },
    },
  },
});
