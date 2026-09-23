declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      publicKey?: { toString(): string }
      connect: () => Promise<{ publicKey: { toString(): string } }>
      disconnect?: () => Promise<void>
    }
  }
}

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'

function isPlausiblePublicKey(address: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim())
}

export async function requestPhantomConnection(): Promise<string> {
  if (!window.solana?.isPhantom) {
    throw new Error('No Phantom wallet was detected. You can inspect a public address instead.')
  }
  const result = await window.solana.connect()
  return result.publicKey.toString()
}

export async function disconnectPhantomWallet() {
  if (window.solana?.disconnect) await window.solana.disconnect()
}

export async function fetchSolBalance(address: string): Promise<number> {
  const normalized = address.trim()
  if (!isPlausiblePublicKey(normalized)) throw new Error('That does not look like a valid Solana public address.')

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(SOLANA_RPC, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [normalized, { commitment: 'confirmed' }],
      }),
    })
    if (!response.ok) throw new Error(`Solana RPC returned ${response.status}`)
    const result = (await response.json()) as { result?: { value?: number }; error?: { message?: string } }
    if (result.error?.message) throw new Error(result.error.message)
    const lamports = result.result?.value
    if (typeof lamports !== 'number') throw new Error('Solana RPC returned no balance')
    return lamports / 1_000_000_000
  } finally {
    window.clearTimeout(timer)
  }
}
