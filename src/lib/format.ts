export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function formatCurrency(value: number | null | undefined, options?: { compact?: boolean; digits?: number }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'UNAVAILABLE'
  const digits = options?.digits ?? (value < 1 ? 4 : 2)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: options?.compact ? 'compact' : 'standard',
    maximumFractionDigits: digits,
    minimumFractionDigits: value > 0 && value < 0.01 ? digits : value < 1 ? Math.min(digits, 4) : 0,
  }).format(value)
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'UNAVAILABLE'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value)
}

export function formatPercent(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'UNAVAILABLE'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatSignedCurrency(value: number) {
  const absolute = formatCurrency(Math.abs(value))
  return `${value >= 0 ? '+' : '-'}${absolute}`
}

export function formatRelativeTime(iso: string | null) {
  if (!iso) return 'not updated'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function shortenAddress(value: string | null, start = 4, end = 4) {
  if (!value) return 'NOT CONNECTED'
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

export function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
