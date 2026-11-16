package auth

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/oauth2"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

const (
	sessionCookie  = "sid"
	stateCookie    = "oauth_state"
	verifierCookie = "oauth_verifier"
	// oauthCookiePath scopes the state/PKCE cookies to the login + callback.
	oauthCookiePath = "/api/auth/google"
	oauthCookieTTL  = 10 * time.Minute
	sessionTTL      = 30 * 24 * time.Hour

	callbackPath    = "/api/auth/google/callback"
	afterLoginPath  = "/setup/1"
	loginPath       = "/login"
	loginErrorParam = "error"
)

// Store is the subset of *store.Queries the auth package uses.
type Store interface {
	UpsertUserByGoogleSub(ctx context.Context, arg store.UpsertUserByGoogleSubParams) (store.User, error)
	CreateSession(ctx context.Context, arg store.CreateSessionParams) error
	GetSessionUser(ctx context.Context, id string) (store.GetSessionUserRow, error)
	DeleteSession(ctx context.Context, id string) error
	DeleteExpiredSessions(ctx context.Context) error
}

// service holds everything the handlers need. Store and provider are nil when
// DATABASE_URL or the Google credentials are unset; handlers answer 503.
type service struct {
	store         Store
	provider      Provider
	appOrigin     string // normalized scheme://host[:port]
	secureCookies bool
	log           *slog.Logger
	now           func() time.Time
}

func newService(d *app.Deps) *service {
	s := &service{
		appOrigin:     normalizeOrigin(d.Config.AppOrigin),
		secureCookies: strings.HasPrefix(strings.ToLower(d.Config.AppOrigin), "https://"),
		log:           d.Logger,
		now:           time.Now,
	}
	if s.log == nil {
		s.log = slog.New(slog.NewTextHandler(io.Discard, nil))
	}
	if d.Queries != nil { // keep the interface nil, not a typed nil pointer
		s.store = d.Queries
	}
	if d.Config.GoogleClientID != "" && d.Config.GoogleClientSecret != "" {
		redirect := d.Config.OAuthRedirectURL
		if redirect == "" {
			redirect = strings.TrimRight(d.Config.AppOrigin, "/") + callbackPath
		}
		s.provider = newGoogleProvider(d.Config.GoogleClientID, d.Config.GoogleClientSecret, redirect)
	}
	return s
}

func (s *service) routes(r chi.Router) {
	r.Get("/auth/google/login", s.login)
	r.Get("/auth/google/callback", s.callback)
	r.Post("/auth/logout", s.logout)
	r.With(RequireUser).Get("/me", s.me)
}

// ---- middleware -----------------------------------------------------------

func (s *service) loadSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isUnsafeMethod(r.Method) && !s.sameOrigin(r) {
			writeError(w, http.StatusForbidden, "cross-origin request")
			return
		}
		c, err := r.Cookie(sessionCookie)
		if err != nil || c.Value == "" || s.store == nil {
			next.ServeHTTP(w, r)
			return
		}
		row, err := s.store.GetSessionUser(r.Context(), c.Value)
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			s.clearCookie(w, sessionCookie, "/")
			next.ServeHTTP(w, r)
			return
		case err != nil: // fail closed: anonymous
			s.log.ErrorContext(r.Context(), "load session", "err", err)
			next.ServeHTTP(w, r)
			return
		}
		if !row.ExpiresAt.Valid || !s.now().Before(row.ExpiresAt.Time) {
			if err := s.store.DeleteSession(r.Context(), c.Value); err != nil {
				s.log.WarnContext(r.Context(), "delete expired session", "err", err)
			}
			s.clearCookie(w, sessionCookie, "/")
			next.ServeHTTP(w, r)
			return
		}
		u := &User{
			ID:        row.UserID,
			Email:     row.Email,
			Name:      row.Name.String,
			AvatarURL: row.AvatarUrl.String,
			IsAdmin:   row.IsAdmin,
		}
		next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), u)))
	})
}

func isUnsafeMethod(m string) bool {
	switch m {
	case http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodTrace:
		return false
	}
	return true
}

// sameOrigin reports whether the request's Origin (or, failing that, Referer)
// is APP_ORIGIN. Requests carrying neither are rejected.
func (s *service) sameOrigin(r *http.Request) bool {
	src := r.Header.Get("Origin")
	if src == "" || src == "null" {
		src = r.Header.Get("Referer")
	}
	got := normalizeOrigin(src)
	return got != "" && s.appOrigin != "" && got == s.appOrigin
}

// normalizeOrigin returns lower-cased scheme://host[:port] of raw, or "".
func normalizeOrigin(raw string) string {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || u.Scheme == "" || u.Host == "" {
		return ""
	}
	return strings.ToLower(u.Scheme + "://" + u.Host)
}

// ---- handlers -------------------------------------------------------------

func (s *service) login(w http.ResponseWriter, r *http.Request) {
	if s.provider == nil {
		writeError(w, http.StatusServiceUnavailable, "google login is not configured")
		return
	}
	state, err := randomToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	verifier := oauth2.GenerateVerifier()
	s.setCookie(w, stateCookie, state, oauthCookiePath, oauthCookieTTL)
	s.setCookie(w, verifierCookie, verifier, oauthCookiePath, oauthCookieTTL)
	w.Header().Set("Cache-Control", "no-store")
	http.Redirect(w, r, s.provider.AuthCodeURL(state, verifier), http.StatusFound)
}

func (s *service) callback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	w.Header().Set("Cache-Control", "no-store")

	stateC, _ := r.Cookie(stateCookie)
	verifierC, _ := r.Cookie(verifierCookie)
	// One-shot: the state and verifier are never reusable.
	s.clearCookie(w, stateCookie, oauthCookiePath)
	s.clearCookie(w, verifierCookie, oauthCookiePath)

	q := r.URL.Query()
	if q.Get("error") != "" { // e.g. the user cancelled on the consent screen
		s.redirectLoginError(w, r, "denied")
		return
	}
	state := q.Get("state")
	if stateC == nil || verifierC == nil || state == "" ||
		subtle.ConstantTimeCompare([]byte(state), []byte(stateC.Value)) != 1 {
		writeError(w, http.StatusBadRequest, "invalid state")
		return
	}
	code := q.Get("code")
	if code == "" {
		writeError(w, http.StatusBadRequest, "missing code")
		return
	}
	if s.provider == nil || s.store == nil {
		writeError(w, http.StatusServiceUnavailable, "login is not configured")
		return
	}

	id, err := s.provider.Exchange(ctx, code, verifierC.Value)
	if err != nil {
		s.log.WarnContext(ctx, "oauth exchange", "err", err)
		s.redirectLoginError(w, r, "oauth")
		return
	}

	user, err := s.store.UpsertUserByGoogleSub(ctx, store.UpsertUserByGoogleSubParams{
		GoogleSub: id.Sub,
		Email:     id.Email,
		Name:      optText(id.Name),
		AvatarUrl: optText(id.Picture),
	})
	if err != nil {
		s.log.ErrorContext(ctx, "upsert user", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	sid, err := randomToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	expires := s.now().Add(sessionTTL)
	if err := s.store.CreateSession(ctx, store.CreateSessionParams{
		ID:        sid,
		UserID:    user.ID,
		ExpiresAt: pgtype.Timestamptz{Time: expires, Valid: true},
	}); err != nil {
		s.log.ErrorContext(ctx, "create session", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	// Opportunistic cleanup; logins are rare enough that this is cheap.
	if err := s.store.DeleteExpiredSessions(ctx); err != nil {
		s.log.WarnContext(ctx, "delete expired sessions", "err", err)
	}

	s.setCookie(w, sessionCookie, sid, "/", sessionTTL)
	http.Redirect(w, r, afterLoginPath, http.StatusFound)
}

// logout is idempotent: it always clears the cookie, and deletes the session
// row when there is one. (CSRF is enforced by loadSession.)
func (s *service) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil && c.Value != "" && s.store != nil {
		if err := s.store.DeleteSession(r.Context(), c.Value); err != nil {
			s.log.ErrorContext(r.Context(), "delete session", "err", err)
			writeError(w, http.StatusInternalServerError, "internal error")
			return
		}
	}
	s.clearCookie(w, sessionCookie, "/")
	w.WriteHeader(http.StatusNoContent)
}

type meResponse struct {
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatarUrl"`
	IsAdmin   bool    `json:"isAdmin"`
}

func (s *service) me(w http.ResponseWriter, r *http.Request) {
	u, _ := UserFrom(r.Context()) // RequireUser guarantees a user
	resp := meResponse{Name: u.Name, IsAdmin: u.IsAdmin}
	if resp.Name == "" {
		resp.Name = u.Email
	}
	if u.AvatarURL != "" {
		resp.AvatarURL = &u.AvatarURL
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(resp)
}

// ---- helpers --------------------------------------------------------------

func (s *service) redirectLoginError(w http.ResponseWriter, r *http.Request, code string) {
	http.Redirect(w, r, loginPath+"?"+loginErrorParam+"="+url.QueryEscape(code), http.StatusFound)
}

func (s *service) setCookie(w http.ResponseWriter, name, value, path string, ttl time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     path,
		MaxAge:   int(ttl / time.Second),
		Expires:  s.now().Add(ttl),
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
	})
}

func (s *service) clearCookie(w http.ResponseWriter, name, path string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     path,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
	})
}

// randomToken returns 32 random bytes, base64url without padding.
func randomToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func optText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: s != ""}
}
