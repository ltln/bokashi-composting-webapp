// Package app holds the shared dependencies handed to every feature package's
// Register function. Add fields here only when several packages need them.
package app

import (
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/config"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

// Deps is built once in main and passed to router.New.
type Deps struct {
	Config config.Config
	Logger *slog.Logger
	// DB and Queries are nil when DATABASE_URL is unset (e.g. a bare
	// `docker run` that only serves /healthz). Handlers that need the
	// database must check and fail with 503.
	DB      *pgxpool.Pool
	Queries *store.Queries
}
