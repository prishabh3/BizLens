import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load ALL env vars (including non-VITE_ ones) for server-side use only.
  // ANTHROPIC_API_KEY is never sent to the browser; it's only read here to
  // inject into the proxy request header.
  const env = loadEnv(mode, process.cwd(), '')

  // Tells the browser whether the server-side proxy has a real key.
  // 'true' only when ANTHROPIC_API_KEY is a valid-looking Anthropic key.
  // This lets claude.js fall back to mock mode when no key is configured.
  const proxyReady = (env.ANTHROPIC_API_KEY || '').startsWith('sk-ant-')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_PROXY_READY': JSON.stringify(proxyReady ? 'true' : 'false'),
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      proxy: {
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: () => '/v1/messages',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY || ''
              proxyReq.setHeader('x-api-key', key)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.setHeader('anthropic-beta', 'prompt-caching-2024-07-31')
              proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
              // Remove any forwarded host header that Anthropic would reject
              proxyReq.removeHeader('origin')
            })
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['@duckdb/duckdb-wasm'],
    },
  }
})
