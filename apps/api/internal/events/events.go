// Package events owns tracking ingest: POST /api/events (milestone M5).
//
// The enum table (EventType, FeatureTarget, Valid) is generated into
// enums_gen.go from packages/contracts/events.json by `make gen`; never edit
// it by hand.
package events

import (
	"github.com/go-chi/chi/v5"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
)

// Register mounts the events routes on r, which is the /api sub-router.
// Wrap handlers with auth.RequireUser.
//
// M0 stub: registers nothing. Implemented in M5.
func Register(r chi.Router, d *app.Deps) {
	_, _ = r, d
}
