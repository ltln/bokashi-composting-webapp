package analytics

import (
	"context"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

func TestBuildSeries(t *testing.T) {
	from := time.Date(2031, 6, 15, 0, 0, 0, 0, location)
	now := from.Add(2*time.Hour + 30*time.Minute)
	local := func(h int) pgtype.Timestamp { // Postgres hands local buckets back as UTC wall clock
		return pgtype.Timestamp{Time: time.Date(2031, 6, 15, h, 0, 0, 0, time.UTC), Valid: true}
	}
	prevLocal := func(h int) pgtype.Timestamp {
		return pgtype.Timestamp{Time: time.Date(2031, 6, 14, h, 0, 0, 0, time.UTC), Valid: true}
	}
	cur := []store.OverviewSeriesRow{{Bucket: local(1), Visits: 2, Users: 2, ScreenViews: 5}}
	prev := []store.OverviewSeriesRow{{Bucket: prevLocal(1), Visits: 1, Users: 1, ScreenViews: 3}}
	got := buildSeries(from, from.AddDate(0, 0, 1), time.Hour, now, -24*time.Hour, cur, prev)
	if len(got) != 24 {
		t.Fatalf("len = %d, want 24", len(got))
	}
	if got[1].Start != "2031-06-15T01:00" || *got[1].Visits != 2 || *got[1].Views != 5 || got[1].PrevVisits != 1 || got[1].PrevViews != 3 {
		t.Errorf("bucket 1 = %+v", got[1])
	}
	if got[0].Visits == nil || *got[0].Visits != 0 {
		t.Errorf("past empty bucket should be 0, got %v", got[0].Visits)
	}
	if got[2].Visits == nil || got[3].Visits != nil {
		t.Errorf("bucket 2 (current) must be set and bucket 3 (future) null: %v %v", got[2].Visits, got[3].Visits)
	}
}

// overviewSeed: visitor, local time, event, target, device.
var overviewSeed = []struct{ user, at, typ, target, device string }{
	// uA, mobile, today: one visit 09:00-09:21, a second at 10:30 (69 min gap).
	{"uA", "2031-06-15T09:00:00", "page_view", "", "mobile"},
	{"uA", "2031-06-15T09:01:00", "view_3d_step", "3D_Setup_Layer1", "mobile"},
	{"uA", "2031-06-15T09:05:00", "view_3d_step", "3D_Setup_Layer2", "mobile"},
	{"uA", "2031-06-15T09:10:00", "view_3d_step", "3D_Setup_Layer3", "mobile"},
	{"uA", "2031-06-15T09:20:00", "switch_tab", "Tab_2_FAQ", "mobile"},
	{"uA", "2031-06-15T09:21:00", "click_faq_3d", "FAQ_1_Smell", "mobile"},
	{"uA", "2031-06-15T10:30:00", "view_3d_step", "3D_Setup_Layer1", "mobile"},
	// uB, desktop, today.
	{"uB", "2031-06-15T11:00:00", "page_view", "", "desktop"},
	{"uB", "2031-06-15T11:01:00", "view_3d_step", "3D_Setup_Layer1", "desktop"},
	// uC, mobile, returning: first seen 06-01, back yesterday evening.
	{"uC", "2031-06-01T10:00:00", "page_view", "", "mobile"},
	{"uC", "2031-06-14T20:00:00", "page_view", "", "mobile"},
	{"uC", "2031-06-14T20:01:00", "view_3d_step", "3D_Setup_Layer1", "mobile"},
	// uD, mobile, active 2 minutes ago: online.
	{"uD", "2031-06-15T11:58:00", "page_view", "", "mobile"},
	// uE, mobile, yesterday morning: the only visit in the previous "today".
	{"uE", "2031-06-14T08:00:00", "page_view", "", "mobile"},
}

func TestOverviewPostgres(t *testing.T) {
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
	for _, s := range overviewSeed {
		at, err := time.ParseInLocation("2006-01-02T15:04:05", s.at, location)
		if err != nil {
			t.Fatal(err)
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO web_access_logs (ts, session_id, user_hash, event_type, feature_target, device_type)
			VALUES ($1, 'sid-' || $2, 'hash-' || $2, $3::event_type, NULLIF($4, ''), $5)`,
			at, s.user, s.typ, s.target, s.device)
		if err != nil {
			t.Fatal(err)
		}
	}
	h := router(newHandler(store.New(tx)))

	type out struct {
		Range, Unit, From, To string
		Online                int64
		Totals, Previous      overviewTotals
		Series                []overviewPoint
		Pages                 []overviewPage
		Devices               overviewDevices
		Hours                 [24]int64
		Funnel                overviewFunnel
	}
	load := func(q string) out {
		var o out
		rec := get(h, "/api/admin/overview?"+q, admin)
		decode(t, rec, &o)
		return o
	}

	t.Run("today", func(t *testing.T) {
		o := load("range=today")
		if o.Unit != "hour" || o.From != "2031-06-15" || o.To != "2031-06-15" {
			t.Errorf("period = %s %s %s", o.Unit, o.From, o.To)
		}
		if want := (overviewTotals{Visits: 4, Users: 3, NewUsers: 3, Views: 7}); o.Totals != want {
			t.Errorf("totals = %+v, want %+v", o.Totals, want)
		}
		if want := (overviewTotals{Visits: 1, Users: 1, NewUsers: 1, Views: 0}); o.Previous != want {
			t.Errorf("previous = %+v, want %+v", o.Previous, want)
		}
		if o.Online != 1 {
			t.Errorf("online = %d, want 1", o.Online)
		}
		if want := (overviewDevices{Mobile: 3, Desktop: 1}); o.Devices != want {
			t.Errorf("devices = %+v, want %+v", o.Devices, want)
		}
		if o.Hours[9] != 1 || o.Hours[10] != 1 || o.Hours[11] != 2 || o.Hours[8] != 0 {
			t.Errorf("hours = %v", o.Hours)
		}
		if want := (overviewFunnel{Users: 3, Step1: 2, AllSteps: 1, FaqTab: 1, FaqDetail: 1}); o.Funnel != want {
			t.Errorf("funnel = %+v, want %+v", o.Funnel, want)
		}
		wantPages := []overviewPage{
			{"3D_Setup_Layer1", 3, 2}, {"3D_Setup_Layer2", 1, 1}, {"3D_Setup_Layer3", 1, 1},
			{"FAQ_1_Smell", 1, 1}, {"Tab_2_FAQ", 1, 1},
		}
		if !reflect.DeepEqual(o.Pages, wantPages) {
			t.Errorf("pages = %+v, want %+v", o.Pages, wantPages)
		}
		if len(o.Series) != 24 {
			t.Fatalf("series len = %d", len(o.Series))
		}
		nine, eight := o.Series[9], o.Series[8]
		if nine.Start != "2031-06-15T09:00" || *nine.Visits != 1 || *nine.Users != 1 || *nine.Views != 5 {
			t.Errorf("09:00 = %+v", nine)
		}
		if eight.PrevVisits != 1 || *eight.Visits != 0 {
			t.Errorf("08:00 = %+v", eight)
		}
		if o.Series[12].Visits == nil || o.Series[13].Visits != nil {
			t.Errorf("12:00 should be current and 13:00 future")
		}
	})

	t.Run("7d", func(t *testing.T) {
		o := load("range=7d")
		if o.Unit != "day" || o.From != "2031-06-09" || len(o.Series) != 7 {
			t.Errorf("period = %s %s len %d", o.Unit, o.From, len(o.Series))
		}
		if want := (overviewTotals{Visits: 6, Users: 5, NewUsers: 4, Views: 8}); o.Totals != want { // + uC (returning) and uE
			t.Errorf("totals = %+v, want %+v", o.Totals, want)
		}
		if want := (overviewDevices{Mobile: 5, Desktop: 1}); o.Devices != want {
			t.Errorf("devices = %+v, want %+v", o.Devices, want)
		}
		if last := o.Series[6]; last.Start != "2031-06-15T00:00" || *last.Visits != 4 {
			t.Errorf("last day = %+v", last)
		}
	})

	t.Run("device filter", func(t *testing.T) {
		o := load("range=today&device=mobile")
		if want := (overviewTotals{Visits: 3, Users: 2, NewUsers: 2, Views: 6}); o.Totals != want {
			t.Errorf("mobile totals = %+v, want %+v", o.Totals, want)
		}
		if o.Online != 1 {
			t.Errorf("mobile online = %d", o.Online)
		}
		d := load("range=today&device=desktop")
		if d.Online != 0 || d.Totals.Visits != 1 || d.Devices.Mobile != 0 {
			t.Errorf("desktop = online %d totals %+v devices %+v", d.Online, d.Totals, d.Devices)
		}
	})
}
