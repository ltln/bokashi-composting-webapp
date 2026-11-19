-- Admin overview (the "Tổng quan truy cập" board). Every query takes a
-- half-open window [from_ts, to_ts) and an optional device (device_type,
-- NULL = all devices). Only logged-in activity exists in web_access_logs, so
-- every row counts.
--
-- Definitions (shown on the dashboard under "Cách tính số liệu"):
-- * visitor: user_hash; rows stored without one (USER_HASH_SECRET unset)
--   fall back to their anonymous session_id, so nothing is dropped.
-- * visit (lượt truy cập): a run of one visitor's events on one device type
--   with no gap longer than 30 minutes. The scan starts 30 minutes before
--   from_ts so a visit that began earlier is not counted again.
-- * screen view (lượt xem trang): a setup step (view_3d_step), an FAQ detail
--   (click_faq_3d) or the FAQ list (switch_tab -> Tab_2_FAQ). page_view (app
--   opened) is not a screen.
--
-- user_hash is never selected; only counts derived from it leave the database.

-- name: OverviewTotals :one
WITH ev AS (
  SELECT ts, event_type, feature_target, device_type,
         COALESCE(user_hash, 'sid:' || session_id) AS visitor,
         (lag(ts) OVER w IS NULL OR ts - lag(ts) OVER w > interval '30 minutes') AS starts
  FROM web_access_logs
  WHERE ts >= sqlc.arg('from_ts')::timestamptz - interval '30 minutes'
    AND ts < sqlc.arg('to_ts')::timestamptz
    AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
  WINDOW w AS (PARTITION BY COALESCE(user_hash, 'sid:' || session_id), device_type ORDER BY ts, id)
),
cur AS (SELECT * FROM ev WHERE ts >= sqlc.arg('from_ts')::timestamptz),
first_seen AS (
  SELECT COALESCE(user_hash, 'sid:' || session_id) AS visitor, min(ts) AS first_ts
  FROM web_access_logs
  WHERE ts < sqlc.arg('to_ts')::timestamptz
  GROUP BY 1
)
SELECT
  (count(*) FILTER (WHERE cur.starts))::bigint                                    AS visits,
  count(DISTINCT cur.visitor)::bigint                                             AS users,
  count(DISTINCT cur.visitor) FILTER (WHERE fs.first_ts >= sqlc.arg('from_ts')::timestamptz)::bigint AS new_users,
  (count(*) FILTER (WHERE cur.event_type IN ('view_3d_step', 'click_faq_3d')
                       OR (cur.event_type = 'switch_tab' AND cur.feature_target = 'Tab_2_FAQ')))::bigint AS screen_views,
  (count(*) FILTER (WHERE cur.starts AND cur.device_type = 'mobile'))::bigint   AS mobile_visits,
  (count(*) FILTER (WHERE cur.starts AND cur.device_type = 'desktop'))::bigint  AS desktop_visits,
  (count(*) FILTER (WHERE cur.starts AND cur.device_type = 'tablet'))::bigint   AS tablet_visits
FROM cur
JOIN first_seen fs ON fs.visitor = cur.visitor;

-- name: OverviewSeries :many
-- One row per local (Asia/Ho_Chi_Minh) hour or day that has activity; the
-- caller fills the empty buckets. bucket_unit is 'hour' or 'day'.
WITH ev AS (
  SELECT ts, event_type, feature_target,
         COALESCE(user_hash, 'sid:' || session_id) AS visitor,
         (lag(ts) OVER w IS NULL OR ts - lag(ts) OVER w > interval '30 minutes') AS starts
  FROM web_access_logs
  WHERE ts >= sqlc.arg('from_ts')::timestamptz - interval '30 minutes'
    AND ts < sqlc.arg('to_ts')::timestamptz
    AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
  WINDOW w AS (PARTITION BY COALESCE(user_hash, 'sid:' || session_id), device_type ORDER BY ts, id)
)
SELECT
  date_trunc(sqlc.arg('bucket_unit')::text, ts AT TIME ZONE 'Asia/Ho_Chi_Minh')::timestamp AS bucket,
  (count(*) FILTER (WHERE starts))::bigint AS visits,
  count(DISTINCT visitor)::bigint          AS users,
  (count(*) FILTER (WHERE event_type IN ('view_3d_step', 'click_faq_3d')
                       OR (event_type = 'switch_tab' AND feature_target = 'Tab_2_FAQ')))::bigint AS screen_views
FROM ev
WHERE ts >= sqlc.arg('from_ts')::timestamptz
GROUP BY 1
ORDER BY 1;

-- name: OverviewPages :many
SELECT feature_target::text AS target,
       count(*)::bigint AS views,
       count(DISTINCT COALESCE(user_hash, 'sid:' || session_id))::bigint AS viewers
FROM web_access_logs
WHERE ts >= sqlc.arg('from_ts')::timestamptz
  AND ts < sqlc.arg('to_ts')::timestamptz
  AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
  AND (event_type IN ('view_3d_step', 'click_faq_3d')
       OR (event_type = 'switch_tab' AND feature_target = 'Tab_2_FAQ'))
GROUP BY feature_target
ORDER BY count(*) DESC, feature_target;

-- name: OverviewHours :many
-- Visits started per local hour of day (0-23); hours without visits are omitted.
WITH ev AS (
  SELECT ts,
         (lag(ts) OVER w IS NULL OR ts - lag(ts) OVER w > interval '30 minutes') AS starts
  FROM web_access_logs
  WHERE ts >= sqlc.arg('from_ts')::timestamptz - interval '30 minutes'
    AND ts < sqlc.arg('to_ts')::timestamptz
    AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
  WINDOW w AS (PARTITION BY COALESCE(user_hash, 'sid:' || session_id), device_type ORDER BY ts, id)
)
SELECT extract(hour FROM ts AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS hour,
       count(*)::bigint AS visits
FROM ev
WHERE starts AND ts >= sqlc.arg('from_ts')::timestamptz
GROUP BY 1
ORDER BY 1;

-- name: OverviewFunnel :one
-- How many visitors in the window reached each step of the journey.
WITH per_visitor AS (
  SELECT COALESCE(user_hash, 'sid:' || session_id) AS visitor,
         bool_or(feature_target = '3D_Setup_Layer1') AS step1,
         count(DISTINCT feature_target) FILTER (WHERE event_type = 'view_3d_step') AS steps,
         bool_or(feature_target = 'Tab_2_FAQ' OR event_type = 'click_faq_3d') AS faq_tab,
         bool_or(event_type = 'click_faq_3d') AS faq_detail
  FROM web_access_logs
  WHERE ts >= sqlc.arg('from_ts')::timestamptz
    AND ts < sqlc.arg('to_ts')::timestamptz
    AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'))
  GROUP BY 1
)
SELECT
  count(*)::bigint                                AS users,
  (count(*) FILTER (WHERE step1))::bigint         AS step1,
  (count(*) FILTER (WHERE steps >= 3))::bigint    AS all_steps,
  (count(*) FILTER (WHERE faq_tab))::bigint       AS faq_tab,
  (count(*) FILTER (WHERE faq_detail))::bigint    AS faq_detail
FROM per_visitor;

-- name: OverviewOnline :one
-- Visitors with any event since since_ts ("đang online").
SELECT count(DISTINCT COALESCE(user_hash, 'sid:' || session_id))::bigint AS online
FROM web_access_logs
WHERE ts >= sqlc.arg('since_ts')::timestamptz
  AND (sqlc.narg('device')::text IS NULL OR device_type = sqlc.narg('device'));
