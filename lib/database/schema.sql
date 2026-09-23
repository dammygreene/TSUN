-- TSUN Postgres schema (production target).
-- The MVP sandbox has no database, so the app runs on a storage abstraction
-- (localStorage on the client, in memory on the server) with identical
-- semantics. Wire these tables when DATABASE_URL is provisioned.
--
-- Conventions: timestamptz everywhere, immutable trade and milestone rows,
-- tool call audit log for every external action.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  address     TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallets_user_idx ON wallets(user_id);

CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary    TEXT
);
CREATE INDEX IF NOT EXISTS conversations_user_idx ON conversations(user_id);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','tsun','system')),
  text            TEXT NOT NULL,
  mood            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS user_memory (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  relationship    TEXT NOT NULL DEFAULT 'STRANGER',
  score           INTEGER NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  discussed_assets TEXT[] NOT NULL DEFAULT '{}',
  summaries       TEXT[] NOT NULL DEFAULT '{}',
  notes           TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS relationships (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level      TEXT NOT NULL DEFAULT 'STRANGER',
  score      INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tsun_state (
  id           TEXT PRIMARY KEY DEFAULT 'singleton' CHECK (id = 'singleton'),
  mood         TEXT NOT NULL DEFAULT 'ANNOYED',
  quote        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tsun_moods (
  id         BIGSERIAL PRIMARY KEY,
  mood       TEXT NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tsun_moods_created_idx ON tsun_moods(created_at);

CREATE TABLE IF NOT EXISTS market_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  symbol        TEXT NOT NULL,
  price_usd     DOUBLE PRECISION,
  change_24h    DOUBLE PRECISION,
  market_cap    DOUBLE PRECISION,
  volume_24h    DOUBLE PRECISION,
  liquidity_usd DOUBLE PRECISION,
  holders       BIGINT,
  source        TEXT NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS market_snapshots_symbol_idx ON market_snapshots(symbol, fetched_at DESC);

CREATE TABLE IF NOT EXISTS tsun_portfolio (
  id            TEXT PRIMARY KEY DEFAULT 'singleton' CHECK (id = 'singleton'),
  mode          TEXT NOT NULL DEFAULT 'SIMULATED' CHECK (mode IN ('SIMULATED','LIVE')),
  starting_nav  DOUBLE PRECISION NOT NULL,
  current_nav   DOUBLE PRECISION,
  realized_pnl  DOUBLE PRECISION NOT NULL DEFAULT 0,
  unrealized_pnl DOUBLE PRECISION,
  max_drawdown_pct DOUBLE PRECISION,
  wallet_address TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tsun_positions (
  asset         TEXT PRIMARY KEY,
  quantity      DOUBLE PRECISION NOT NULL,
  avg_entry     DOUBLE PRECISION NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable blotter. No updates, inserts only. Verified trades need a signature.
CREATE TABLE IF NOT EXISTS tsun_trades (
  id           TEXT PRIMARY KEY,
  side         TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
  asset        TEXT NOT NULL,
  quantity     DOUBLE PRECISION NOT NULL,
  price        DOUBLE PRECISION NOT NULL,
  value_usd    DOUBLE PRECISION NOT NULL,
  tx_signature TEXT,
  verified     BOOLEAN NOT NULL DEFAULT FALSE,
  simulated    BOOLEAN NOT NULL DEFAULT TRUE,
  executed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tsun_trades_asset_idx ON tsun_trades(asset, executed_at DESC);

-- Milestones: one row per target, unique trigger. Status flips once, never back.
CREATE TABLE IF NOT EXISTS milestones (
  milestone_id        TEXT PRIMARY KEY,
  target_market_cap   DOUBLE PRECISION NOT NULL,
  status              TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED','UNLOCKED')),
  reached_at          TIMESTAMPTZ,
  market_cap_at_trigger DOUBLE PRECISION,
  artwork_url         TEXT,
  post_id             TEXT,
  dialogue_unlock     TEXT,
  personality_unlock  TEXT
);

CREATE TABLE IF NOT EXISTS unlocks (
  id           BIGSERIAL PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES milestones(milestone_id),
  kind         TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (milestone_id, kind)
);

CREATE TABLE IF NOT EXISTS x_posts (
  id           TEXT PRIMARY KEY,
  content      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'staging' CHECK (status IN ('staging','queued','published','failed')),
  source_event TEXT,
  media_url    TEXT,
  x_post_id    TEXT UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_events (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  severity   SMALLINT NOT NULL DEFAULT 1,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  linked_app TEXT,
  fact       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_events_created_idx ON agent_events(created_at DESC);

-- Audit every external action: market fetch, wallet read, post, trade.
CREATE TABLE IF NOT EXISTS tool_calls (
  id         BIGSERIAL PRIMARY KEY,
  tool       TEXT NOT NULL,
  ok         BOOLEAN NOT NULL,
  source     TEXT NOT NULL,
  error      TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tool_calls_tool_idx ON tool_calls(tool, fetched_at DESC);
