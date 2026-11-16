-- Trivial query so `sqlc generate` has something to build in M0.
-- Convention: each milestone adds its own file here (users.sql / sessions.sql
-- for M1, events.sql for M5, analytics.sql for M6), then runs `make gen`.

-- name: Ping :one
SELECT 1::int AS ok;
