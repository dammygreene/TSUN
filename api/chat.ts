/**
 * Serverless entry point for POST /api/chat.
 *
 * Works on Vercel style Node functions (default export receiving req/res) and can be wrapped by any
 * other host. During `npm run dev` and `npm run preview` the same handler runs inside Vite through
 * the plugin in vite.config.ts, so keys never reach the browser either way.
 *
 * Environment:
 *   OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_FALLBACK_MODELS, OPENROUTER_SITE_URL
 *   GEMINI_API_KEY, GEMINI_MODEL, GEMINI_FALLBACK_MODELS
 *   OPENROUTER_BASE_URL, GEMINI_BASE_URL (optional gateway overrides)
 */

import { handleChatRequest } from '../server/chat'
import { providerStatus } from '../server/providers'
import type { ProviderEnv } from '../server/providers'

interface NodeRequest {
  method?: string
  body?: unknown
}

interface NodeResponse {
  status: (code: number) => NodeResponse
  setHeader: (name: string, value: string) => void
  json: (payload: unknown) => void
  end: (chunk?: string) => void
}

function env(): ProviderEnv {
  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    OPENROUTER_FALLBACK_MODELS: process.env.OPENROUTER_FALLBACK_MODELS,
    OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_FALLBACK_MODELS: process.env.GEMINI_FALLBACK_MODELS,
    GEMINI_BASE_URL: process.env.GEMINI_BASE_URL,
  }
}

export default async function handler(req: NodeRequest, res: NodeResponse) {
  res.setHeader('cache-control', 'no-store')

  if (req.method === 'GET') {
    res.status(200).json({ ok: true, providers: providerStatus(env()) })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Use GET for status or POST for a reply.' })
    return
  }

  const body = typeof req.body === 'string' ? (JSON.parse(req.body || '{}') as unknown) : (req.body ?? {})
  const result = await handleChatRequest(body as never, env())
  res.status(result.ok ? 200 : result.code === 'bad_request' ? 400 : 503).json(result)
}
