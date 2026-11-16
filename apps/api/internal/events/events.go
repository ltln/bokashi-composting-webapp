// Package events owns tracking ingest: POST /api/events (milestone M5).
//
// The enum table (EventType, FeatureTarget, Valid) is generated into
// enums_gen.go from packages/contracts/events.json by `make gen`; never edit
// it by hand.
package events

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/httprate"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/auth"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

const (
	// MaxBatch is the largest number of events accepted in one request.
	MaxBatch = 50
	// maxBodyBytes bounds the request body; 50 events fit in well under 16 KiB.
	maxBodyBytes = 64 << 10
	// Rate limit per auth session (sid cookie, falling back to the user id).
	rateLimitRequests = 120
	rateLimitWindow   = time.Minute
)

// EventIn is one item of the request body.
type EventIn struct {
	EventType     string  `json:"eventType"`
	FeatureTarget *string `json:"featureTarget,omitempty"`
	ClientTs      *string `json:"clientTs,omitempty"`
	SessionID     string  `json:"sessionId"`
}

// Batch is the POST /api/events request body.
type Batch struct {
	Events []EventIn `json:"events"`
}

// Inserter stores a validated batch. *store.Queries implements it.
type Inserter interface {
	InsertEvents(ctx context.Context, arg store.InsertEventsParams) (int64, error)
}

// Handler serves POST /api/events.
type Handler struct {
	Store  Inserter // nil means no database: answer 503
	Secret []byte   // USER_HASH_SECRET; empty means user_hash is stored as NULL
	Log    *slog.Logger
}

// Register mounts the events routes on r, which is the /api sub-router.
func Register(r chi.Router, d *app.Deps) {
	h := &Handler{Secret: []byte(d.Config.UserHashSecret), Log: d.Logger}
	if d.Queries != nil {
		h.Store = d.Queries
	}
	if h.Log == nil {
		h.Log = slog.Default()
	}
	if len(h.Secret) == 0 {
		h.Log.Warn("USER_HASH_SECRET not set; events are stored without user_hash")
	}
	r.With(auth.RequireUser, RateLimit()).Post("/events", h.ServeHTTP)
}

// RateLimit limits event ingest to ~120 requests a minute per auth session.
// It must run after auth.RequireUser.
func RateLimit() func(http.Handler) http.Handler {
	return httprate.Limit(rateLimitRequests, rateLimitWindow,
		httprate.WithKeyFuncs(sessionKey),
		httprate.WithLimitHandler(func(w http.ResponseWriter, _ *http.Request) {
			writeError(w, http.StatusTooManyRequests, "rate limited")
		}),
	)
}

func sessionKey(r *http.Request) (string, error) {
	if c, err := r.Cookie("sid"); err == nil && c.Value != "" {
		return "sid:" + c.Value, nil
	}
	if u, ok := auth.UserFrom(r.Context()); ok {
		return "user:" + u.ID.String(), nil
	}
	return httprate.KeyByIP(r)
}

// ServeHTTP validates the whole batch, then stores it in one statement.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UserFrom(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	if h.Store == nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}

	var b Batch
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	if err := dec.Decode(&b); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeError(w, http.StatusRequestEntityTooLarge, "body too large")
			return
		}
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	params, err := Validate(b.Events)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	params.DeviceType = DeviceType(r.Header)
	params.DeviceInfo = pgtype.Text{String: DeviceInfo(r.Header), Valid: true}
	if len(h.Secret) > 0 {
		params.UserHash = pgtype.Text{String: UserHash(h.Secret, u.ID), Valid: true}
	}

	n, err := h.Store.InsertEvents(r.Context(), params)
	if err != nil {
		h.Log.ErrorContext(r.Context(), "insert events", "err", err, "count", len(b.Events))
		writeError(w, http.StatusInternalServerError, "could not store events")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(map[string]int64{"accepted": n})
}

// Validate checks every event and returns the per-event insert columns. Any
// invalid item rejects the whole batch, so nothing partial is ever stored.
func Validate(events []EventIn) (store.InsertEventsParams, error) {
	var p store.InsertEventsParams
	if len(events) == 0 {
		return p, errors.New("events: at least 1 event required")
	}
	if len(events) > MaxBatch {
		return p, fmt.Errorf("events: at most %d events per request", MaxBatch)
	}
	p.ClientTs = make([]pgtype.Timestamptz, len(events))
	p.SessionIds = make([]string, len(events))
	p.EventTypes = make([]string, len(events))
	p.FeatureTargets = make([]string, len(events))
	for i, e := range events {
		target := ""
		if e.FeatureTarget != nil {
			target = *e.FeatureTarget
		}
		if !Valid(e.EventType, target) {
			return p, fmt.Errorf("events[%d]: invalid eventType/featureTarget %q/%q", i, e.EventType, target)
		}
		sid, err := uuid.Parse(e.SessionID)
		if err != nil || len(e.SessionID) != 36 {
			return p, fmt.Errorf("events[%d]: sessionId must be a UUID", i)
		}
		if e.ClientTs != nil && *e.ClientTs != "" {
			t, err := time.Parse(time.RFC3339Nano, *e.ClientTs)
			if err != nil {
				return p, fmt.Errorf("events[%d]: clientTs must be RFC 3339", i)
			}
			p.ClientTs[i] = pgtype.Timestamptz{Time: t, Valid: true}
		}
		p.SessionIds[i] = sid.String()
		p.EventTypes[i] = e.EventType
		p.FeatureTargets[i] = target
	}
	return p, nil
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
