package analytics

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/auth"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

var (
	admin  = &auth.User{ID: uuid.New(), Email: "admin@example.com", IsAdmin: true}
	member = &auth.User{ID: uuid.New(), Email: "user@example.com"}
	// A far-future clock keeps the seeded rows apart from any real data in the
	// database: the 7d/30d windows below cannot reach rows from today.
	now = time.Date(2031, 6, 15, 12, 0, 0, 0, location)
)

func newHandler(q Querier) *Handler {
	return &Handler{Store: q, Log: slog.New(slog.NewTextHandler(io.Discard, nil)), Now: func() time.Time { return now }}
}

func router(h *Handler) http.Handler {
	r := chi.NewRouter()
	r.Route("/api", func(api chi.Router) { api.Route("/admin", h.Routes) })
	return r
}

func get(h http.Handler, target string, u *auth.User) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	if u != nil {
		req = req.WithContext(auth.WithUser(req.Context(), u))
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

var routes = []string{"summary", "features", "event-types", "devices", "logs", "export.csv"}

func TestRequireAdmin(t *testing.T) {
	h := router(newHandler(nil)) // nil store: auth must reject before it matters
	for _, p := range routes {
		if rec := get(h, "/api/admin/"+p, nil); rec.Code != http.StatusUnauthorized {
			t.Errorf("%s anonymous = %d, want 401", p, rec.Code)
		}
		if rec := get(h, "/api/admin/"+p, member); rec.Code != http.StatusForbidden {
			t.Errorf("%s non-admin = %d, want 403", p, rec.Code)
		}
		if rec := get(h, "/api/admin/"+p, admin); rec.Code != http.StatusServiceUnavailable {
			t.Errorf("%s admin without db = %d, want 503", p, rec.Code)
		}
	}
}

func TestBadParams(t *testing.T) {
	h := router(newHandler(stubQuerier{}))
	for _, q := range []string{
		"summary?range=year", "summary?device=tablet", "features?tab=x",
		"logs?limit=0", "logs?limit=abc", "logs?cursor=!!!", "logs?cursor=" + "bm9wZQ",
	} {
		if rec := get(h, "/api/admin/"+q, admin); rec.Code != http.StatusBadRequest {
			t.Errorf("%s = %d, want 400", q, rec.Code)
		}
	}
}

type stubQuerier struct{ Querier }

func TestSinceFor(t *testing.T) {
	cases := map[string]string{
		"today": "2031-06-15T00:00:00+07:00",
		"7d":    "2031-06-09T00:00:00+07:00",
		"30d":   "2031-05-17T00:00:00+07:00",
	}
	for rng, want := range cases {
		got, ok := SinceFor(rng, now)
		if !ok || got.Format(time.RFC3339) != want {
			t.Errorf("SinceFor(%s) = %v %v, want %s", rng, got, ok, want)
		}
	}
	if _, ok := SinceFor("all", now); ok {
		t.Error("all must have no lower bound")
	}
	// 23:30 UTC on the 14th is already the 15th in Ho Chi Minh City.
	late := time.Date(2031, 6, 14, 23, 30, 0, 0, time.UTC)
	if got, _ := SinceFor("today", late); got.Format(time.RFC3339) != "2031-06-15T00:00:00+07:00" {
		t.Errorf("today at %v = %v", late, got)
	}
}

func TestCursorRoundTrip(t *testing.T) {
	ts := time.Date(2031, 6, 15, 9, 0, 0, 123456000, time.UTC)
	c := encodeCursor(ts, 42)
	gotTs, gotID, err := decodeCursor(c)
	if err != nil || !gotTs.Time.Equal(ts) || gotID.Int64 != 42 {
		t.Fatalf("decode = %v %v %v", gotTs, gotID, err)
	}
}

func TestCSVSafe(t *testing.T) {
	for in, want := range map[string]string{"": "", "abc": "abc", "=1+1": "'=1+1", "@x": "'@x", "-1": "'-1"} {
		if got := csvSafe(in); got != want {
			t.Errorf("csvSafe(%q) = %q, want %q", in, got, want)
		}
	}
}

// seedRow is one web_access_logs row; its id follows insertion order.
type seedRow struct {
	ts, session, typ, target, device, info string
}

var seed = []seedRow{
	{"2031-06-15T09:00:00+07:00", "s1", "page_view", "", "mobile", "Android / Chrome"},
	{"2031-06-15T10:00:00+07:00", "s1", "switch_tab", "Tab_2_FAQ", "mobile", "Android / Chrome"},
	{"2031-06-15T10:00:00+07:00", "s1", "click_faq_3d", "FAQ_1_Smell", "mobile", "Android / Chrome"}, // same ts: id breaks the tie
	{"2031-06-14T23:59:59+07:00", "s2", "view_3d_step", "3D_Setup_Layer1", "desktop", "Windows / Chrome"},
	{"2031-06-09T00:00:00+07:00", "s3", "click_faq_3d", "FAQ_1_Smell", "mobile", "iOS / Safari"}, // first instant of 7d
	{"2031-06-08T23:59:59+07:00", "s3", "view_3d_step", "3D_Setup_Layer1", "mobile", "iOS / Safari"},
	{"2031-05-17T00:00:00+07:00", "s4", "page_view", "", "desktop", "macOS / Safari"}, // first instant of 30d
	{"2031-05-16T23:59:59+07:00", "s4", "page_view", "", "desktop", "macOS / Safari"},
}

const secretHash = "SECRET-USER-HASH-VALUE"

func decode(t *testing.T, rec *httptest.ResponseRecorder, v any) {
	t.Helper()
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", rec.Code, rec.Body)
	}
	if strings.Contains(rec.Body.String(), secretHash) || strings.Contains(strings.ToLower(rec.Body.String()), "userhash") {
		t.Fatalf("response leaks user_hash: %s", rec.Body)
	}
	if err := json.Unmarshal(rec.Body.Bytes(), v); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
}

// TestAnalyticsPostgres runs every endpoint against seeded rows in a rolled
// back transaction. It needs a migrated database:
//
//	docker compose -f infra/docker-compose.yml up -d db && make migrate
//	DATABASE_URL=postgres://... go test ./internal/analytics/
//
// It is skipped when DATABASE_URL is unset.
func TestAnalyticsPostgres(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; skipping Postgres integration test")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	h := router(newHandler(store.New(tx)))
	api := func(path string) *httptest.ResponseRecorder { return get(h, "/api/admin/"+path, admin) }

	// Baseline for "all", which also sees whatever real rows the database holds.
	var base struct{ TotalEvents int64 }
	decode(t, api("summary?range=all"), &base)

	for _, s := range seed {
		_, err := tx.Exec(ctx, `
			INSERT INTO web_access_logs (ts, session_id, user_hash, event_type, feature_target, device_type, device_info)
			VALUES ($1, $2, $3, $4::event_type, NULLIF($5, ''), $6, $7)`,
			s.ts, s.session, secretHash, s.typ, s.target, s.device, s.info)
		if err != nil {
			t.Fatal(err)
		}
	}

	t.Run("summary", func(t *testing.T) {
		type sum struct {
			TotalEvents, UniqueSessions, PageViews int64
			MobileShare                            int
		}
		for q, want := range map[string]sum{
			"range=today":                {3, 1, 1, 100},
			"range=7d":                   {5, 3, 1, 80},
			"":                           {5, 3, 1, 80}, // default is 7d
			"range=30d":                  {7, 4, 2, 71},
			"range=7d&device=desktop":    {1, 1, 0, 0},
			"range=7d&device=mobile":     {4, 2, 1, 100},
			"range=7d&device=all":        {5, 3, 1, 80},
			"range=30d&device=desktop":   {2, 2, 1, 0},
			"range=today&device=desktop": {0, 0, 0, 0},
		} {
			var got sum
			decode(t, api("summary?"+q), &got)
			if got != want {
				t.Errorf("summary?%s = %+v, want %+v", q, got, want)
			}
		}
		var all struct{ TotalEvents int64 }
		decode(t, api("summary?range=all"), &all)
		if all.TotalEvents != base.TotalEvents+int64(len(seed)) {
			t.Errorf("all = %d, want %d", all.TotalEvents, base.TotalEvents+int64(len(seed)))
		}
	})

	t.Run("features", func(t *testing.T) {
		type f struct {
			Target string
			Count  int64
		}
		for q, want := range map[string][]f{
			"range=7d":                         {{"FAQ_1_Smell", 2}, {"3D_Setup_Layer1", 1}, {"Tab_2_FAQ", 1}},
			"range=7d&tab=faq":                 {{"FAQ_1_Smell", 2}, {"Tab_2_FAQ", 1}},
			"range=7d&tab=setup":               {{"3D_Setup_Layer1", 1}},
			"range=7d&tab=all&device=mobile":   {{"FAQ_1_Smell", 2}, {"Tab_2_FAQ", 1}},
			"range=7d&tab=setup&device=mobile": {},
			"range=30d&tab=setup":              {{"3D_Setup_Layer1", 2}},
			"range=today":                      {{"FAQ_1_Smell", 1}, {"Tab_2_FAQ", 1}},
		} {
			var got []f
			decode(t, api("features?"+q), &got)
			if len(got) == 0 && len(want) == 0 {
				continue
			}
			if !reflect.DeepEqual(got, want) {
				t.Errorf("features?%s = %v, want %v", q, got, want)
			}
		}
	})

	t.Run("event-types and devices", func(t *testing.T) {
		type tc struct {
			Type  string
			Count int64
		}
		var types []tc
		decode(t, api("event-types?range=7d"), &types)
		if want := []tc{{"click_faq_3d", 2}, {"page_view", 1}, {"switch_tab", 1}, {"view_3d_step", 1}}; !reflect.DeepEqual(types, want) {
			t.Errorf("event-types = %v, want %v", types, want)
		}
		type dc struct {
			DeviceType string
			Count      int64
		}
		var devs []dc
		decode(t, api("devices?range=7d"), &devs)
		if want := []dc{{"mobile", 4}, {"desktop", 1}}; !reflect.DeepEqual(devs, want) {
			t.Errorf("devices = %v, want %v", devs, want)
		}
		devs = nil
		decode(t, api("devices?range=7d&device=desktop"), &devs)
		if want := []dc{{"desktop", 1}}; !reflect.DeepEqual(devs, want) {
			t.Errorf("devices desktop = %v, want %v", devs, want)
		}
	})

	type page struct {
		Items []struct {
			ID            int64
			Ts            string
			SessionID     string
			EventType     string
			FeatureTarget *string
			DeviceInfo    *string
		}
		NextCursor *string
	}
	sessions := func(p page) string {
		var out []string
		for _, it := range p.Items {
			out = append(out, it.SessionID+"/"+it.EventType)
		}
		return strings.Join(out, " ")
	}

	t.Run("logs keyset pagination", func(t *testing.T) {
		var seen []int64
		var texts []string
		cursor := ""
		for i := 0; i < 5; i++ {
			var p page
			decode(t, api("logs?range=30d&limit=3&cursor="+cursor), &p)
			for _, it := range p.Items {
				seen = append(seen, it.ID)
			}
			texts = append(texts, sessions(p))
			if p.NextCursor == nil {
				break
			}
			cursor = *p.NextCursor
		}
		if len(seen) != 7 {
			t.Fatalf("paged %d rows, want 7 (%v)", len(seen), texts)
		}
		for i := 1; i < len(seen); i++ {
			if seen[i-1] == seen[i] {
				t.Errorf("row %d repeated across pages", seen[i])
			}
		}
		// Newest first; the two rows sharing a ts come out highest id first.
		if want := "s1/click_faq_3d s1/switch_tab s1/page_view"; texts[0] != want {
			t.Errorf("page 1 = %q, want %q", texts[0], want)
		}
		if want := "s2/view_3d_step s3/click_faq_3d s3/view_3d_step"; texts[1] != want {
			t.Errorf("page 2 = %q, want %q", texts[1], want)
		}
		if want := "s4/page_view"; len(texts) != 3 || texts[2] != want {
			t.Errorf("page 3 = %v, want %q", texts, want)
		}

		// An exactly-full last page has no next cursor.
		var p page
		decode(t, api("logs?range=30d&limit=7"), &p)
		if len(p.Items) != 7 || p.NextCursor != nil {
			t.Errorf("limit=7: %d items, cursor %v", len(p.Items), p.NextCursor)
		}
		// Rows inserted after page 1 was read do not shift later pages: the
		// cursor is a position, not an offset.
	})

	t.Run("logs filters", func(t *testing.T) {
		for q, want := range map[string]string{
			"range=today":                        "s1/click_faq_3d s1/switch_tab s1/page_view",
			"range=7d&device=desktop":            "s2/view_3d_step",
			"range=30d&target=FAQ_":              "s1/click_faq_3d s3/click_faq_3d",
			"range=30d&target=FAQ_1":             "s1/click_faq_3d s3/click_faq_3d",
			"range=7d&target=3D_":                "s2/view_3d_step",
			"range=30d&target=3D_&device=mobile": "s3/view_3d_step",
			"range=30d&target=Tab_":              "s1/switch_tab",
			"range=30d&target=_":                 "", // "_" is a literal, not a wildcard
			"range=30d&target=%25":               "", // so is "%"
			"range=30d&target=Nope":              "",
		} {
			var p page
			decode(t, api("logs?"+q), &p)
			if got := sessions(p); got != want {
				t.Errorf("logs?%s = %q, want %q", q, got, want)
			}
		}
		var p page
		decode(t, api("logs?range=today"), &p)
		if p.Items[2].FeatureTarget != nil || p.Items[2].EventType != "page_view" {
			t.Errorf("page_view row = %+v, want null featureTarget", p.Items[2])
		}
		if !strings.HasSuffix(p.Items[2].Ts, "+07:00") {
			t.Errorf("ts %q is not in +07:00", p.Items[2].Ts)
		}
	})

	t.Run("export.csv", func(t *testing.T) {
		rec := api("export.csv?range=7d&device=mobile")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d", rec.Code)
		}
		if ct := rec.Header().Get("Content-Type"); ct != "text/csv; charset=utf-8" {
			t.Errorf("content-type = %q", ct)
		}
		if cd := rec.Header().Get("Content-Disposition"); !strings.Contains(cd, "attachment") || !strings.Contains(cd, "7d.csv") {
			t.Errorf("content-disposition = %q", cd)
		}
		body := rec.Body.String()
		if !strings.HasPrefix(body, "\xEF\xBB\xBF") {
			t.Fatalf("missing UTF-8 BOM: %q", body[:min(20, len(body))])
		}
		if strings.Contains(body, secretHash) {
			t.Fatal("csv leaks user_hash")
		}
		recs, err := csv.NewReader(strings.NewReader(strings.TrimPrefix(body, "\xEF\xBB\xBF"))).ReadAll()
		if err != nil {
			t.Fatal(err)
		}
		if want := []string{"Timestamp", "Session_ID", "Event_Type", "Feature_Target", "Device_Info"}; !reflect.DeepEqual(recs[0], want) {
			t.Errorf("header = %v", recs[0])
		}
		if len(recs) != 5 { // header + 4 mobile rows in 7d
			t.Fatalf("rows = %d, want 5: %v", len(recs), recs)
		}
		if want := []string{"2031-06-15 10:00:00", "s1", "click_faq_3d", "FAQ_1_Smell", "Android / Chrome"}; !reflect.DeepEqual(recs[1], want) {
			t.Errorf("first row = %v, want %v", recs[1], want)
		}
		if recs[3][3] != "" { // the page_view row has an empty Feature_Target
			t.Errorf("page_view target = %q", recs[3][3])
		}
		if strings.Contains(body, "desktop") || strings.Contains(body, "Windows") {
			t.Error("device filter ignored")
		}
		if rec := api("export.csv?range=30d&target=FAQ_"); strings.Count(rec.Body.String(), "\n") != 3 {
			t.Errorf("target export = %q", rec.Body)
		}
	})
}
