-- Deltas table (authoritative sync stream)
CREATE TABLE IF NOT EXISTS deltas (
    server_seq BIGSERIAL PRIMARY KEY,
    id UUID UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    op TEXT NOT NULL,
    payload JSONB NOT NULL,
    ts BIGINT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient sync pulls
CREATE INDEX IF NOT EXISTS idx_deltas_user_seq ON deltas(user_id, server_seq);

-- Index for idempotency checks
CREATE INDEX IF NOT EXISTS idx_deltas_id ON deltas(id);
