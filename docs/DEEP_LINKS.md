# Deep links: making a shared post open the app

A shared post is a plain https URL:

```
https://filmyconnect24.com/post/<postId>
```

On a phone with FilmyConnect installed, tapping it opens the post in the app.
Everywhere else — a laptop, a phone without the app, WhatsApp's link preview
crawler — it opens a page showing the post with links to the stores.

Previously this was `https://filmy.app/post/<id>`, a domain nobody owns, so
every shared link was dead.

## How it works

Both platforms require the domain to publicly vouch for the app before they
will let it intercept links. Each fetches one file over HTTPS:

| Platform | File | Checks |
|---|---|---|
| iOS (Universal Links) | `/.well-known/apple-app-site-association` | `TeamID.BundleID` |
| Android (App Links) | `/.well-known/assetlinks.json` | SHA-256 of the signing cert |

Both are served by the Node backend from
[`deeplink.controller.js`](../backend/server/src/controllers/deeplink.controller.js),
built from env vars so nothing app-specific is hardcoded.

**The failure mode is silent.** A wrong Team ID or a stale fingerprint produces
no error anywhere — links just quietly open a browser instead of the app.
`GET /health/deeplinks` reports whether the values are set.

## Setup

### 1. Backend env vars

Add to the backend `.env` (see `backend/server/env.example`):

```sh
IOS_TEAM_ID=<10-char Team ID>              # Apple Developer → Membership
ANDROID_SHA256_CERT_FINGERPRINTS=<AA:BB:…> # Play Console → Setup → App integrity
DEEPLINK_ORIGIN=https://filmyconnect24.com
IOS_APP_STORE_ID=<numeric id from the App Store listing URL>
```

For `ANDROID_SHA256_CERT_FINGERPRINTS`, use the **app signing key** certificate,
not the upload key. A Play-distributed build is re-signed by Google, so the
upload key's fingerprint will not match what is installed on a user's phone —
this is the single most common reason App Links verify in internal testing and
then fail in production. Comma-separate both fingerprints if you also install
builds signed with the upload key directly.

### 2. nginx on filmyconnect24.com

The website is static nginx; the association files and the landing pages come
from the Node backend. Add to the `filmyconnect24.com` server block, **above**
the existing `location /`:

```nginx
location /.well-known/ {
    proxy_pass https://api.filmyconnect24.com;
    proxy_set_header Host api.filmyconnect24.com;
    proxy_ssl_server_name on;
}

location ~ ^/(post|user)/ {
    proxy_pass https://api.filmyconnect24.com;
    proxy_set_header Host api.filmyconnect24.com;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_ssl_server_name on;
}
```

If the website and the API share a server, `proxy_pass http://127.0.0.1:<PORT>;`
is faster and avoids a TLS hop.

Two things that break verification, both worth checking after any nginx change:

- **No redirects.** Apple and Google follow the `.well-known` URL exactly. An
  `http → https` or apex → `www` redirect on that path fails verification.
- **No auth, no HTML error pages.** Both must return `200` with JSON.

### 3. Verify the files are reachable

```sh
curl -sI https://filmyconnect24.com/.well-known/apple-app-site-association   # 200, no 30x
curl -s  https://filmyconnect24.com/.well-known/apple-app-site-association | jq
curl -s  https://filmyconnect24.com/.well-known/assetlinks.json | jq
curl -s  https://api.filmyconnect24.com/health/deeplinks | jq   # {"configured": true, …}
```

Google's own checker:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://filmyconnect24.com&relation=delegate_permission/common.handle_all_urls
```

### 4. Rebuild the app

`associatedDomains` and `intentFilters` in `app.json` are **native** config.
They are compiled into the iOS entitlements and `AndroidManifest.xml`, so an
OTA update will not deliver them — a new build is required:

```sh
eas build --profile production --platform all
```

On iOS this adds the `com.apple.developer.associated-domains` entitlement, and
EAS enables the matching Associated Domains capability on the App ID during the
build. If the build fails on provisioning, run `eas credentials` to resync the
profile.

Do the backend deploy and the nginx change **before** shipping the build: an
Android install verifies its App Links at install time, so an app that lands on
phones before `assetlinks.json` is reachable will not verify, and those
installs keep opening links in a browser until Android retries.

### 5. Test on a device

| Test | Expected |
|---|---|
| Share a post → paste in WhatsApp | Rich card with the image, caption and author |
| Tap that link, app installed | Opens the post in the app |
| Tap it signed out | Sign-in first, then the post |
| Back gesture from a deep-linked post | Goes to home, does not close the app |
| Tap it with the app uninstalled | Landing page with the post and store buttons |

On Android, confirm verification actually passed:

```sh
adb shell pm get-app-links app.rork.filmy    # want: filmyconnect24.com: verified
```

If it says `none` or `legacy_failure`, the fingerprint is wrong or the file was
unreachable at install time. Re-verify with:

```sh
adb shell pm verify-app-links --re-verify app.rork.filmy
```

Note that Apple's CDN caches the association file: changes can take up to 24
hours to reach phones that already have the app installed. A fresh install
picks up the new file immediately, which is the quicker way to test a fix.

## Adding another shareable screen

The path appears in four places and they have to agree:

1. `LINKED_PATHS` in [`config/deeplinks.js`](../backend/server/src/config/deeplinks.js) — drives the iOS file
2. A route in [`routes/deeplink.routes.js`](../backend/server/src/routes/deeplink.routes.js) — the landing page
3. An `intentFilters` `pathPrefix` in `app/app.json` — Android
4. `getDeepLinkRoute` in [`utils/deepLinks.ts`](../app/utils/deepLinks.ts) — the in-app route

Missing 3 or 4 means the link opens a browser. Missing 1 means the same, on iOS
only. After changing 1 or 3, the app has to be rebuilt.

## Privacy

The landing page only renders posts that are `visibility: 'public'` and active,
from an active author. A link can be forwarded to anyone and nothing about an
HTTP request says who is holding it, so a followers-only post gets a neutral
"not available here" page instead. The app, where the viewer is known, decides
whether to show it.
