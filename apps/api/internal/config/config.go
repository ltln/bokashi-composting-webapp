// Package config reads the API configuration from environment variables.
// Variables are documented in the repo-root .env.example.
package config

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
)

// Config is the process configuration. Fields that a milestone has not
// implemented yet are optional here; the owning package validates what it needs.
type Config struct {
	Port        string // PORT, default 8080
	DatabaseURL string // DATABASE_URL
	AppOrigin   string // APP_ORIGIN, public origin of the web app
	LogLevel    slog.Level

	// Google OAuth and secrets (M1 / M5).
	GoogleClientID     string // GOOGLE_CLIENT_ID
	GoogleClientSecret string // GOOGLE_CLIENT_SECRET
	OAuthRedirectURL   string // OAUTH_REDIRECT_URL
	SessionSecret      string // SESSION_SECRET
	UserHashSecret     string // USER_HASH_SECRET
}

// Load reads Config from the environment.
func Load() (Config, error) {
	c := Config{
		Port:               getenv("PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		AppOrigin:          getenv("APP_ORIGIN", "http://localhost:3000"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		OAuthRedirectURL:   os.Getenv("OAUTH_REDIRECT_URL"),
		SessionSecret:      os.Getenv("SESSION_SECRET"),
		UserHashSecret:     os.Getenv("USER_HASH_SECRET"),
	}
	if err := c.LogLevel.UnmarshalText([]byte(getenv("LOG_LEVEL", "info"))); err != nil {
		return Config{}, fmt.Errorf("LOG_LEVEL: %w", err)
	}
	return c, nil
}

func getenv(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}
