// Package auth owns Google OAuth, server-side sessions and the user/admin
// checks (milestone M1).
//
// The seam other packages rely on is stable from M0:
//
//	type User struct{ ... }
//	func UserFrom(ctx) (*User, bool)
//	func RequireUser(next http.Handler) http.Handler
//	func RequireAdmin(next http.Handler) http.Handler
//
// LoadSession is mounted globally by the router and is the only place that
// puts a *User into the request context. It joins sessions → users on every
// request, so a manual `is_admin` change applies on the next request.
package auth

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
)

// User is the authenticated user attached to a request.
type User struct {
	ID        uuid.UUID
	Email     string
	Name      string
	AvatarURL string
	IsAdmin   bool
}

type ctxKey struct{}

// WithUser returns a copy of ctx carrying u. Only LoadSession should call it in
// production code; tests in other packages use it to fake a logged-in user.
func WithUser(ctx context.Context, u *User) context.Context {
	return context.WithValue(ctx, ctxKey{}, u)
}

// UserFrom returns the user for the current request, if any.
func UserFrom(ctx context.Context) (*User, bool) {
	u, ok := ctx.Value(ctxKey{}).(*User)
	return u, ok && u != nil
}

// LoadSession resolves the `sid` cookie into a *User on the request context.
//
// It does not reject anonymous requests (use RequireUser / RequireAdmin for
// that), with one exception: state-changing requests (POST, PUT, PATCH,
// DELETE) whose Origin does not match APP_ORIGIN get 403, as CSRF protection
// for every /api route.
//
// Expired or unknown sessions are treated as anonymous, and the stale cookie
// is cleared.
func LoadSession(d *app.Deps) func(http.Handler) http.Handler {
	return newService(d).loadSession
}

// RequireUser rejects requests without an authenticated user with 401.
func RequireUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := UserFrom(r.Context()); !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireAdmin rejects anonymous requests with 401 and non-admins with 403.
// IsAdmin comes from LoadSession's per-request DB read and is never cached.
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, ok := UserFrom(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		if !u.IsAdmin {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Register mounts the auth routes on r, which is the /api sub-router:
// GET /auth/google/login, GET /auth/google/callback, POST /auth/logout,
// GET /me.
func Register(r chi.Router, d *app.Deps) {
	newService(d).routes(r)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
