import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleChatCore, type ChatCoreRequest } from './server/chatCore.ts'

function chatMiddleware(env: Record<string, string>) {
  return async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/chat')) return next()
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.end()
      return
    }
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.end(JSON.stringify({ ok: true, service: 'tsun-chat', hasOpenRouter: !!env.OPENROUTER_API_KEY, hasGemini: !!env.GEMINI_API_KEY }))
      return
    }
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    let body = ''
    req.on('data', (chunk: any) => { body += chunk; if (body.length > 20000) req.destroy() })
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}') as ChatCoreRequest
        if (!parsed?.prompt || typeof parsed.prompt !== 'string') {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ error: 'Missing prompt' }))
          return
        }
        const result = await handleChatCore(parsed, env)
        if (!result) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ error: 'LLM providers unavailable or misconfigured', fallback: true }))
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify(result))
      } catch (e) {
        console.error('[vite chat middleware] error', e)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error', fallback: true }))
      }
    })
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const chatPlugin = {
    name: 'tsun-chat-middleware',
    configureServer(server: any) {
      const mw = chatMiddleware(env)
      // @ts-ignore
      server.middlewares.stack.unshift({ route: '', handle: mw })
    },
    configurePreviewServer(server: any) {
      const mw = chatMiddleware(env)
      // @ts-ignore
      server.middlewares.stack.unshift({ route: '', handle: mw })
    },
  }

  return {
    plugins: [react(), chatPlugin],
    server: {
      host: '0.0.0.0',
      strictPort: true,
      port: 5173,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      strictPort: true,
      port: 4173,
      allowedHosts: true,
    },
  }
})
