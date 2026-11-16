-- Event ingest (M5). One statement per batch: the per-event columns are
-- passed as parallel arrays of equal length and expanded with unnest (several
-- set-returning functions in one SELECT list are zipped row by row); the
-- per-request columns (user_hash, device_*) are scalars. ts is left to the
-- column default now(), so every row carries the server receive time.

-- name: InsertEvents :execrows
INSERT INTO web_access_logs (
  client_ts, session_id, event_type, feature_target, user_hash, device_type, device_info
)
SELECT
  unnest(sqlc.arg('client_ts')::timestamptz[]),
  unnest(sqlc.arg('session_ids')::text[]),
  unnest(sqlc.arg('event_types')::text[])::event_type,
  NULLIF(unnest(sqlc.arg('feature_targets')::text[]), ''),
  sqlc.narg('user_hash')::text,
  sqlc.arg('device_type')::text,
  sqlc.narg('device_info')::text;
