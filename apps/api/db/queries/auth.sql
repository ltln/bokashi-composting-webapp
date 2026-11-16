-- name: UpsertUserByGoogleSub :one
-- Creates the user on first login; later logins refresh the profile fields.
-- is_admin is never touched here (set by hand with `make admin`).
INSERT INTO users (google_sub, email, name, avatar_url)
VALUES ($1, $2, $3, $4)
ON CONFLICT (google_sub) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url
RETURNING *;

-- name: CreateSession :exec
INSERT INTO sessions (id, user_id, expires_at)
VALUES ($1, $2, $3);

-- name: GetSessionUser :one
-- One primary-key lookup per request. is_admin is read live from users, so a
-- manual DB change applies on the next request without logging in again.
SELECT s.expires_at,
       u.id AS user_id,
       u.email,
       u.name,
       u.avatar_url,
       u.is_admin
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.id = $1;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = $1;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= now();
