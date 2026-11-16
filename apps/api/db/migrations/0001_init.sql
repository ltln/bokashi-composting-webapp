-- +goose Up
-- Schema from docs/PLAN.md §3.1.

-- users: only needed for login; PII lives here, never in logs
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub    TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT false,  -- set manually (make admin EMAIL=...)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (           -- server-side auth sessions
  id            TEXT PRIMARY KEY, -- random 32 bytes, base64url
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE event_type AS ENUM ('page_view','switch_tab','view_3d_step','click_faq_3d');

CREATE TABLE web_access_logs (
  id             BIGSERIAL PRIMARY KEY,
  ts             TIMESTAMPTZ NOT NULL DEFAULT now(),  -- server receive time (authoritative)
  client_ts      TIMESTAMPTZ,                         -- client-reported time
  session_id     TEXT NOT NULL,                       -- anonymous, rotates per browser session
  user_hash      TEXT,                                -- HMAC-SHA256(user_id, secret), optional
  event_type     event_type NOT NULL,
  feature_target TEXT,                                -- validated against enum list
  device_type    TEXT NOT NULL,                       -- mobile|desktop|tablet
  device_info    TEXT                                 -- trimmed UA / OS / browser
);
CREATE INDEX ON web_access_logs (ts DESC);
CREATE INDEX ON web_access_logs (feature_target, ts);
CREATE INDEX ON web_access_logs (event_type, ts);

-- +goose Down
DROP TABLE web_access_logs;
DROP TYPE event_type;
DROP TABLE sessions;
DROP TABLE users;
