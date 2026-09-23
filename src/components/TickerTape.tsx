export function TickerTape() {
  const messages = [
    'TSUN SYSTEMS BIOS v2.04 — SHIBUYA FLOOR 4',
    'A number without a source is just fan fiction. — TSUN',
    'Daily quota $0 / $250.0k — 12 brokers 0 on lines',
    'Market is wrong — TSUN desk',
    'HUMILITY.exe has never existed — stop double-clicking',
    'Verify before you flex — TSUN wisdom',
    'Attitude coprocessor present but unlicensed',
    'TSUN 98 — SHAREHOLDER SERVICES: DENIED',
    'Parody fan project — not financial advice',
  ]
  const tape = [...messages, ...messages].join(' • ')
  return (
    <div className="ticker-tape" aria-label="TSUN tape">
      <span>THE TAPE</span>
      <div className="tape-scroll"><div className="tape-content">{tape} • {tape}</div></div>
      <span className="tape-price">25¢</span>
    </div>
  )
}
