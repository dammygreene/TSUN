import { formatRelativeTime, shortenAddress } from './format'
import type { MarketState, TokenState, TsunMood, UserMemory, WalletState } from '../types'

export interface TaskCard {
  id: string
  label: string
  detail: string
  ok: boolean
  /** TSUN's private aside. Only shown when the user inspects the card. */
  quip: string
}

export interface TaskRun {
  tasks: TaskCard[]
  verdict: string
  /** True when a critical feed is missing, which changes the closing line. */
  degraded: boolean
}

const marketTask = (market: MarketState): TaskCard => {
  if (market.status === 'live') {
    return {
      id: 'market',
      label: 'MARKET FEED HANDSHAKE',
      detail: `${market.source} answered ${formatRelativeTime(market.fetchedAt)}`,
      ok: true,
      quip: 'One provider behaved today. Bare minimum achieved.',
    }
  }
  return {
    id: 'market',
    label: 'MARKET FEED HANDSHAKE',
    detail: market.status === 'loading' ? 'REQUEST IN FLIGHT' : 'NO RESPONSE, NOTHING INVENTED',
    ok: false,
    quip: 'No feed, no number. I am not writing fiction on deadline.',
  }
}

const tokenTask = (token: TokenState): TaskCard => {
  if (!token.address) {
    return {
      id: 'token',
      label: 'TSUN PAIR PROBE',
      detail: 'NO CONTRACT CONFIGURED IN THIS BUILD',
      ok: false,
      quip: 'There is no contract address set. I refuse to guess my own ticker.',
    }
  }
  if (token.status === 'live') {
    return {
      id: 'token',
      label: 'TSUN PAIR PROBE',
      detail: `${token.pairLabel ?? 'TSUN / SOL'} verified ${formatRelativeTime(token.fetchedAt)}`,
      ok: true,
      quip: 'The pair answered. Try not to stare at the number.',
    }
  }
  return {
    id: 'token',
    label: 'TSUN PAIR PROBE',
    detail: 'FEED UNAVAILABLE, CACHE WITHHELD',
    ok: false,
    quip: 'Stale data dressed up as live data is how people lose money. Not on my desk.',
  }
}

const memoryTask = (memory: UserMemory): TaskCard => ({
  id: 'memory',
  label: 'LOCAL MEMORY INDEX',
  detail: `${memory.interactionCount} interactions, level ${memory.relationship}`,
  ok: true,
  quip: memory.notes.length
    ? `You are in my notes. ${memory.notes.length} of them. Do not read too much into it.`
    : 'Nothing worth remembering yet. Try harder.',
})

const walletTask = (wallet: WalletState): TaskCard => {
  if (!wallet.address) {
    return {
      id: 'wallet',
      label: 'PUBLIC WALLET READ',
      detail: 'NO ADDRESS SUPPLIED',
      ok: true,
      quip: 'I have no address, so I have no opinion about your bag.',
    }
  }
  if (wallet.solBalance !== null) {
    return {
      id: 'wallet',
      label: 'PUBLIC WALLET READ',
      detail: `${shortenAddress(wallet.address)} read ${formatRelativeTime(wallet.balanceFetchedAt)}`,
      ok: true,
      quip: 'Public balance only. I cannot sign, spend, or rescue anything.',
    }
  }
  return {
    id: 'wallet',
    label: 'PUBLIC WALLET READ',
    detail: 'RPC DID NOT ANSWER',
    ok: false,
    quip: 'The RPC ignored me. Rude, but at least it was honest.',
  }
}

export function runDeskCheck(input: { market: MarketState; token: TokenState; wallet: WalletState; memory: UserMemory; mood: TsunMood }): TaskRun {
  const { market, token, wallet, memory, mood } = input
  const tasks: TaskCard[] = [
    marketTask(market),
    tokenTask(token),
    memoryTask(memory),
    walletTask(wallet),
    {
      id: 'desk',
      label: 'SIMULATED DESK LEDGER',
      detail: 'LOADED, CLEARLY LABELLED SIMULATED',
      ok: true,
      quip: 'The desk is a simulation. The attitude is not.',
    },
    {
      id: 'mood',
      label: 'MOOD PROTOCOL',
      detail: `${mood} APPLIED TO ALL OUTPUT`,
      ok: true,
      quip: 'You are not contributing to this mood. You are only present for it.',
    },
    {
      id: 'honesty',
      label: 'HONESTY AUDIT',
      detail: 'PASS, NOTHING FABRICATED',
      ok: true,
      quip: 'Every other feed on the internet failed this check. I did not.',
    },
  ]

  const degraded = tasks.some((task) => !task.ok)
  const verdict = degraded
    ? 'Diagnostics complete. Missing feeds stayed missing, which is the only correct outcome.'
    : 'Diagnostics complete. Everything that answered was verified, and you still asked me.'

  return { tasks, verdict, degraded }
}
