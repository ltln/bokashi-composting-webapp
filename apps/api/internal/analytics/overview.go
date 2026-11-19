package analytics

import (
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

// OnlineWindow is how recent a visitor's last event must be to count as online.
const OnlineWindow = 5 * time.Minute

// overviewDays is the length of each range the overview supports. "all" has no
// previous period to compare against, so it is not offered here.
var overviewDays = map[string]int{"today": 1, "7d": 7, "30d": 30}

type overviewTotals struct {
	Visits   int64 `json:"visits"`
	Users    int64 `json:"users"`
	NewUsers int64 `json:"newUsers"`
	Views    int64 `json:"views"`
}

type overviewPoint struct {
	Start string `json:"start"` // local bucket start, "2006-01-02T15:04"
	// Current period; null for buckets that lie in the future.
	Visits *int64 `json:"visits"`
	Users  *int64 `json:"users"`
	Views  *int64 `json:"views"`
	// The same bucket one period earlier.
	PrevVisits int64 `json:"prevVisits"`
	PrevUsers  int64 `json:"prevUsers"`
	PrevViews  int64 `json:"prevViews"`
}

type overviewPage struct {
	Target  string `json:"target"`
	Views   int64  `json:"views"`
	Viewers int64  `json:"viewers"`
}

type overviewDevices struct {
	Mobile  int64 `json:"mobile"`
	Desktop int64 `json:"desktop"`
	Tablet  int64 `json:"tablet"`
}

type overviewFunnel struct {
	Users     int64 `json:"users"`
	Step1     int64 `json:"step1"`
	AllSteps  int64 `json:"allSteps"`
	FaqTab    int64 `json:"faqTab"`
	FaqDetail int64 `json:"faqDetail"`
}

type overviewOut struct {
	Range    string          `json:"range"`
	Unit     string          `json:"unit"` // "hour" (today) or "day"
	From     string          `json:"from"` // first local day of the period, YYYY-MM-DD
	To       string          `json:"to"`   // last local day (today), YYYY-MM-DD
	Online   int64           `json:"online"`
	Totals   overviewTotals  `json:"totals"`
	Previous overviewTotals  `json:"previous"` // same elapsed time, one period earlier
	Series   []overviewPoint `json:"series"`
	Pages    []overviewPage  `json:"pages"`
	Devices  overviewDevices `json:"devices"` // visits per device type
	Hours    [24]int64       `json:"hours"`   // visits started per local hour of day
	Funnel   overviewFunnel  `json:"funnel"`
}

func ts(t time.Time) pgtype.Timestamptz { return pgtype.Timestamptz{Time: t, Valid: true} }

// overview serves the whole "Tổng quan truy cập" board in one response.
func (h *Handler) overview(w http.ResponseWriter, r *http.Request) {
	if h.Store == nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	f, err := h.parseFilters(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	days, ok := overviewDays[f.Range]
	if !ok {
		writeError(w, http.StatusBadRequest, "range must be today, 7d or 30d")
		return
	}

	now := h.now().In(location)
	from := f.Since.Time.In(location)
	end := from.AddDate(0, 0, days)       // end of today
	prevFrom := from.AddDate(0, 0, -days) // the previous period starts here…
	elapsed := now.Sub(from)              // …and its totals cover the same elapsed time
	unit, step := "day", 24*time.Hour
	if f.Range == "today" {
		unit, step = "hour", time.Hour
	}

	var (
		totals, prevTotals store.OverviewTotalsRow
		cur, prev          []store.OverviewSeriesRow
		pages              []store.OverviewPagesRow
		hours              []store.OverviewHoursRow
		funnel             store.OverviewFunnelRow
		online             int64
	)
	// Sequential on purpose: the queries are small, and a single pgx.Tx (as in
	// the integration test) cannot run two queries at once.
	ctx := r.Context()
	dev := f.Device
	err = firstErr(
		func() (err error) {
			totals, err = h.Store.OverviewTotals(ctx, store.OverviewTotalsParams{FromTs: ts(from), ToTs: ts(now), Device: dev})
			return wrap("totals", err)
		},
		func() (err error) {
			prevTotals, err = h.Store.OverviewTotals(ctx, store.OverviewTotalsParams{FromTs: ts(prevFrom), ToTs: ts(prevFrom.Add(elapsed)), Device: dev})
			return wrap("previous totals", err)
		},
		func() (err error) {
			cur, err = h.Store.OverviewSeries(ctx, store.OverviewSeriesParams{BucketUnit: unit, FromTs: ts(from), ToTs: ts(now), Device: dev})
			return wrap("series", err)
		},
		func() (err error) {
			prev, err = h.Store.OverviewSeries(ctx, store.OverviewSeriesParams{BucketUnit: unit, FromTs: ts(prevFrom), ToTs: ts(from), Device: dev})
			return wrap("previous series", err)
		},
		func() (err error) {
			pages, err = h.Store.OverviewPages(ctx, store.OverviewPagesParams{FromTs: ts(from), ToTs: ts(now), Device: dev})
			return wrap("pages", err)
		},
		func() (err error) {
			hours, err = h.Store.OverviewHours(ctx, store.OverviewHoursParams{FromTs: ts(from), ToTs: ts(now), Device: dev})
			return wrap("hours", err)
		},
		func() (err error) {
			funnel, err = h.Store.OverviewFunnel(ctx, store.OverviewFunnelParams{FromTs: ts(from), ToTs: ts(now), Device: dev})
			return wrap("funnel", err)
		},
		func() (err error) {
			online, err = h.Store.OverviewOnline(ctx, store.OverviewOnlineParams{SinceTs: ts(now.Add(-OnlineWindow)), Device: dev})
			return wrap("online", err)
		},
	)
	if err != nil {
		h.fail(w, r, "overview", err)
		return
	}

	out := overviewOut{
		Range:    f.Range,
		Unit:     unit,
		From:     from.Format(time.DateOnly),
		To:       end.AddDate(0, 0, -1).Format(time.DateOnly),
		Online:   online,
		Totals:   overviewTotals{totals.Visits, totals.Users, totals.NewUsers, totals.ScreenViews},
		Previous: overviewTotals{prevTotals.Visits, prevTotals.Users, prevTotals.NewUsers, prevTotals.ScreenViews},
		Series:   buildSeries(from, end, step, now, prevFrom.Sub(from), cur, prev),
		Pages:    make([]overviewPage, 0, len(pages)),
		Devices:  overviewDevices{totals.MobileVisits, totals.DesktopVisits, totals.TabletVisits},
		Funnel:   overviewFunnel{funnel.Users, funnel.Step1, funnel.AllSteps, funnel.FaqTab, funnel.FaqDetail},
	}
	for _, p := range pages {
		out.Pages = append(out.Pages, overviewPage{Target: p.Target, Views: p.Views, Viewers: p.Viewers})
	}
	for _, hr := range hours {
		if hr.Hour >= 0 && hr.Hour < 24 {
			out.Hours[hr.Hour] = hr.Visits
		}
	}
	writeJSON(w, out)
}

// firstErr runs steps in order and stops at the first error.
func firstErr(steps ...func() error) error {
	for _, step := range steps {
		if err := step(); err != nil {
			return err
		}
	}
	return nil
}

func wrap(what string, err error) error {
	if err != nil {
		return fmt.Errorf("%s: %w", what, err)
	}
	return nil
}

// bucketKey identifies a bucket by its local wall-clock start. Postgres returns
// `timestamp` (no zone) for the local bucket, which pgx decodes as UTC.
func bucketKey(t time.Time) string { return t.Format("2006-01-02T15:04") }

// buildSeries lays out every bucket of [from, end) and fills in the counts.
// Buckets after now get null current values; shift (negative) moves a bucket
// start to the matching bucket of the previous period.
func buildSeries(from, end time.Time, step time.Duration, now time.Time, shift time.Duration, cur, prev []store.OverviewSeriesRow) []overviewPoint {
	curBy := make(map[string]store.OverviewSeriesRow, len(cur))
	for _, row := range cur {
		curBy[bucketKey(row.Bucket.Time)] = row
	}
	prevBy := make(map[string]store.OverviewSeriesRow, len(prev))
	for _, row := range prev {
		prevBy[bucketKey(row.Bucket.Time)] = row
	}
	var out []overviewPoint
	for t := from; t.Before(end); t = t.Add(step) {
		key := bucketKey(t)
		p := prevBy[bucketKey(t.Add(shift))]
		pt := overviewPoint{Start: key, PrevVisits: p.Visits, PrevUsers: p.Users, PrevViews: p.ScreenViews}
		if !t.After(now) {
			c := curBy[key]
			pt.Visits, pt.Users, pt.Views = &c.Visits, &c.Users, &c.ScreenViews
		}
		out = append(out, pt)
	}
	return out
}
