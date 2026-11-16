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
// puts a *User into the request context. In M0 it never does, so RequireUser
// and RequireAdmin always answer 401 (fail closed).
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
	ID      uuid.UUID
	Email   string
	Name    string
	IsAdmin bool
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
// It never rejects a request; use RequireUser / RequireAdmin for that.
//
// M0 stub: attaches no user. M1 implements the session lookup (sessions JOIN
// users on every request, so a manual is_admin change applies immediately).
func LoadSession(d *app.Deps) func(http.Handler) http.Handler {
	_ = d
	return func(next http.Handler) http.Handler {
		return next
	}
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
// /auth/google/login, /auth/google/callback, /auth/logout, /me.
//
// M0 stub: registers nothing. Implemented in M1.
func Register(r chi.Router, d *app.Deps) {
	_, _ = r, d
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
