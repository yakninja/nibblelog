// Database schema SQL

export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
`;

export const CREATE_ACTIVITIES_TABLE = `
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  lat REAL,
  lng REAL,
  app_version TEXT NOT NULL,
  description TEXT,
  amount REAL,
  score REAL,
  metadata TEXT,
  deleted_at INTEGER
);
`;

export const CREATE_DELTAS_TABLE = `
CREATE TABLE IF NOT EXISTS deltas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL,
  payload TEXT NOT NULL,
  ts INTEGER NOT NULL,
  sent_at INTEGER,
  server_seq INTEGER
);
`;

export const CREATE_SYNC_STATE_TABLE = `
CREATE TABLE IF NOT EXISTS sync_state (
  user_id TEXT PRIMARY KEY,
  last_server_seq INTEGER NOT NULL DEFAULT 0
);
`;

export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category_id);
CREATE INDEX IF NOT EXISTS idx_deltas_unsent ON deltas(user_id, sent_at);
`;
