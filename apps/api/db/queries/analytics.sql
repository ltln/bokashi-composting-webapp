-- Admin dashboard queries (M6). Every query takes the same two optional
-- filters: since (lower bound on ts, NULL = whole campaign) and device
-- (device_type, NULL = all devices). user_hash is never selected.

-- name: AnalyticsSummary :one
SELECT
  count(*)::bigint                                           AS total_events,
  count(DISTINCT session_id)::bigint                         AS unique_sessions,
  (count(*) FILTER (WHERE event_type = 'page_view'))::bigint AS page_views,
  (count(*) FILTER (WHERE device_type = 'mobile'))::bigint   AS mobile_events
FROM web_access_logs
WHERE (sqlc.narg('since')::timestamptz IS NULL OR ts >= sqlc.narg('since'))
  AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'));

-- name: AnalyticsFeatures :many
SELECT feature_target::text AS target, count(*)::bigint AS count
FROM web_access_logs
WHERE feature_target IS NOT NULL
  AND (sqlc.narg('since')::timestamptz IS NULL OR ts >= sqlc.narg('since'))
  AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
GROUP BY feature_target
ORDER BY count(*) DESC, feature_target;

-- name: AnalyticsEventTypes :many
SELECT event_type::text AS type, count(*)::bigint AS count
FROM web_access_logs
WHERE (sqlc.narg('since')::timestamptz IS NULL OR ts >= sqlc.narg('since'))
  AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
GROUP BY event_type
ORDER BY count(*) DESC, event_type::text;

-- name: AnalyticsDevices :many
SELECT device_type, count(*)::bigint AS count
FROM web_access_logs
WHERE (sqlc.narg('since')::timestamptz IS NULL OR ts >= sqlc.narg('since'))
  AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
GROUP BY device_type
ORDER BY count(*) DESC, device_type;

-- name: AnalyticsLogs :many
-- Keyset pagination on (ts, id), newest first. cursor_* NULL = first page.
-- target is a literal prefix (starts_with, so "_" and "%" are not wildcards).
SELECT id, ts, session_id, event_type::text AS event_type,
       feature_target, device_type, device_info
FROM web_access_logs
WHERE (sqlc.narg('since')::timestamptz IS NULL OR ts >= sqlc.narg('since'))
  AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
  AND (sqlc.narg('target')::text IS NULL OR starts_with(feature_target, sqlc.narg('target')))
  AND (sqlc.narg('cursor_ts')::timestamptz IS NULL
       OR (ts, id) < (sqlc.narg('cursor_ts')::timestamptz, sqlc.narg('cursor_id')::bigint))
ORDER BY ts DESC, id DESC
LIMIT sqlc.arg('row_limit');
