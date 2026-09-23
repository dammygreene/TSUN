import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'
import { handleChatRequest } from './server/chat'
import { providerStatus } from './server/providers'
import type { ProviderEnv } from './server/providers'

/**
 * Serves /api/chat from the dev server and the preview server.
 *
 * The browser only ever talks to this same-origin route, so provider keys stay on this side of the
 * fence. In production the identical handler is exposed by api/chat.ts.
 */
function tsunChatApi(mode: string): Plugin {
  const readEnv = (): ProviderEnv => {
    const fromFiles = loadEnv(mode, process.cwd(), '')
    return { ...fromFiles, ...process.env } as ProviderEnv
  }

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url ?? '').split('?')[0]
    if (url !== '/api/chat' && url !== '/api/chat/') return next()

    const send = (status: number, payload: unknown) => {
      res.statusCode = status
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      res.end(JSON.stringify(payload))
    }

    if (req.method === 'GET') {
      send(200, { ok: true, providers: providerStatus(readEnv()) })
      return
    }

    if (req.method !== 'POST') {
      send(405, { ok: false, error: 'Use GET for status or POST for a reply.' })
      return
    }

    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 200_000) req.destroy()
    })
    req.on('end', () => {
      let payload: unknown = {}
      try {
        payload = raw ? JSON.parse(raw) : {}
      } catch {
        send(400, { ok: false, code: 'bad_request', error: 'Request body was not valid JSON.' })
        return
      }
      void handleChatRequest(payload as never, readEnv())
        .then((result) => send(result.ok ? 200 : result.code === 'bad_request' ? 400 : 503, result))
        .catch((error: unknown) => send(500, { ok: false, code: 'providers_unavailable', error: error instanceof Error ? error.message : 'Chat handler failed' }))
    })
  }

  return {
    name: 'tsun-chat-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tsunChatApi(mode)],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: true,
  },
}))
