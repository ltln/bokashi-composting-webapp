// Command api is the Bếp Gọn – Rác Đúng HTTP API.
//
//	api                 serve HTTP on :$PORT (default)
//	api serve           same as above
//	api migrate [up]    apply all pending goose migrations
//	api migrate down    roll back the latest migration
//	api migrate status  print migration status
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib" // database/sql driver "pgx" for goose
	"github.com/pressly/goose/v3"

	"github.com/ltln/bokashi-composting-webapp/apps/api/db"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/config"
	apihttp "github.com/ltln/bokashi-composting-webapp/apps/api/internal/http"
	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "config:", err)
		os.Exit(2)
	}
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}))
	slog.SetDefault(log)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cmd, args := "serve", []string(nil)
	if len(os.Args) > 1 {
		cmd, args = os.Args[1], os.Args[2:]
	}
	switch cmd {
	case "serve":
		err = serve(ctx, cfg, log)
	case "migrate":
		err = migrate(ctx, cfg, log, args)
	default:
		err = fmt.Errorf("unknown command %q (want serve | migrate)", cmd)
	}
	if err != nil {
		log.Error("fatal", "cmd", cmd, "err", err)
		os.Exit(1)
	}
}

func serve(ctx context.Context, cfg config.Config, log *slog.Logger) error {
	deps := &app.Deps{Config: cfg, Logger: log}
	if cfg.DatabaseURL != "" {
		pool, err := pgxpool.New(ctx, cfg.DatabaseURL) // connects lazily
		if err != nil {
			return fmt.Errorf("db: %w", err)
		}
		defer pool.Close()
		deps.DB = pool
		deps.Queries = store.New(pool)
	} else {
		log.Warn("DATABASE_URL not set; serving without a database")
	}

	srv := &http.Server{
		Addr:              net.JoinHostPort("", cfg.Port),
		Handler:           apihttp.NewRouter(deps),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	errc := make(chan error, 1)
	go func() {
		log.Info("listening", "addr", srv.Addr)
		errc <- srv.ListenAndServe()
	}()

	select {
	case err := <-errc:
		return err
	case <-ctx.Done():
	}
	log.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	if err := <-errc; !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func migrate(ctx context.Context, cfg config.Config, log *slog.Logger, args []string) error {
	if cfg.DatabaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	sqlDB, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer sqlDB.Close()

	migrations, err := fs.Sub(db.Migrations, "migrations")
	if err != nil {
		return err
	}
	p, err := goose.NewProvider(goose.DialectPostgres, sqlDB, migrations)
	if err != nil {
		return err
	}

	sub := "up"
	if len(args) > 0 {
		sub = args[0]
	}
	switch sub {
	case "up":
		res, err := p.Up(ctx)
		for _, r := range res {
			log.Info("migrated", "version", r.Source.Version, "file", r.Source.Path, "dur", r.Duration)
		}
		if err == nil && len(res) == 0 {
			log.Info("no pending migrations")
		}
		return err
	case "down":
		r, err := p.Down(ctx)
		if r != nil {
			log.Info("rolled back", "version", r.Source.Version, "file", r.Source.Path)
		}
		return err
	case "status":
		st, err := p.Status(ctx)
		for _, s := range st {
			log.Info("status", "version", s.Source.Version, "file", s.Source.Path, "state", s.State, "applied_at", s.AppliedAt)
		}
		return err
	default:
		return fmt.Errorf("unknown migrate subcommand %q (want up | down | status)", sub)
	}
}
