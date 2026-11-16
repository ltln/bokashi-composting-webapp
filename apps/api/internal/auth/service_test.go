package auth

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/config"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

const testOrigin = "https://app.example"

// ---- fakes ----------------------------------------------------------------

type fakeProvider struct {
	identity     Identity
	err          error
	gotCode      string
	gotVerifier  string
	exchangeHits int
}

func (p *fakeProvider) AuthCodeURL(state, verifier string) string {
	return "https://accounts.example/auth?state=" + url.QueryEscape(state) + "&v=" + url.QueryEscape(verifier)
}

func (p *fakeProvider) Exchange(_ context.Context, code, verifier string) (Identity, error) {
	p.exchangeHits++
	p.gotCode, p.gotVerifier = code, verifier
	return p.identity, p.err
}

type fakeStore struct {
	mu       sync.Mutex
	users    map[uuid.UUID]*store.User
	bySub    map[string]uuid.UUID
	sessions map[string]store.Session
}

func newFakeStore() *fakeStore {
	return &fakeStore{
		users:    map[uuid.UUID]*store.User{},
		bySub:    map[string]uuid.UUID{},
		sessions: map[string]store.Session{},
	}
}

func (f *fakeStore) UpsertUserByGoogleSub(_ context.Context, a store.UpsertUserByGoogleSubParams) (store.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	id, ok := f.bySub[a.GoogleSub]
	if !ok {
		id = uuid.New()
		f.bySub[a.GoogleSub] = id
		f.users[id] = &store.User{ID: id, GoogleSub: a.GoogleSub}
	}
	u := f.users[id]
	u.Email, u.Name, u.AvatarUrl = a.Email, a.Name, a.AvatarUrl
	return *u, nil
}

func (f *fakeStore) CreateSession(_ context.Context, a store.CreateSessionParams) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.sessions[a.ID] = store.Session{ID: a.ID, UserID: a.UserID, ExpiresAt: a.ExpiresAt}
	return nil
}

func (f *fakeStore) GetSessionUser(_ context.Context, id string) (store.GetSessionUserRow, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	s, ok := f.sessions[id]
	if !ok {
		return store.GetSessionUserRow{}, pgx.ErrNoRows
	}
	u := f.users[s.UserID]
	return store.GetSessionUserRow{
		ExpiresAt: s.ExpiresAt, UserID: u.ID, Email: u.Email,
		Name: u.Name, AvatarUrl: u.AvatarUrl, IsAdmin: u.IsAdmin,
	}, nil
}

func (f *fakeStore) DeleteSession(_ context.Context, id string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.sessions, id)
	return nil
}

func (f *fakeStore) DeleteExpiredSessions(context.Context) error { return nil }

// addSession creates a user (admin or not) with a session expiring at exp.
func (f *fakeStore) addSession(t *testing.T, admin bool, exp time.Time) (sid string, userID uuid.UUID) {
	t.Helper()
	u, _ := f.UpsertUserByGoogleSub(context.Background(), store.UpsertUserByGoogleSubParams{
		GoogleSub: uuid.NewString(), Email: "a@example.com",
		Name: pgtype.Text{String: "An", Valid: true},
	})
	f.users[u.ID].IsAdmin = admin
	sid, _ = randomToken()
	_ = f.CreateSession(context.Background(), store.CreateSessionParams{
		ID: sid, UserID: u.ID, ExpiresAt: pgtype.Timestamptz{Time: exp, Valid: true},
	})
	return sid, u.ID
}

func (f *fakeStore) setAdmin(id uuid.UUID, admin bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.users[id].IsAdmin = admin
}

// ---- harness --------------------------------------------------------------

var fixedNow = time.Date(2026, 11, 16, 12, 0, 0, 0, time.UTC)

type harness struct {
	t        *testing.T
	store    *fakeStore
	provider *fakeProvider
	svc      *service
	h        http.Handler
}

// newHarness mirrors router.go: LoadSession on /api, auth routes, plus a
// stand-in admin route guarded by RequireAdmin (like /api/admin/* in M6).
func newHarness(t *testing.T) *harness {
	t.Helper()
	fs, fp := newFakeStore(), &fakeProvider{}
	svc := newService(&app.Deps{Config: config.Config{AppOrigin: testOrigin}})
	svc.store, svc.provider = fs, fp
	svc.now = func() time.Time { return fixedNow }
	svc.log = slog.New(slog.NewTextHandler(io.Discard, nil))

	r := chi.NewRouter()
	r.Route("/api", func(api chi.Router) {
		api.Use(svc.loadSession)
		svc.routes(api)
		api.With(RequireAdmin).Get("/admin/summary", func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		})
		api.With(RequireUser).Post("/events", func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusAccepted)
		})
	})
	return &harness{t: t, store: fs, provider: fp, svc: svc, h: r}
}

func (h *harness) do(req *http.Request) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.h.ServeHTTP(rec, req)
	return rec
}

func withSID(req *http.Request, sid string) *http.Request {
	req.AddCookie(&http.Cookie{Name: sessionCookie, Value: sid})
	return req
}

func cookieFrom(rec *httptest.ResponseRecorder, name string) *http.Cookie {
	var last *http.Cookie
	for _, c := range rec.Result().Cookies() {
		if c.Name == name {
			last = c
		}
	}
	return last
}

// ---- tests ----------------------------------------------------------------

func TestLoginSetsStateAndPKCECookies(t *testing.T) {
	h := newHarness(t)
	rec := h.do(httptest.NewRequest(http.MethodGet, "/api/auth/google/login", nil))
	if rec.Code != http.StatusFound {
		t.Fatalf("status = %d, want 302", rec.Code)
	}
	state, verifier := cookieFrom(rec, stateCookie), cookieFrom(rec, verifierCookie)
	if state == nil || verifier == nil {
		t.Fatal("missing state or verifier cookie")
	}
	for _, c := range []*http.Cookie{state, verifier} {
		if !c.HttpOnly || !c.Secure || c.SameSite != http.SameSiteLaxMode || c.Path != oauthCookiePath || c.MaxAge <= 0 || c.MaxAge > 600 {
			t.Errorf("cookie %s attrs = %+v", c.Name, c)
		}
	}
	loc, _ := url.Parse(rec.Header().Get("Location"))
	if loc.Query().Get("state") != state.Value || loc.Query().Get("v") != verifier.Value {
		t.Errorf("redirect %q does not carry the cookie state/verifier", loc)
	}
}

func TestLoginWithoutProvider(t *testing.T) {
	h := newHarness(t)
	h.svc.provider = nil
	if rec := h.do(httptest.NewRequest(http.MethodGet, "/api/auth/google/login", nil)); rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
}

func callbackReq(query string, state, verifier string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/api/auth/google/callback?"+query, nil)
	if state != "" {
		req.AddCookie(&http.Cookie{Name: stateCookie, Value: state})
	}
	if verifier != "" {
		req.AddCookie(&http.Cookie{Name: verifierCookie, Value: verifier})
	}
	return req
}

func TestCallbackStateMismatch(t *testing.T) {
	cases := map[string]*http.Request{
		"mismatch":       callbackReq("state=evil&code=c", "good", "v"),
		"no cookie":      callbackReq("state=good&code=c", "", "v"),
		"no state param": callbackReq("code=c", "good", "v"),
		"no verifier":    callbackReq("state=good&code=c", "good", ""),
	}
	for name, req := range cases {
		t.Run(name, func(t *testing.T) {
			h := newHarness(t)
			rec := h.do(req)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", rec.Code)
			}
			if h.provider.exchangeHits != 0 {
				t.Fatal("code was exchanged despite bad state")
			}
			if c := cookieFrom(rec, sessionCookie); c != nil {
				t.Fatal("sid cookie set despite bad state")
			}
			if c := cookieFrom(rec, stateCookie); c == nil || c.MaxAge >= 0 {
				t.Fatal("state cookie not cleared")
			}
		})
	}
}

func TestCallbackCreatesUserAndSession(t *testing.T) {
	h := newHarness(t)
	h.provider.identity = Identity{Sub: "g-123", Email: "lan@example.com", Name: "Lan", Picture: "https://img.example/a.png"}

	rec := h.do(callbackReq("state=s1&code=the-code", "s1", "ver-1"))
	if rec.Code != http.StatusFound || rec.Header().Get("Location") != "/setup/1" {
		t.Fatalf("got %d → %q, want 302 → /setup/1", rec.Code, rec.Header().Get("Location"))
	}
	if h.provider.gotCode != "the-code" || h.provider.gotVerifier != "ver-1" {
		t.Errorf("exchange got code=%q verifier=%q", h.provider.gotCode, h.provider.gotVerifier)
	}

	sid := cookieFrom(rec, sessionCookie)
	if sid == nil || sid.Value == "" {
		t.Fatal("no sid cookie")
	}
	if !sid.HttpOnly || !sid.Secure || sid.SameSite != http.SameSiteLaxMode || sid.Path != "/" {
		t.Errorf("sid attrs = %+v", sid)
	}
	if want := int(sessionTTL / time.Second); sid.MaxAge != want {
		t.Errorf("sid MaxAge = %d, want %d", sid.MaxAge, want)
	}
	if len(sid.Value) != 43 { // 32 bytes base64url, unpadded
		t.Errorf("sid length = %d, want 43", len(sid.Value))
	}

	sess, ok := h.store.sessions[sid.Value]
	if !ok {
		t.Fatal("session not stored")
	}
	if !sess.ExpiresAt.Time.Equal(fixedNow.Add(30 * 24 * time.Hour)) {
		t.Errorf("expires_at = %v", sess.ExpiresAt.Time)
	}
	u := h.store.users[sess.UserID]
	if u.GoogleSub != "g-123" || u.Email != "lan@example.com" || u.Name.String != "Lan" || u.AvatarUrl.String != "https://img.example/a.png" {
		t.Errorf("user = %+v", u)
	}

	// /api/me with the new cookie returns the user.
	me := h.do(withSID(httptest.NewRequest(http.MethodGet, "/api/me", nil), sid.Value))
	if me.Code != http.StatusOK {
		t.Fatalf("/api/me = %d", me.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(me.Body.Bytes(), &body)
	if body["name"] != "Lan" || body["avatarUrl"] != "https://img.example/a.png" || body["isAdmin"] != false {
		t.Errorf("/api/me body = %v", body)
	}

	// A second login with the same Google account updates, not duplicates.
	h.provider.identity.Name = "Lan Nguyen"
	h.do(callbackReq("state=s2&code=c2", "s2", "v2"))
	if len(h.store.users) != 1 || u.Name.String != "Lan Nguyen" {
		t.Errorf("users = %d, name = %q", len(h.store.users), u.Name.String)
	}
}

func TestCallbackExchangeFailure(t *testing.T) {
	h := newHarness(t)
	h.provider.err = errors.New("bad code")
	rec := h.do(callbackReq("state=s&code=c", "s", "v"))
	if rec.Code != http.StatusFound || rec.Header().Get("Location") != "/login?error=oauth" {
		t.Fatalf("got %d → %q", rec.Code, rec.Header().Get("Location"))
	}
	if len(h.store.sessions) != 0 || cookieFrom(rec, sessionCookie) != nil {
		t.Fatal("session created on failed exchange")
	}
}

func TestCallbackUserDenied(t *testing.T) {
	h := newHarness(t)
	rec := h.do(callbackReq("error=access_denied&state=s", "s", "v"))
	if rec.Header().Get("Location") != "/login?error=denied" || h.provider.exchangeHits != 0 {
		t.Fatalf("got %d → %q", rec.Code, rec.Header().Get("Location"))
	}
}

func TestMe(t *testing.T) {
	h := newHarness(t)
	if rec := h.do(httptest.NewRequest(http.MethodGet, "/api/me", nil)); rec.Code != http.StatusUnauthorized {
		t.Fatalf("anon /api/me = %d, want 401", rec.Code)
	}
	if rec := h.do(withSID(httptest.NewRequest(http.MethodGet, "/api/me", nil), "unknown")); rec.Code != http.StatusUnauthorized {
		t.Fatalf("unknown sid /api/me = %d, want 401", rec.Code)
	}
	sid, _ := h.store.addSession(t, true, fixedNow.Add(time.Hour))
	rec := h.do(withSID(httptest.NewRequest(http.MethodGet, "/api/me", nil), sid))
	if rec.Code != http.StatusOK {
		t.Fatalf("/api/me = %d", rec.Code)
	}
	if got := strings.TrimSpace(rec.Body.String()); got != `{"name":"An","avatarUrl":null,"isAdmin":true}` {
		t.Errorf("body = %s", got)
	}
}

func TestSessionExpiry(t *testing.T) {
	h := newHarness(t)
	sid, _ := h.store.addSession(t, false, fixedNow) // expires exactly now
	rec := h.do(withSID(httptest.NewRequest(http.MethodGet, "/api/me", nil), sid))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expired /api/me = %d, want 401", rec.Code)
	}
	if _, ok := h.store.sessions[sid]; ok {
		t.Error("expired session not deleted")
	}
	if c := cookieFrom(rec, sessionCookie); c == nil || c.MaxAge >= 0 {
		t.Error("expired sid cookie not cleared")
	}

	live, _ := h.store.addSession(t, false, fixedNow.Add(time.Second))
	if rec := h.do(withSID(httptest.NewRequest(http.MethodGet, "/api/me", nil), live)); rec.Code != http.StatusOK {
		t.Fatalf("live /api/me = %d, want 200", rec.Code)
	}
}

func TestLogout(t *testing.T) {
	h := newHarness(t)
	sid, _ := h.store.addSession(t, false, fixedNow.Add(time.Hour))

	req := withSID(httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil), sid)
	req.Header.Set("Origin", testOrigin)
	rec := h.do(req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("logout = %d, want 204", rec.Code)
	}
	if _, ok := h.store.sessions[sid]; ok {
		t.Error("session not deleted")
	}
	if c := cookieFrom(rec, sessionCookie); c == nil || c.MaxAge >= 0 || c.Value != "" {
		t.Errorf("sid not cleared: %+v", c)
	}
	if rec := h.do(withSID(httptest.NewRequest(http.MethodGet, "/api/me", nil), sid)); rec.Code != http.StatusUnauthorized {
		t.Fatalf("/api/me after logout = %d, want 401", rec.Code)
	}

	// Idempotent without a session.
	req = httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	req.Header.Set("Origin", testOrigin)
	if rec := h.do(req); rec.Code != http.StatusNoContent {
		t.Fatalf("anon logout = %d, want 204", rec.Code)
	}
}

func TestCSRFOriginCheck(t *testing.T) {
	cases := []struct {
		name    string
		headers map[string]string
		want    int
	}{
		{"same origin", map[string]string{"Origin": testOrigin}, http.StatusAccepted},
		{"same origin, case", map[string]string{"Origin": "HTTPS://App.Example"}, http.StatusAccepted},
		{"referer fallback", map[string]string{"Referer": testOrigin + "/setup/1"}, http.StatusAccepted},
		{"cross origin", map[string]string{"Origin": "https://evil.example"}, http.StatusForbidden},
		{"scheme differs", map[string]string{"Origin": "http://app.example"}, http.StatusForbidden},
		{"null origin", map[string]string{"Origin": "null"}, http.StatusForbidden},
		{"no origin", nil, http.StatusForbidden},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			h := newHarness(t)
			sid, _ := h.store.addSession(t, false, fixedNow.Add(time.Hour))
			req := withSID(httptest.NewRequest(http.MethodPost, "/api/events", nil), sid)
			for k, v := range c.headers {
				req.Header.Set(k, v)
			}
			if rec := h.do(req); rec.Code != c.want {
				t.Fatalf("status = %d, want %d", rec.Code, c.want)
			}
		})
	}

	// Cross-origin logout must not delete the session.
	h := newHarness(t)
	sid, _ := h.store.addSession(t, false, fixedNow.Add(time.Hour))
	req := withSID(httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil), sid)
	req.Header.Set("Origin", "https://evil.example")
	if rec := h.do(req); rec.Code != http.StatusForbidden {
		t.Fatalf("cross-origin logout = %d, want 403", rec.Code)
	}
	if _, ok := h.store.sessions[sid]; !ok {
		t.Fatal("cross-origin logout deleted the session")
	}
}

func TestRequireAdminReadsDBEveryRequest(t *testing.T) {
	h := newHarness(t)
	admin := func(sid string) int {
		return h.do(withSID(httptest.NewRequest(http.MethodGet, "/api/admin/summary", nil), sid)).Code
	}
	if got := admin(""); got != http.StatusUnauthorized {
		t.Fatalf("anon = %d, want 401", got)
	}

	sid, uid := h.store.addSession(t, false, fixedNow.Add(time.Hour))
	if got := admin(sid); got != http.StatusForbidden {
		t.Fatalf("non-admin = %d, want 403", got)
	}
	// `make admin` flips the flag in the DB: same session, no re-login.
	h.store.setAdmin(uid, true)
	if got := admin(sid); got != http.StatusOK {
		t.Fatalf("after promotion = %d, want 200", got)
	}
	h.store.setAdmin(uid, false)
	if got := admin(sid); got != http.StatusForbidden {
		t.Fatalf("after demotion = %d, want 403", got)
	}
}

func TestNewServiceWithoutDeps(t *testing.T) {
	// No DB, no Google config: LoadSession passes through, endpoints fail closed.
	d := &app.Deps{Config: config.Config{AppOrigin: "http://localhost:3000"}}
	s := newService(d)
	if s.store != nil || s.provider != nil {
		t.Fatalf("store=%v provider=%v, want nil", s.store, s.provider)
	}
	if s.secureCookies {
		t.Error("secure cookies on an http origin")
	}
	r := chi.NewRouter()
	r.Route("/api", func(api chi.Router) {
		api.Use(LoadSession(d))
		Register(api, d)
	})
	req := withSID(httptest.NewRequest(http.MethodGet, "/api/me", nil), "x")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("/api/me = %d, want 401", rec.Code)
	}

	d.Config.GoogleClientID, d.Config.GoogleClientSecret = "id", "secret"
	if newService(d).provider == nil {
		t.Fatal("provider not built from config")
	}
}
