package events

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/store"
)

// TestIngestPostgres posts a batch through the real handler and store and
// checks every event lands in web_access_logs with a server ts. It needs a
// migrated database:
//
//	docker compose -f infra/docker-compose.yml up -d db && make migrate
//	DATABASE_URL=postgres://... go test ./internal/events/ -run Postgres
//
// It is skipped when DATABASE_URL is unset.
func TestIngestPostgres(t *testing.T) {
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

	session := uuid.NewString()
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM web_access_logs WHERE session_id = $1", session)
	})

	// One event per contract pair: page_view plus all 10 targets.
	var batch []EventIn
	batch = append(batch, EventIn{EventType: "page_view", SessionID: session, ClientTs: ptr("2026-11-16T08:30:00Z")})
	for typ, targets := range allowed {
		for _, target := range targets {
			if target != "" {
				batch = append(batch, EventIn{EventType: typ, FeatureTarget: ptr(target), SessionID: session})
			}
		}
	}

	h := &Handler{Store: store.New(pool), Secret: []byte("it-secret"), Log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	before := time.Now().Add(-time.Minute)
	rec := post(newRouter(h), batchJSON(t, batch...), testUser, map[string]string{"User-Agent": uaAndroidPhone, "Sec-CH-UA-Mobile": "?1"})
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, body %s", rec.Code, rec.Body)
	}

	// An invalid batch is rejected and stores nothing.
	bad := append([]EventIn{}, batch[0], EventIn{EventType: "switch_tab", FeatureTarget: ptr("FAQ_1_Smell"), SessionID: session})
	if rec := post(newRouter(h), batchJSON(t, bad...), testUser, nil); rec.Code != http.StatusBadRequest {
		t.Fatalf("invalid batch status = %d", rec.Code)
	}

	rows, err := pool.Query(ctx, `
		SELECT ts, client_ts IS NOT NULL, event_type::text, COALESCE(feature_target, ''),
		       device_type, COALESCE(device_info, ''), COALESCE(user_hash, '')
		FROM web_access_logs WHERE session_id = $1`, session)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	seen := map[string]int{}
	n := 0
	for rows.Next() {
		var (
			ts                                  time.Time
			hasClientTs                         bool
			typ, target, devType, devInfo, hash string
		)
		if err := rows.Scan(&ts, &hasClientTs, &typ, &target, &devType, &devInfo, &hash); err != nil {
			t.Fatal(err)
		}
		n++
		seen[typ+"/"+target]++
		if ts.Before(before) || ts.After(time.Now().Add(time.Minute)) {
			t.Errorf("ts %v is not the server receive time", ts)
		}
		if (typ == "page_view") != hasClientTs {
			t.Errorf("%s: client_ts present = %v", typ, hasClientTs)
		}
		if devType != "mobile" || devInfo != "Android / Chrome" {
			t.Errorf("device = %q / %q", devType, devInfo)
		}
		if hash != UserHash([]byte("it-secret"), testUser.ID) {
			t.Errorf("user_hash = %q", hash)
		}
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	if n != len(batch) {
		t.Fatalf("stored %d rows, want %d (every event, no extras)", n, len(batch))
	}
	for k, c := range seen {
		if c != 1 {
			t.Errorf("%s stored %d times", k, c)
		}
	}
}
