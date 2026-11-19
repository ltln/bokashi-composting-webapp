// Package analytics owns the admin dashboard endpoints under /api/admin:
// overview (the dashboard), plus summary, features, event-types, devices, logs
// and export.csv (milestone M6).
//
// Every route sits behind auth.RequireAdmin (401 anonymous, 403 non-admin) and
// accepts the shared filters range=today|7d|30d|all and device=all|mobile|desktop.
// user_hash is never selected, so it cannot leak through any response.
package analytics

import (
	"context"
	"encoding/base64"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"net/http"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/auth"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/events"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

const (
	defaultLimit = 50
	maxLimit     = 200
	exportPage   = 1000
)

// Querier is the slice of *store.Queries the handlers use.
type Querier interface {
	AnalyticsSummary(ctx context.Context, arg store.AnalyticsSummaryParams) (store.AnalyticsSummaryRow, error)
	AnalyticsFeatures(ctx context.Context, arg store.AnalyticsFeaturesParams) ([]store.AnalyticsFeaturesRow, error)
	AnalyticsEventTypes(ctx context.Context, arg store.AnalyticsEventTypesParams) ([]store.AnalyticsEventTypesRow, error)
	AnalyticsDevices(ctx context.Context, arg store.AnalyticsDevicesParams) ([]store.AnalyticsDevicesRow, error)
	AnalyticsLogs(ctx context.Context, arg store.AnalyticsLogsParams) ([]store.AnalyticsLogsRow, error)
	OverviewTotals(ctx context.Context, arg store.OverviewTotalsParams) (store.OverviewTotalsRow, error)
	OverviewSeries(ctx context.Context, arg store.OverviewSeriesParams) ([]store.OverviewSeriesRow, error)
	OverviewPages(ctx context.Context, arg store.OverviewPagesParams) ([]store.OverviewPagesRow, error)
	OverviewHours(ctx context.Context, arg store.OverviewHoursParams) ([]store.OverviewHoursRow, error)
	OverviewFunnel(ctx context.Context, arg store.OverviewFunnelParams) (store.OverviewFunnelRow, error)
	OverviewOnline(ctx context.Context, arg store.OverviewOnlineParams) (int64, error)
}

// Handler serves the /api/admin routes.
type Handler struct {
	Store Querier // nil means no database: answer 503
	Log   *slog.Logger
	Now   func() time.Time // injectable clock; defaults to time.Now
}

// Register mounts the admin routes on r, which is the /api sub-router.
func Register(r chi.Router, d *app.Deps) {
	h := &Handler{Log: d.Logger}
	if d.Queries != nil {
		h.Store = d.Queries
	}
	r.Route("/admin", h.Routes)
}

// Routes mounts the handlers (behind RequireAdmin) on r.
func (h *Handler) Routes(r chi.Router) {
	r.Use(auth.RequireAdmin)
	r.Get("/overview", h.overview)
	r.Get("/summary", h.summary)
	r.Get("/features", h.features)
	r.Get("/event-types", h.eventTypes)
	r.Get("/devices", h.devices)
	r.Get("/logs", h.logs)
	r.Get("/export.csv", h.exportCSV)
}

// location is the dashboard's day boundary zone. Vietnam has no DST, so the
// fixed-offset fallback (for images without tzdata) is exact.
var location = func() *time.Location {
	if l, err := time.LoadLocation("Asia/Ho_Chi_Minh"); err == nil {
		return l
	}
	return time.FixedZone("Asia/Ho_Chi_Minh", 7*3600)
}()

// filters are the shared query parameters, already translated for SQL.
type filters struct {
	Range  string
	Since  pgtype.Timestamptz // invalid (NULL) = whole campaign
	Device pgtype.Text        // invalid (NULL) = all devices
}

// SinceFor returns the lower bound of range at now, or ok=false for "all".
// "7d" and "30d" count whole local days including today.
func SinceFor(rng string, now time.Time) (since time.Time, ok bool) {
	n := now.In(location)
	day := time.Date(n.Year(), n.Month(), n.Day(), 0, 0, 0, 0, location)
	switch rng {
	case "today":
		return day, true
	case "7d":
		return day.AddDate(0, 0, -6), true
	case "30d":
		return day.AddDate(0, 0, -29), true
	}
	return time.Time{}, false
}

func (h *Handler) now() time.Time {
	if h.Now != nil {
		return h.Now()
	}
	return time.Now()
}

func (h *Handler) parseFilters(r *http.Request) (filters, error) {
	q := r.URL.Query()
	f := filters{Range: q.Get("range")}
	if f.Range == "" {
		f.Range = "7d"
	}
	switch f.Range {
	case "today", "7d", "30d", "all":
	default:
		return f, fmt.Errorf("range must be today, 7d, 30d or all")
	}
	if t, ok := SinceFor(f.Range, h.now()); ok {
		f.Since = pgtype.Timestamptz{Time: t, Valid: true}
	}
	switch d := q.Get("device"); d {
	case "", "all":
	case "mobile", "desktop":
		f.Device = pgtype.Text{String: d, Valid: true}
	default:
		return f, fmt.Errorf("device must be all, mobile or desktop")
	}
	return f, nil
}

// begin checks the database and parses the filters, writing the error itself.
func (h *Handler) begin(w http.ResponseWriter, r *http.Request) (filters, bool) {
	if h.Store == nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return filters{}, false
	}
	f, err := h.parseFilters(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return f, false
	}
	return f, true
}

type summaryOut struct {
	TotalEvents    int64 `json:"totalEvents"`
	UniqueSessions int64 `json:"uniqueSessions"`
	PageViews      int64 `json:"pageViews"`
	MobileShare    int   `json:"mobileShare"` // percent of events, 0-100
}

func (h *Handler) summary(w http.ResponseWriter, r *http.Request) {
	f, ok := h.begin(w, r)
	if !ok {
		return
	}
	row, err := h.Store.AnalyticsSummary(r.Context(), store.AnalyticsSummaryParams{Since: f.Since, Device: f.Device})
	if err != nil {
		h.fail(w, r, "summary", err)
		return
	}
	out := summaryOut{TotalEvents: row.TotalEvents, UniqueSessions: row.UniqueSessions, PageViews: row.PageViews}
	if row.TotalEvents > 0 {
		out.MobileShare = int(math.Round(float64(row.MobileEvents) * 100 / float64(row.TotalEvents)))
	}
	writeJSON(w, out)
}

type featureOut struct {
	Target string `json:"target"`
	Count  int64  `json:"count"`
}

func (h *Handler) features(w http.ResponseWriter, r *http.Request) {
	f, ok := h.begin(w, r)
	if !ok {
		return
	}
	tab := r.URL.Query().Get("tab")
	if tab == "" {
		tab = "all"
	}
	if !slices.Contains([]string{"all", "setup", "faq"}, tab) {
		writeError(w, http.StatusBadRequest, "tab must be all, setup or faq")
		return
	}
	rows, err := h.Store.AnalyticsFeatures(r.Context(), store.AnalyticsFeaturesParams{Since: f.Since, Device: f.Device})
	if err != nil {
		h.fail(w, r, "features", err)
		return
	}
	out := make([]featureOut, 0, len(rows))
	for _, row := range rows {
		if tab != "all" && events.FeatureTarget(row.Target).Tab() != tab {
			continue
		}
		out = append(out, featureOut{Target: row.Target, Count: row.Count})
	}
	writeJSON(w, out) // rows arrive sorted by count desc
}

func (h *Handler) eventTypes(w http.ResponseWriter, r *http.Request) {
	f, ok := h.begin(w, r)
	if !ok {
		return
	}
	rows, err := h.Store.AnalyticsEventTypes(r.Context(), store.AnalyticsEventTypesParams{Since: f.Since, Device: f.Device})
	if err != nil {
		h.fail(w, r, "event types", err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		out = append(out, map[string]any{"type": row.Type, "count": row.Count})
	}
	writeJSON(w, out)
}

func (h *Handler) devices(w http.ResponseWriter, r *http.Request) {
	f, ok := h.begin(w, r)
	if !ok {
		return
	}
	rows, err := h.Store.AnalyticsDevices(r.Context(), store.AnalyticsDevicesParams{Since: f.Since, Device: f.Device})
	if err != nil {
		h.fail(w, r, "devices", err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		out = append(out, map[string]any{"deviceType": row.DeviceType, "count": row.Count})
	}
	writeJSON(w, out)
}

type logOut struct {
	ID            int64   `json:"id"`
	Ts            string  `json:"ts"` // RFC 3339 in Asia/Ho_Chi_Minh
	SessionID     string  `json:"sessionId"`
	EventType     string  `json:"eventType"`
	FeatureTarget *string `json:"featureTarget"`
	DeviceType    string  `json:"deviceType"`
	DeviceInfo    *string `json:"deviceInfo"`
}

type logsOut struct {
	Items      []logOut `json:"items"`
	NextCursor *string  `json:"nextCursor"`
}

func encodeCursor(ts time.Time, id int64) string {
	return base64.RawURLEncoding.EncodeToString([]byte(strconv.FormatInt(ts.UnixMicro(), 10) + "." + strconv.FormatInt(id, 10)))
}

func decodeCursor(s string) (pgtype.Timestamptz, pgtype.Int8, error) {
	bad := fmt.Errorf("invalid cursor")
	raw, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return pgtype.Timestamptz{}, pgtype.Int8{}, bad
	}
	us, id, ok := strings.Cut(string(raw), ".")
	if !ok {
		return pgtype.Timestamptz{}, pgtype.Int8{}, bad
	}
	u, err1 := strconv.ParseInt(us, 10, 64)
	i, err2 := strconv.ParseInt(id, 10, 64)
	if err1 != nil || err2 != nil {
		return pgtype.Timestamptz{}, pgtype.Int8{}, bad
	}
	return pgtype.Timestamptz{Time: time.UnixMicro(u), Valid: true}, pgtype.Int8{Int64: i, Valid: true}, nil
}

func textPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func (h *Handler) logs(w http.ResponseWriter, r *http.Request) {
	f, ok := h.begin(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	limit := defaultLimit
	if s := q.Get("limit"); s != "" {
		n, err := strconv.Atoi(s)
		if err != nil || n < 1 {
			writeError(w, http.StatusBadRequest, "limit must be a positive integer")
			return
		}
		limit = min(n, maxLimit)
	}
	p := store.AnalyticsLogsParams{Since: f.Since, Device: f.Device, RowLimit: int32(limit + 1)}
	if t := q.Get("target"); t != "" {
		p.Target = pgtype.Text{String: t, Valid: true}
	}
	if c := q.Get("cursor"); c != "" {
		var err error
		if p.CursorTs, p.CursorID, err = decodeCursor(c); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
	}
	rows, err := h.Store.AnalyticsLogs(r.Context(), p)
	if err != nil {
		h.fail(w, r, "logs", err)
		return
	}
	out := logsOut{Items: make([]logOut, 0, min(len(rows), limit))}
	if len(rows) > limit { // one extra row proves there is a next page
		rows = rows[:limit]
		last := rows[limit-1]
		c := encodeCursor(last.Ts.Time, last.ID)
		out.NextCursor = &c
	}
	for _, row := range rows {
		out.Items = append(out.Items, logOut{
			ID:            row.ID,
			Ts:            row.Ts.Time.In(location).Format(time.RFC3339),
			SessionID:     row.SessionID,
			EventType:     row.EventType,
			FeatureTarget: textPtr(row.FeatureTarget),
			DeviceType:    row.DeviceType,
			DeviceInfo:    textPtr(row.DeviceInfo),
		})
	}
	writeJSON(w, out)
}

// exportCSV streams every matching row, newest first, in keyset pages so
// memory stays flat. The UTF-8 BOM makes Excel read Vietnamese text correctly.
func (h *Handler) exportCSV(w http.ResponseWriter, r *http.Request) {
	f, ok := h.begin(w, r)
	if !ok {
		return
	}
	p := store.AnalyticsLogsParams{Since: f.Since, Device: f.Device, RowLimit: exportPage}
	if t := r.URL.Query().Get("target"); t != "" {
		p.Target = pgtype.Text{String: t, Valid: true}
	}
	// Fetch the first page before sending headers so a failure is still a clean 500.
	rows, err := h.Store.AnalyticsLogs(r.Context(), p)
	if err != nil {
		h.fail(w, r, "export", err)
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="bokashi-logs-%s.csv"`, f.Range))
	_, _ = w.Write([]byte("\xEF\xBB\xBF"))
	cw := csv.NewWriter(w)
	_ = cw.Write([]string{"Timestamp", "Session_ID", "Event_Type", "Feature_Target", "Device_Info"})
	fl, _ := w.(http.Flusher)
	for {
		for _, row := range rows {
			_ = cw.Write([]string{
				row.Ts.Time.In(location).Format("2006-01-02 15:04:05"),
				csvSafe(row.SessionID),
				row.EventType,
				csvSafe(row.FeatureTarget.String),
				csvSafe(row.DeviceInfo.String),
			})
		}
		cw.Flush()
		if fl != nil {
			fl.Flush()
		}
		if len(rows) < exportPage || cw.Error() != nil {
			return
		}
		last := rows[len(rows)-1]
		p.CursorTs = pgtype.Timestamptz{Time: last.Ts.Time, Valid: true}
		p.CursorID = pgtype.Int8{Int64: last.ID, Valid: true}
		if rows, err = h.Store.AnalyticsLogs(r.Context(), p); err != nil {
			h.log().ErrorContext(r.Context(), "admin export page", "err", err)
			return // headers are sent; the client sees a truncated file
		}
	}
}

// csvSafe defuses spreadsheet formula injection in text cells.
func csvSafe(s string) string {
	if s != "" && strings.ContainsRune("=+-@\t\r", rune(s[0])) {
		return "'" + s
	}
	return s
}

func (h *Handler) log() *slog.Logger {
	if h.Log != nil {
		return h.Log
	}
	return slog.Default()
}

func (h *Handler) fail(w http.ResponseWriter, r *http.Request, what string, err error) {
	h.log().ErrorContext(r.Context(), "admin "+what, "err", err)
	writeError(w, http.StatusInternalServerError, "could not load data")
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
