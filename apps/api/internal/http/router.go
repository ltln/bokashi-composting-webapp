// Package http wires the chi router: shared middleware, /healthz, and the
// /api sub-router that each feature package fills through its Register func.
//
// Feature milestones should not need to edit this file: add routes in
// internal/auth, internal/events or internal/analytics instead.
package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/analytics"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/auth"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/events"
)

// NewRouter builds the HTTP handler for the API.
func NewRouter(d *app.Deps) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(requestLogger(d.Logger))
	r.Use(middleware.Recoverer)

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// The Next.js proxy forwards /api/* unchanged, so paths here match
	// packages/contracts/openapi.yaml.
	r.Route("/api", func(api chi.Router) {
		api.Use(auth.LoadSession(d))
		auth.Register(api, d)
		events.Register(api, d)
		analytics.Register(api, d)
	})

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "not found"})
	})

	return r
}
