import { handleChatCore, type ChatCoreRequest } from '../server/chatCore.ts'

export const config = {
  runtime: 'nodejs',
}

function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const headers = corsHeaders(request.headers.get('Origin') || undefined)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    if (request.method === 'GET') {
      return Response.json({ ok: true, service: 'tsun-chat', hasOpenRouter: !!process.env.OPENROUTER_API_KEY, hasGemini: !!process.env.GEMINI_API_KEY }, { headers })
    }

    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers })
    }

    try {
      const body = await request.json() as ChatCoreRequest
      if (!body?.prompt || typeof body.prompt !== 'string') {
        return Response.json({ error: 'Missing prompt' }, { status: 400, headers })
      }

      // Basic size limits
      if (body.prompt.length > 2000) {
        return Response.json({ error: 'Prompt too long' }, { status: 400, headers })
      }

      // Build env map from process.env
      const env: Record<string, string> = {}
      for (const k of ['OPENROUTER_API_KEY','OPENROUTER_MODEL','OPENROUTER_FALLBACK_MODELS','OPENROUTER_SITE_URL','OPENROUTER_APP_TITLE','GEMINI_API_KEY','GEMINI_MODEL']) {
        const v = process.env[k]
        if (v) env[k] = v
      }

      const result = await handleChatCore(body, env)

      if (!result) {
        return Response.json({ error: 'LLM providers unavailable or misconfigured', fallback: true }, { status: 503, headers })
      }

      return Response.json(result, { headers })
    } catch (e) {
      console.error('[api/chat] error', e)
      return Response.json({ error: e instanceof Error ? e.message : 'Internal error', fallback: true }, { status: 500, headers })
    }
  }
}
