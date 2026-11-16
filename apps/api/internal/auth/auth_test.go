package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
)

func TestRequireFailsClosed(t *testing.T) {
	ok := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	cases := []struct {
		name string
		mw   func(http.Handler) http.Handler
		user *User
		want int
	}{
		{"user/anon", RequireUser, nil, http.StatusUnauthorized},
		{"admin/anon", RequireAdmin, nil, http.StatusUnauthorized},
		{"user/ok", RequireUser, &User{ID: uuid.New()}, http.StatusOK},
		{"admin/non-admin", RequireAdmin, &User{ID: uuid.New()}, http.StatusForbidden},
		{"admin/ok", RequireAdmin, &User{ID: uuid.New(), IsAdmin: true}, http.StatusOK},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if c.user != nil {
				req = req.WithContext(WithUser(req.Context(), c.user))
			}
			rec := httptest.NewRecorder()
			c.mw(ok).ServeHTTP(rec, req)
			if rec.Code != c.want {
				t.Fatalf("got %d, want %d", rec.Code, c.want)
			}
		})
	}
}
