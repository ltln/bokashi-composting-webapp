package events

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/auth"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

const testSession = "8f14e45f-ceea-467a-9575-4b5e2c1b1d2a"

func ptr(s string) *string { return &s }

// allowed is the contract table, written out by hand so the test fails if the
// generated code drifts from docs/PLAN.md §1.
var allowed = map[string][]string{
	"page_view":    {""},
	"switch_tab":   {"Tab_1_Setup", "Tab_2_FAQ"},
	"view_3d_step": {"3D_Setup_Layer1", "3D_Setup_Layer2", "3D_Setup_Layer3"},
	"click_faq_3d": {"FAQ_1_Smell", "FAQ_2_Maggots", "FAQ_3_Liquid", "FAQ_4_Mold", "FAQ_5_Disposal"},
}

// TestValidateMatrix checks every (type, target) pair from the 4 types x (10
// targets + none), plus unknown values: exactly the contract pairs pass.
func TestValidateMatrix(t *testing.T) {
	types := []string{"page_view", "switch_tab", "view_3d_step", "click_faq_3d", "unknown", ""}
	targets := []string{"", "Tab_1_Setup", "Tab_2_FAQ", "3D_Setup_Layer1", "3D_Setup_Layer2",
		"3D_Setup_Layer3", "FAQ_1_Smell", "FAQ_2_Maggots", "FAQ_3_Liquid", "FAQ_4_Mold",
		"FAQ_5_Disposal", "FAQ_6_Nope", "tab_1_setup"}
	valid := 0
	for _, typ := range types {
		for _, target := range targets {
			want := false
			for _, a := range allowed[typ] {
				if a == target {
					want = true
				}
			}
			e := EventIn{EventType: typ, SessionID: testSession}
			if target != "" {
				e.FeatureTarget = ptr(target)
			}
			_, err := Validate([]EventIn{e})
			if got := err == nil; got != want {
				t.Errorf("Validate(%q, %q): ok=%v, want %v (err=%v)", typ, target, got, want, err)
			}
			if want {
				valid++
			}
		}
	}
	if valid != 11 {
		t.Fatalf("valid pairs = %d, want 11 (1 page_view + 10 targets)", valid)
	}
}

func TestValidateFields(t *testing.T) {
	ok := EventIn{EventType: "switch_tab", FeatureTarget: ptr("Tab_1_Setup"), SessionID: testSession,
		ClientTs: ptr("2026-11-16T08:30:00.123Z")}
	many := func(n int) []EventIn {
		out := make([]EventIn, n)
		for i := range out {
			out[i] = ok
		}
		return out
	}
	cases := []struct {
		name    string
		events  []EventIn
		wantErr bool
	}{
		{"single", []EventIn{ok}, false},
		{"max batch", many(MaxBatch), false},
		{"empty batch", nil, true},
		{"over max batch", many(MaxBatch + 1), true},
		{"page_view with explicit null target", []EventIn{{EventType: "page_view", SessionID: testSession}}, false},
		{"page_view with empty target", []EventIn{{EventType: "page_view", FeatureTarget: ptr(""), SessionID: testSession}}, false},
		{"missing clientTs", []EventIn{{EventType: "page_view", SessionID: testSession}}, false},
		{"bad clientTs", []EventIn{{EventType: "page_view", SessionID: testSession, ClientTs: ptr("yesterday")}}, true},
		{"missing sessionId", []EventIn{{EventType: "page_view"}}, true},
		{"non-uuid sessionId", []EventIn{{EventType: "page_view", SessionID: "abc"}}, true},
		{"urn sessionId", []EventIn{{EventType: "page_view", SessionID: "urn:uuid:" + testSession}}, true},
		{"one bad item rejects batch", []EventIn{ok, {EventType: "switch_tab", FeatureTarget: ptr("FAQ_1_Smell"), SessionID: testSession}}, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			p, err := Validate(c.events)
			if (err != nil) != c.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, c.wantErr)
			}
			if err == nil && len(p.EventTypes) != len(c.events) {
				t.Fatalf("got %d rows, want %d", len(p.EventTypes), len(c.events))
			}
		})
	}
}

func TestValidateColumns(t *testing.T) {
	p, err := Validate([]EventIn{
		{EventType: "page_view", SessionID: strings.ToUpper(testSession), ClientTs: ptr("2026-11-16T08:30:00+07:00")},
		{EventType: "click_faq_3d", FeatureTarget: ptr("FAQ_3_Liquid"), SessionID: testSession},
	})
	if err != nil {
		t.Fatal(err)
	}
	if p.SessionIds[0] != testSession {
		t.Errorf("session id not normalised: %q", p.SessionIds[0])
	}
	if !p.ClientTs[0].Valid || p.ClientTs[0].Time.UTC().Hour() != 1 {
		t.Errorf("clientTs[0] = %+v", p.ClientTs[0])
	}
	if p.ClientTs[1].Valid {
		t.Errorf("clientTs[1] should be NULL")
	}
	if p.FeatureTargets[0] != "" || p.FeatureTargets[1] != "FAQ_3_Liquid" {
		t.Errorf("targets = %q", p.FeatureTargets)
	}
}

type fakeStore struct {
	calls []store.InsertEventsParams
	err   error
}

func (f *fakeStore) InsertEvents(_ context.Context, p store.InsertEventsParams) (int64, error) {
	f.calls = append(f.calls, p)
	if f.err != nil {
		return 0, f.err
	}
	return int64(len(p.EventTypes)), nil
}

var testUser = &auth.User{ID: uuid.MustParse("3b241101-e2bb-4255-8caf-4136c566a962"), Email: "a@b.c"}

func post(h http.Handler, body string, user *auth.User, hdr map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/events", strings.NewReader(body))
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	if user != nil {
		req = req.WithContext(auth.WithUser(req.Context(), user))
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func batchJSON(t *testing.T, events ...EventIn) string {
	t.Helper()
	b, err := json.Marshal(Batch{Events: events})
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func newRouter(h *Handler) http.Handler {
	r := chi.NewRouter()
	r.Route("/api", func(api chi.Router) {
		api.With(auth.RequireUser, RateLimit()).Post("/events", h.ServeHTTP)
	})
	return r
}

func TestHandlerAccepts(t *testing.T) {
	fs := &fakeStore{}
	h := &Handler{Store: fs, Secret: []byte("s3cret"), Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	body := batchJSON(t,
		EventIn{EventType: "page_view", SessionID: testSession, ClientTs: ptr("2026-11-16T08:30:00Z")},
		EventIn{EventType: "view_3d_step", FeatureTarget: ptr("3D_Setup_Layer2"), SessionID: testSession},
	)
	rec := post(newRouter(h), body, testUser, map[string]string{
		"User-Agent":       "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
		"X-Forwarded-For":  "203.0.113.9",
		"Sec-CH-UA-Mobile": "",
	})
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, body %s", rec.Code, rec.Body)
	}
	if !strings.Contains(rec.Body.String(), `"accepted":2`) {
		t.Errorf("body = %s", rec.Body)
	}
	if len(fs.calls) != 1 {
		t.Fatalf("InsertEvents called %d times, want 1 (one statement per batch)", len(fs.calls))
	}
	p := fs.calls[0]
	if p.DeviceType != "mobile" || p.DeviceInfo.String != "iOS / Safari" {
		t.Errorf("device = %q / %q", p.DeviceType, p.DeviceInfo.String)
	}
	if want := UserHash([]byte("s3cret"), testUser.ID); !p.UserHash.Valid || p.UserHash.String != want {
		t.Errorf("user_hash = %+v, want %s", p.UserHash, want)
	}
	// No PII: nothing about the email or IP reaches the store.
	dump, _ := json.Marshal(p)
	for _, leak := range []string{testUser.Email, testUser.ID.String(), "203.0.113.9"} {
		if bytes.Contains(dump, []byte(leak)) {
			t.Errorf("insert params contain %q", leak)
		}
	}
}

func TestHandlerRejects(t *testing.T) {
	cases := []struct {
		name   string
		body   string
		user   *auth.User
		status int
	}{
		{"anonymous", `{"events":[{"eventType":"page_view","sessionId":"` + testSession + `"}]}`, nil, http.StatusUnauthorized},
		{"bad json", `{"events":`, testUser, http.StatusBadRequest},
		{"bare array", `[{"eventType":"page_view","sessionId":"` + testSession + `"}]`, testUser, http.StatusBadRequest},
		{"empty", `{"events":[]}`, testUser, http.StatusBadRequest},
		{"invalid combo", `{"events":[{"eventType":"page_view","sessionId":"` + testSession + `"},{"eventType":"click_faq_3d","featureTarget":"Tab_2_FAQ","sessionId":"` + testSession + `"}]}`, testUser, http.StatusBadRequest},
		{"bad session", `{"events":[{"eventType":"page_view","sessionId":"x"}]}`, testUser, http.StatusBadRequest},
		{"too large", `{"events":[` + strings.Repeat(" ", maxBodyBytes) + `]}`, testUser, http.StatusRequestEntityTooLarge},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			fs := &fakeStore{}
			h := &Handler{Store: fs, Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
			rec := post(newRouter(h), c.body, c.user, nil)
			if rec.Code != c.status {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, c.status, rec.Body)
			}
			if len(fs.calls) != 0 {
				t.Fatalf("rejected batch reached the store")
			}
		})
	}
}

func TestHandlerNoDBAndStoreError(t *testing.T) {
	body := batchJSON(t, EventIn{EventType: "page_view", SessionID: testSession})
	quiet := slog.New(slog.NewTextHandler(io.Discard, nil))

	rec := post(newRouter(&Handler{Log: quiet}), body, testUser, nil)
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("no DB: status = %d, want 503", rec.Code)
	}
	rec = post(newRouter(&Handler{Store: &fakeStore{err: errors.New("boom")}, Log: quiet}), body, testUser, nil)
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("store error: status = %d, want 500", rec.Code)
	}
}

func TestHandlerNoSecretStoresNullHash(t *testing.T) {
	fs := &fakeStore{}
	h := &Handler{Store: fs, Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	rec := post(newRouter(h), batchJSON(t, EventIn{EventType: "page_view", SessionID: testSession}), testUser, nil)
	if rec.Code != http.StatusAccepted || fs.calls[0].UserHash.Valid {
		t.Fatalf("status %d, user_hash %+v", rec.Code, fs.calls[0].UserHash)
	}
}

func TestRateLimitPerSession(t *testing.T) {
	fs := &fakeStore{}
	r := newRouter(&Handler{Store: fs, Log: slog.New(slog.NewTextHandler(io.Discard, nil))})
	body := batchJSON(t, EventIn{EventType: "page_view", SessionID: testSession})
	send := func(sid string) int {
		req := httptest.NewRequest(http.MethodPost, "/api/events", strings.NewReader(body))
		req.AddCookie(&http.Cookie{Name: "sid", Value: sid})
		req = req.WithContext(auth.WithUser(req.Context(), testUser))
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		return rec.Code
	}
	for i := 0; i < rateLimitRequests; i++ {
		if code := send("a"); code != http.StatusAccepted {
			t.Fatalf("request %d: status %d", i, code)
		}
	}
	if code := send("a"); code != http.StatusTooManyRequests {
		t.Fatalf("request over limit: status %d, want 429", code)
	}
	if code := send("b"); code != http.StatusAccepted {
		t.Fatalf("other session: status %d, want 202", code)
	}
}

func TestRegisterMountsEvents(t *testing.T) {
	// With no user (M0 LoadSession), the route exists and fails closed.
	r := chi.NewRouter()
	r.Route("/api", func(api chi.Router) { Register(api, testDeps()) })
	rec := post(r, `{"events":[]}`, nil, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}
