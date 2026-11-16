// Package analytics owns the admin dashboard endpoints under /api/admin:
// summary, features, event-types, logs and export.csv (milestone M6).
package analytics

import (
	"github.com/go-chi/chi/v5"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
)

// Register mounts the admin routes on r, which is the /api sub-router.
// Mount them under r.Route("/admin", ...) with auth.RequireAdmin.
//
// M0 stub: registers nothing. Implemented in M6.
func Register(r chi.Router, d *app.Deps) {
	_, _ = r, d
}
