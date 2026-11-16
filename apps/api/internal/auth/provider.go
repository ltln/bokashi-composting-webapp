package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/idtoken"
)

// Identity is the verified Google account returned by a Provider.
type Identity struct {
	Sub     string // stable Google account id (users.google_sub)
	Email   string
	Name    string
	Picture string
}

// Provider is the OAuth seam: the real implementation talks to Google, tests
// use a fake. Exchange must only return an Identity whose ID token has been
// verified (signature, issuer, audience, expiry).
type Provider interface {
	// AuthCodeURL is the consent-screen URL for this state and PKCE verifier.
	AuthCodeURL(state, verifier string) string
	// Exchange trades the authorization code for tokens and verifies the ID token.
	Exchange(ctx context.Context, code, verifier string) (Identity, error)
}

// googleIssuers are the iss values Google uses in ID tokens.
var googleIssuers = map[string]bool{"accounts.google.com": true, "https://accounts.google.com": true}

type googleProvider struct {
	oauth  *oauth2.Config
	client *http.Client
}

func newGoogleProvider(clientID, clientSecret, redirectURL string) *googleProvider {
	return &googleProvider{
		oauth: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Endpoint:     google.Endpoint,
			Scopes:       []string{"openid", "email", "profile"},
		},
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (g *googleProvider) AuthCodeURL(state, verifier string) string {
	return g.oauth.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))
}

func (g *googleProvider) Exchange(ctx context.Context, code, verifier string) (Identity, error) {
	ctx = context.WithValue(ctx, oauth2.HTTPClient, g.client)
	tok, err := g.oauth.Exchange(ctx, code, oauth2.VerifierOption(verifier))
	if err != nil {
		return Identity{}, fmt.Errorf("exchange code: %w", err)
	}
	raw, _ := tok.Extra("id_token").(string)
	if raw == "" {
		return Identity{}, errors.New("token response has no id_token")
	}
	p, err := idtoken.Validate(ctx, raw, g.oauth.ClientID)
	if err != nil {
		return Identity{}, fmt.Errorf("verify id_token: %w", err)
	}
	if !googleIssuers[p.Issuer] {
		return Identity{}, fmt.Errorf("unexpected id_token issuer %q", p.Issuer)
	}
	email, _ := p.Claims["email"].(string)
	if verified, _ := p.Claims["email_verified"].(bool); email == "" || !verified {
		return Identity{}, errors.New("google account email is missing or unverified")
	}
	name, _ := p.Claims["name"].(string)
	picture, _ := p.Claims["picture"].(string)
	return Identity{
		Sub:     p.Subject,
		Email:   email,
		Name:    strings.TrimSpace(name),
		Picture: picture,
	}, nil
}
