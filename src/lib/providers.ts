import { useCallback, useEffect, useRef, useState } from 'react'

export interface ProviderStatus {
  configured: boolean
  models: string[]
}

export interface ProvidersResponse {
  openrouter: ProviderStatus
  gemini: ProviderStatus
  local: ProviderStatus
}

export interface ProviderAttempt {
  provider: string
  model: string
  error: string
}

export interface ProviderInfo {
  provider: 'openrouter' | 'gemini' | 'local'
  model: string
  attempts: ProviderAttempt[]
  at: string
}

export type ModelStatus = 'checking' | 'online' | 'degraded' | 'local'

const EMPTY: ProvidersResponse = {
  openrouter: { configured: false, models: [] },
  gemini: { configured: false, models: [] },
  local: { configured: true, models: ['tsun-local-character-engine'] },
}

/**
 * Reports which model providers the server actually has keys for, so the chat header can be honest
 * about it instead of pretending. Polls lightly and refreshes after every reply.
 */
export function useTsunProviders() {
  const [providers, setProviders] = useState<ProvidersResponse>(EMPTY)
  const [status, setStatus] = useState<ModelStatus>('checking')
  const [lastReply, setLastReply] = useState<ProviderInfo | null>(null)
  const mounted = useRef(true)

  const readStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/chat', { headers: { accept: 'application/json' } })
      if (!response.ok) throw new Error(`status ${response.status}`)
      const payload = (await response.json()) as { providers?: ProvidersResponse }
      if (!mounted.current || !payload.providers) return
      setProviders(payload.providers)
      const configured = payload.providers.openrouter.configured || payload.providers.gemini.configured
      setStatus((current) => (current === 'degraded' ? current : configured ? 'online' : 'local'))
    } catch {
      if (mounted.current) setStatus('local')
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void readStatus()
    const timer = window.setInterval(() => void readStatus(), 90_000)
    return () => {
      mounted.current = false
      window.clearInterval(timer)
    }
  }, [readStatus])

  /** Called with whatever the last turn actually used. */
  const record = useCallback((info: ProviderInfo) => {
    setLastReply(info)
    setStatus(info.provider === 'local' ? 'local' : info.provider === 'openrouter' ? 'online' : 'degraded')
  }, [])

  return { providers, status, lastReply, record, refresh: readStatus }
}
