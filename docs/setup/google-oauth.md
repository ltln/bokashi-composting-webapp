# Setting up Google OAuth

How to create the Google Cloud project and OAuth client that "Bếp Gọn – Rác Đúng" uses for "Tiếp tục với Google", and where the credentials go.

**Time:** about 15 minutes.
**You need:** a Google account and the app's public HTTPS URL. For local development, `http://localhost:3000` is enough.

> Google moves things around in the Cloud Console now and then. The OAuth screens now live under **Google Auth Platform** (the old "OAuth consent screen" and "Credentials" pages redirect there). If a label below doesn't match, look for the same idea nearby.

---

## How sign-in works

The browser never sees the client secret. The flow runs between the user's browser, our Go API and Google:

1. `/login` links to `GET /api/auth/google/login`.
2. The API redirects to Google with `state` and PKCE.
3. Google sends the user back to **`<APP_ORIGIN>/api/auth/google/callback`**.
4. The API exchanges the code (using the client secret), checks the ID token and sets the `sid` session cookie.

So the Google side only needs two things:
- a **redirect URI** for each environment;
- the three basic scopes: **`openid`, `email`, `profile`**. These are non-sensitive, so the app needs no Google security review.

---

## 1. Create the project

1. Open **https://console.cloud.google.com/** and sign in with the account that will own the app.
2. In the project picker at the top, click **New project**.
3. **Project name:** `bokashi-composting-webapp`, or anything you like. Choose an organization if you have one; otherwise leave it as "No organization".
4. Click **Create**, then make sure the new project is selected in the picker.

No extra APIs need to be enabled for sign-in.

## 2. Configure the Google Auth Platform

Go to **Menu ☰ → Google Auth Platform**, or open https://console.cloud.google.com/auth. If you see **Get started**, click it.

### 2a. App information (Branding)

| Field | Value |
|---|---|
| App name | `Bếp Gọn – Rác Đúng` |
| User support email | your email (shown to users on the consent screen) |
| App logo | **Leave it empty for now.** A logo makes Google require brand verification before it appears. |
| Application home page | `https://<your-domain>/` |
| Privacy policy link | `https://<your-domain>/privacy` |
| Terms of service link | `https://<your-domain>/terms` |
| Authorized domains | your domain's root, e.g. `example.com` (not a full URL) |
| Developer contact email | your email (Google sends notices here) |

> **Tunnels:** with Cloudflare Tunnel or Tailscale Funnel, use the public hostname the tunnel gives you, e.g. `bokashi.example.com` or `<machine>.<tailnet>.ts.net`. Google rejects raw IPs and Tailscale `100.x` addresses.

### 2b. Audience

- **User type: External.** Anyone with a Google account can sign in. (Internal only applies inside a Google Workspace organization.)
- **Publishing status:**
  - **Testing** while you build. Only the accounts listed under **Test users** can sign in (up to 100). Add your own Google account and your testers here.
  - **In production** when you launch: click **Publish app**. With only the basic scopes, Google doesn't require app verification. Users may see an "unverified app" notice until brand verification is done, which is optional and only needed if you want the logo shown.

### 2c. Data access (scopes)

Click **Add or remove scopes** and select exactly these three:
- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

Save. **Don't add anything else.** The API requests only these three (`apps/api/internal/auth/provider.go`).

## 3. Create the OAuth client

1. Open **Google Auth Platform → Clients → Create client**.
2. **Application type:** **Web application**.
3. **Name:** e.g. `bokashi-web-prod`. Creating a separate client per environment (`-dev`, `-prod`) is cleaner, but one client with several redirect URIs also works.
4. **Authorized JavaScript origins:** leave empty. The browser never talks to Google directly.
5. **Authorized redirect URIs:** add one entry per environment. Each must match **exactly**: scheme, host, port and path, with no trailing slash.

   | Environment | Redirect URI |
   |---|---|
   | Local dev | `http://localhost:3000/api/auth/google/callback` |
   | Production | `https://<your-domain>/api/auth/google/callback` |

   Google only accepts `http://` for `localhost`. Every other host must be `https://`.

6. Click **Create**.
7. **Copy the Client ID and Client secret now, or click "Download JSON".** Google shows the secret **only once**. If you lose it, add a new secret on the client (and delete the old one); you can't view the original again.

## 4. Put the credentials in `.env`

### Local development
Copy `.env.example` to `.env` at the repo root (it's git-ignored) and fill in:

```dotenv
GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
OAUTH_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
APP_ORIGIN=http://localhost:3000

# generate each with: openssl rand -base64 32
SESSION_SECRET=...
USER_HASH_SECRET=...
```

### Production (the server)
Put the same keys in the server's `.env`. **Never commit them, and don't put them in GitHub secrets**; the server-pull deploy doesn't need them there.

```dotenv
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APP_ORIGIN=https://<your-domain>
OAUTH_REDIRECT_URL=https://<your-domain>/api/auth/google/callback
SESSION_SECRET=...      # different from dev
USER_HASH_SECRET=...    # different from dev; never change it after launch, or unique-user counts reset
```

Notes:
- `APP_ORIGIN` must be the exact public origin users see. The API uses it for redirects, the `Secure` cookie flag (on with `https://`) and the CSRF `Origin` check.
- `OAUTH_REDIRECT_URL` is optional. If it's empty, the API uses `APP_ORIGIN + /api/auth/google/callback`. Setting it explicitly makes mismatches easier to spot.

## 5. Test it

1. `make dev` (or restart the API container on the server, so it reads the new `.env`).
2. Open `<APP_ORIGIN>/login` and click **Tiếp tục với Google**.
3. Choose a Google account. In Testing mode it must be on the test-user list.
4. You should land on **`/setup/1`**, and `GET /api/me` should return your name.
5. To make yourself an admin:
   ```sh
   make admin EMAIL=you@gmail.com   # you must have signed in once first
   ```
   Then open `/admin`. It works without signing out.

## Troubleshooting

| What you see | Cause | Fix |
|---|---|---|
| Google error **`redirect_uri_mismatch`** | The redirect URI the API sent isn't in the client's list | Compare `OAUTH_REDIRECT_URL` (or `APP_ORIGIN`) with the client's **Authorized redirect URIs**: same scheme, host, port and path, no trailing slash. Changes can take a few minutes to apply. |
| **`Error 403: access_denied`** / "app is being tested" | Testing mode, and the account isn't a test user | Add the account under **Audience → Test users**, or publish the app. |
| **`invalid_client`** | Wrong or rotated client ID or secret, or a stray space | Re-copy the values. If the secret is lost, add a new secret on the client. |
| Back on `/login?error=…` after Google | The API rejected the callback | Check the API logs: a `state` mismatch (cookies blocked, or the flow took longer than 10 minutes), an unverified Google email, or a DB problem. |
| Sign-in works but you're bounced to `/login` again | Session cookie not kept | On HTTPS, `APP_ORIGIN` must start with `https://`. Make sure the tunnel or proxy forwards the `Cookie` and `Set-Cookie` headers unchanged. |
| "This app isn't verified" screen | The app is published but brand verification hasn't been done | Safe to continue for basic scopes. For a cleaner screen, submit brand verification under **Branding** (needs the domain verified in Google Search Console). |

## Security checklist
- [ ] The client secret exists only in `.env` files and a password manager. It's not in git, chat or GitHub secrets.
- [ ] Production uses its own `SESSION_SECRET` and `USER_HASH_SECRET`, and `USER_HASH_SECRET` never changes after launch.
- [ ] Only the three basic scopes are configured.
- [ ] Old secrets are deleted after rotating.
- [ ] The test-user list is trimmed or the app is published before launch.
