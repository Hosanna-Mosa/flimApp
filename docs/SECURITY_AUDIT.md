# FilmyConnect — Security Audit

**Date:** 25 August 2026
**Scope:** `backend/` (Express API + Socket.IO), `app/` (Expo / React Native), `admin/` (Vite React panel), plus all config files — `app.json`, `eas.json`, `app.config.js`, `google-services.json`, `.env`, `env.example`, `AndroidManifest.xml`, `.gitignore`, seed scripts.

**Result:** 32 issues found. 9 rated **Critical**, 9 **High**, 10 **Medium**, 4 **Low**.
**21 have been fixed in code during this audit.** The remaining 11 need actions only you can take (rotating credentials, cleaning git history, upgrading packages, setting production env vars).

> ### Do this first — before anything else
> Every production secret in this project is sitting in your public-facing GitHub repo, in plain text, across dozens of commits. **Rotate all of them today.** Details in Finding 1. Fixing the code does not help while an attacker can read your database password.

---

## Table of contents

1. [Route protection audit](#1-route-protection-audit)
2. [Critical findings](#2-critical-findings)
3. [High findings](#3-high-findings)
4. [Medium findings](#4-medium-findings)
5. [Low findings](#5-low-findings)
6. [What was changed](#6-what-was-changed)
7. [Your action checklist](#7-your-action-checklist)

---

## 1. Route protection audit

I enumerated every route in `backend/server/src/routes/` and traced each one to its middleware.

### Before

Most routes were correctly protected. `router.use(auth)` covered wallet, verification, and all five admin route files, and individual routes carried `auth` inline. **12 routes were unauthenticated**, exposing the entire social graph and engagement data to anyone on the internet with no token at all:

| Route | Exposed |
|---|---|
| `GET /api/posts/:id/comments` | All comments on any post |
| `GET /api/comments/:id/replies` | All replies |
| `GET /api/users/:id/comments` | Any user's full comment history |
| `GET /api/users/:id/followers` | Any user's follower list |
| `GET /api/users/:id/following` | Any user's following list |
| `GET /api/posts/:id/likes` | Who liked any post |
| `GET /api/users/:id/liked` | Any user's liked-posts history |
| `GET /api/posts/:id/shares` | Share records |
| `GET /api/users/:id/shares` | Any user's share history |
| `GET /api/posts/:id/share-stats` | Share statistics |
| `GET /api/feed/industry/:industry` | Whole industry feed |
| `DELETE /media/:publicId` | Authenticated, but no ownership check — see Finding 12 |

This let anyone scrape your entire user base and social graph with a script, no account needed. It is also the raw material for building a competitor's user list or for targeted phishing.

### After

**Every route now requires authentication**, with three deliberate, correct exceptions:

- `GET /health` — liveness probe, returns only `{status:'ok'}`
- `POST /auth/*` and `POST /admin/auth/login` — the login endpoints themselves (now rate-limited, see Finding 11)
- `GET|POST /payments/checkout/:token/*` — browser-facing Razorpay checkout. These are correctly public: the 64-character random session token *is* the credential, it is regex-validated, single-purpose, scoped to one order, and expires in 20 minutes.

I verified before locking these down that the mobile app already sends a token on every one of these calls ([app/utils/api.ts](app/utils/api.ts)), so **no app functionality breaks**.

---

## 2. Critical findings

### Finding 1 — Every production secret is committed to git and pushed to GitHub
**Status: ⚠️ NEEDS YOUR ACTION — cannot be fixed in code**

`backend/.env` and `app/.env` are tracked in git and pushed to `github.com/Hosanna-Mosa/flimApp`. The root `.gitignore` only ignored `.env*.local`, never `.env` itself. These files appear in at least 5 commits (`dc8aeeb`, `6f02d1d`, `ef5edf9`, `2f494c0`, `430a0bd`), so they are in the history permanently — deleting them now does not remove them.

Exposed in `backend/.env`:

| Secret | What it unlocks |
|---|---|
| `MONGODB_URI` | **Full read/write to your production database.** Username, password, and cluster hostname. Every user record, message, and wallet balance. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | **Forge a valid login token for any user, including admins.** Complete authentication bypass. |
| `TWILIO_AUTH_TOKEN` + `TWILIO_SID` | Send SMS on your account — run up your bill, send phishing SMS branded as you |
| `RAZORPAY_KEY_SECRET` | Forge payment signatures; read your payment records |
| `CLOUDINARY_API_SECRET` | Read, overwrite, or delete all uploaded media |
| `SMTP_PASS` | Send email as your account |
| `MESSAGE_ENCRYPTION_KEY` | Decrypt every private message in the database |

Worse: **`backend/server/env.example` contained a real, working MongoDB Atlas connection string and a real Cloudinary API secret** — not placeholders. An "example" file is the first place anyone looks. The same live Atlas URI was also hardcoded in `backend/scripts/createAdmin.js` and `backend/server/src/scripts/seed-admin.js`, alongside plaintext admin passwords `adminpassword123` and `admin123`.

**What I fixed:** `.gitignore` in all three projects now excludes `.env`; `env.example` rewritten with placeholders only; both seed scripts now read `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the environment and refuse to run without them (with a 12-character minimum).

**What you must do — in this order:**

1. **Rotate every secret listed above.** Not "change later" — today. Assume all are compromised.
   - MongoDB Atlas: create a new DB user, delete the old one
   - JWT secrets: `openssl rand -hex 32` for each (this logs everyone out — that is intended and desirable)
   - Twilio: rotate the auth token in the console
   - Razorpay: regenerate API keys
   - Cloudinary: regenerate the API secret
   - SMTP: regenerate the app password
   - `MESSAGE_ENCRYPTION_KEY`: note that rotating this makes existing encrypted messages unreadable — plan a migration or accept the loss
2. **Check the repo's visibility.** If `github.com/Hosanna-Mosa/flimApp` is public, treat every secret as already harvested — bots scan GitHub for exactly these patterns within seconds of a push. Make it private regardless.
3. **Stop tracking the files:**
   ```bash
   git rm --cached backend/.env app/.env
   git commit -m "Stop tracking env files"
   ```
4. **Review Atlas access logs** for connections from IPs you do not recognise.
5. Optionally purge history with `git filter-repo` or BFG — but only *after* rotating. Rotation is what actually protects you; history cleanup is hygiene.

---

### Finding 2 — Any user could set their own wallet balance, verified badge, and account status
**Status: ✅ FIXED** — [backend/server/src/services/user.service.js](backend/server/src/services/user.service.js)

`PUT /users/me` passed the raw request body straight into a database update:

```js
return User.findByIdAndUpdate(userId, payload, { new: true })
```

The Joi schema listed only safe profile fields, but [validate.middleware.js](backend/server/src/middlewares/validate.middleware.js) runs Joi with `{ allowUnknown: true }`, which **permits unknown keys and passes them through unchanged**. I confirmed this behaviour by executing the actual schema:

```
Joi error: NONE (validation PASSES)
body reaching findByIdAndUpdate:
  {"name":"x","walletBalance":999999999,"isVerified":true,"status":"active","roles":["admin"]}
```

So any logged-in user could send:

```http
PUT /users/me
Authorization: Bearer <their own normal token>

{ "walletBalance": 999999999, "isVerified": true,
  "verifiedUntil": "2099-01-01", "boostedUntil": "2099-01-01",
  "status": "active" }
```

and instantly give themselves unlimited wallet money, a permanent verified badge, permanent profile boost, and clear any suspension. This is the single most severe application flaw found: it required no special tooling, just one HTTP request from a normal account.

**Fix:** added an explicit `SELF_EDITABLE_FIELDS` allowlist. Everything outside it is stripped before the update. An allowlist (rather than a blocklist) means new sensitive fields added to the User model are safe by default.

---

### Finding 3 — Wallet deposits credited an amount chosen by the client
**Status: ✅ FIXED** — [backend/server/src/controllers/wallet.controller.js](backend/server/src/controllers/wallet.controller.js)

`POST /wallet/deposit/verify` verified the Razorpay signature, then credited `req.body.amount`:

```js
const depositAmount = parseFloat(amount);   // straight from the request body
user.walletBalance = (user.walletBalance || 0) + depositAmount;
```

The signature only proves the `order_id|payment_id` pair is genuine. It says nothing about the amount. So a user could pay ₹1, receive a perfectly valid signature, and replay it with `"amount": 1000000` to credit ₹10,00,000. The same payment could also be submitted repeatedly — there was no replay guard.

**Fix:** the credited amount now comes from `razorpay.orders.fetch()` (`order.amount_paid`), the order must have status `paid`, and a duplicate-reference check rejects any payment ID that has already been credited.

---

### Finding 4 — Negative withdrawals increased your balance
**Status: ✅ FIXED** — [backend/server/src/controllers/wallet.controller.js](backend/server/src/controllers/wallet.controller.js)

```js
if (!user || user.walletBalance < amount) return res.status(400)...
user.walletBalance -= amount;
```

With `amount: -50000`, the guard `balance < -50000` is false, so execution continues to `balance -= -50000` — **adding** ₹50,000. A one-line request minted money. There was also no atomicity, so two concurrent withdrawals could both pass the balance check and overdraw.

**Fix:** amount is coerced with `Number()` and rejected unless finite and `> 0`; the deduction is now a single atomic `findOneAndUpdate` with a `$gte` condition, which also closes the race.

---

### Finding 5 — A magic string granted free paid subscriptions and free wallet top-ups
**Status: ✅ FIXED** — [subscription.controller.js](backend/server/src/controllers/subscription.controller.js), [wallet.controller.js](backend/server/src/controllers/wallet.controller.js)

Both payment verifiers accepted a literal bypass:

```js
const isSimulated = razorpay_signature === 'simulated_success'
                    && process.env.NODE_ENV === 'development';
```

The guard is `NODE_ENV === 'development'` — and **`backend/.env` ships `NODE_ENV="development"`**. If that file is what runs in production (which the committed `.env` strongly suggests), then sending `"razorpay_signature": "simulated_success"` granted a paid verification badge and unlimited wallet credit to anyone, for free.

**Fix:** the bypass is deleted from both controllers. Signature comparison now also uses `crypto.timingSafeEqual` instead of `!==`, removing a timing side-channel.

---

### Finding 6 — Real Razorpay credentials hardcoded as fallbacks in source
**Status: ✅ FIXED** — wallet, subscription, and payment controllers/services

```js
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_Rbm66o8JPEj0P8',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'fbze5Ra1MSS1ExDE5tlszK22',
});
```

A live key/secret pair sitting in committed source. `payment.service.js` and `subscription.controller.js` had the same pattern with `'rzp_test_secret_placeholder'`. That second form is subtler and just as dangerous: if the env var is ever missing, HMAC verification runs against a string that is **published in your repo**, so anyone can compute a valid payment signature and get free subscriptions and wallet credit.

**Fix:** all fallbacks removed. The modules now throw at startup if `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are unset — fail loudly at boot rather than silently accept forged payments. **Rotate these Razorpay keys**, they are in your git history.

---

### Finding 7 — OTP `123456` accepted for any phone number when `NODE_ENV` is unset
**Status: ✅ FIXED** — [backend/server/src/controllers/auth/otp.controller.js](backend/server/src/controllers/auth/otp.controller.js)

```js
const isDev = process.env.NODE_ENV === 'development'
           || !process.env.NODE_ENV                    // ← unset counts as dev
           || process.env.NODE_ENV === 'undefined';
if (isDev && (...)) { if (otp === '123456') verificationCheck = { status: 'approved' }; }
```

Treating an **unset** `NODE_ENV` as development is the dangerous part. Deploy to a host that does not set `NODE_ENV` (very common — bare `node server.js`, many PaaS defaults), let Twilio credentials lapse or hit a 401, and the fallback engages in production: anyone can log in as **any phone number** by entering `123456`. Since `verifyOtp` creates the account if it does not exist, this is total account takeover for every user on the platform.

**Fix:** the bypass now requires an explicit `ALLOW_OTP_BYPASS=true` **and** `NODE_ENV !== 'production'`. An unset `NODE_ENV` no longer enables it. Never set `ALLOW_OTP_BYPASS` on a deployed server.

---

### Finding 8 — Unauthenticated password-guessing oracle
**Status: ✅ FIXED** — [backend/server/src/services/auth.service.js](backend/server/src/services/auth.service.js)

`GET|POST /auth/check-availability` required no authentication and accepted a `password` field, which it bcrypt-compared against the stored hash:

```js
const user = await User.findOne({ phone });
if (user && user.password) {
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) conflicts.add('password');     // ← reports "this password is in use"
}
```

That is a remote password checker with no login required and no rate limit. Feed it a phone number and a wordlist and it tells you when you hit the right password — then use it at `/auth/login-password`. It also confirmed which emails, phones, and usernames are registered, giving a clean user-enumeration list.

The same logic ran in `register()`.

**Fix:** the password comparison is removed from both `checkAvailability` and `register` (the endpoint still does its legitimate job — checking whether a username/email/phone is taken), and the route is now rate-limited to 10 requests per 15 minutes per IP.

---

### Finding 9 — Hardcoded admin credentials in seed scripts
**Status: ✅ FIXED (code) / ⚠️ rotate the accounts**

`backend/scripts/createAdmin.js` created `admin@flimy.com` with password `adminpassword123`, and `backend/server/src/scripts/seed-admin.js` created `admin1@testing.com` with `admin123` — both `SUPER_ADMIN`, both with the live Atlas URI hardcoded, and `createAdmin.js` printed the password to stdout (and therefore into CI logs).

If either account exists in your production database, **anyone who has read the repo can log into your admin panel right now** and suspend users, adjust wallet balances, and approve verifications.

**Fix:** both scripts now require `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the environment, enforce a 12-character minimum, and no longer print the password.

**You must:** check whether `admin@flimy.com` or `admin1@testing.com` exist in production. If so, delete or re-password them immediately.

---

## 3. High findings

### Finding 10 — Suspending or banning a user did nothing
**Status: ✅ FIXED** — [backend/server/src/middlewares/auth.middleware.js](backend/server/src/middlewares/auth.middleware.js)

`adminUser.controller.js` set `status: 'suspended' | 'banned'` on the user document, and the User model defines that enum — but **nothing ever read it**. `auth.middleware.js` only checked that the user existed. A banned user's token kept working exactly as before. Your entire moderation capability was cosmetic.

**Fix:** the middleware now rejects `banned` (403) and `suspended` users, and auto-restores an account once `suspendedUntil` has passed. It also now rejects admin tokens on user routes (see Finding 16).

### Finding 11 — No rate limiting on credential endpoints
**Status: ✅ FIXED** — new [backend/server/src/middlewares/rateLimiters.js](backend/server/src/middlewares/rateLimiters.js)

The global limiter allows **1000 requests per 15 minutes per IP** — far too generous for anything handling credentials. Unprotected: `POST /admin/auth/login` (unlimited admin password guessing, against `admin123`-class passwords), `POST /auth/verify-otp` (OTP brute force), `/auth/forgot-password`, `/auth/reset-password`, `/auth/check-availability`.

**Fix:** admin login, availability check, forgot-password and reset-password now allow 10 attempts / 15 min; OTP verification allows 10 / 10 min.

### Finding 12 — Any user could delete any other user's media
**Status: ✅ FIXED** — [media.controller.js](backend/server/src/controllers/media.controller.js), [media.service.js](backend/server/src/services/media.service.js)

`DELETE /media/:publicId` required a login but never checked ownership — it passed the caller's `publicId` straight to `cloudinary.uploader.destroy()`. Upload signatures scope files to `<type>/<userId>/...`, so public IDs are guessable: any user could wipe another user's photos, videos, and portfolio.

**Fix:** added `MediaService.isOwnedBy()`, which requires the publicId's folder to be a known media type and its second path segment to match the caller's user ID. Non-owners get 403.

### Finding 13 — Private community messages leaked to any logged-in user
**Status: ✅ FIXED** — [backend/server/src/sockets/community.socket.js](backend/server/src/sockets/community.socket.js)

```js
socket.on('join_community', (communityId) => {
  socket.join(`community_${communityId}`);   // no membership check
});
```

The socket connection was authenticated, but joining a room was not authorised. Any logged-in user could emit `join_community` / `join_group` with any ID and silently receive every realtime post and message broadcast to a **private or invite-only** community they were never admitted to. The REST endpoints check membership properly; the socket layer bypassed all of it.

**Fix:** both handlers now verify a `CommunityMember` record before joining and emit `community_error` otherwise. `join_group` needed the community ID to do this, so [app/communities/[id]/groups/[groupId].tsx](app/app/communities/[id]/groups/[groupId].tsx) was updated to send `{ groupId, communityId }`.

### Finding 14 — Support form could mail your server's files to an attacker
**Status: ✅ FIXED** — [backend/server/src/controllers/support.controller.js](backend/server/src/controllers/support.controller.js)

An unvalidated `imageUrl` was handed to nodemailer as an attachment `path`:

```js
} else if (imageUrl) {
  attachmentPath = imageUrl;      // no validation at all
}
attachments.push({ filename: ..., path: attachmentPath });
```

Nodemailer's `path` resolves **local filesystem paths**, not just URLs. Submitting `{"imageUrl": "/proc/self/environ"}` or `"/app/.env"` would attach that server file to the outgoing support email — and since the recipient address was hardcoded, an attacker who also controls that mailbox reads your environment variables. It doubles as an SSRF for internal URLs.

**Fix:** `imageUrl` must now start with `https://res.cloudinary.com/<your-cloud-name>/`; anything else is rejected with 400. Also fixed in the same file: the `reason` field was interpolated raw into the HTML email (now escaped), and the hardcoded recipient `hosannamosa4190@gmail.com` now reads from `SUPPORT_ADMIN_EMAIL`.

### Finding 15 — JWT secrets are guessable words
**Status: ⚠️ NEEDS YOUR ACTION**

The signing secrets are `flimy_app_secret_access` and `flimy_app_secret_refresh` — dictionary-adjacent strings built from the product name. Even without the git leak, these are within reach of an offline brute-force against a single captured token. Anyone who recovers them can forge a token for any user or admin.

**Do:** `openssl rand -hex 32` for each, set via environment (never a committed file). This invalidates all existing sessions — which you want anyway, given Finding 1.

### Finding 16 — Admin and user tokens share one signing secret
**Status: ✅ PARTIALLY FIXED** — [auth.middleware.js](backend/server/src/middlewares/auth.middleware.js)

Both are signed with `JWT_ACCESS_SECRET`; the only separator is an `isAdmin: true` claim. One leaked secret compromises both trust domains at once, and there is no `aud`/`iss` claim to distinguish them structurally.

**Fix applied:** `auth.middleware.js` now rejects any token carrying `isAdmin`, so an admin token can no longer be replayed against user routes.

**Recommended next:** give admin tokens a separate `JWT_ADMIN_SECRET`, and add `iss`/`aud` claims verified on both paths.

### Finding 17 — 20 known vulnerabilities in backend dependencies
**Status: ⚠️ NEEDS YOUR ACTION**

`npm audit --omit=dev` reports **20 vulnerabilities (11 high, 9 moderate)**:

| Package | Severity | Issue |
|---|---|---|
| `ws` 8.0.0–8.20.1 | High | Uninitialised memory disclosure; memory-exhaustion DoS |
| `socket.io-parser` 4.0.0–4.2.6 | High | Unbounded binary attachments; zero-attachment memory exhaustion |
| `express` 4.21.0–4.22.1 → `qs` | Moderate | Prototype-pollution path |
| `uuid` <11.1.1 (via `bull`) | Moderate | Missing buffer bounds check |

The `ws` and `socket.io-parser` issues are directly reachable — you run a public Socket.IO server, so an unauthenticated client can trigger the memory-exhaustion paths and take the API down.

**Do:** run `npm audit fix` (non-breaking for ws / socket.io-parser / express). The `uuid` fix requires downgrading `bull`, so evaluate that one separately.

### Finding 18 — Very long token lifetimes with no revocation
**Status: ⚠️ NEEDS YOUR ACTION**

`backend/.env` sets `JWT_ACCESS_EXPIRES="7d"` and `JWT_REFRESH_EXPIRES="30d"` (the code defaults are a much saner 15m / 7d). Access tokens are stateless and unrevocable, so a stolen token is valid for a full week — and with no server-side denylist, logout cannot cut it short.

**Do:** set `JWT_ACCESS_EXPIRES=15m` and `JWT_REFRESH_EXPIRES=7d`. The app already implements refresh-token rotation, so short access tokens will not hurt UX.

---

## 4. Medium findings

### Finding 19 — CORS opens to every origin in development mode
[app.js](backend/server/src/app.js) allows **any** origin when `NODE_ENV === 'development'`, and [server.js](backend/server/src/server.js) sets Socket.IO `origin: '*'` under the same condition — with `credentials: true`. Since your `.env` ships `NODE_ENV="development"`, a production deploy using that file accepts cross-origin authenticated requests from any website. **Set `NODE_ENV=production` on the server.** This one env var also disarms Findings 5 and 7.

### Finding 20 — Auth tokens stored unencrypted on the device
[app/contexts/AuthContext.tsx](app/contexts/AuthContext.tsx) stores `token` and `refreshToken` in `AsyncStorage`, which is plaintext on disk (a SQLite file on Android, a plist on iOS). On a rooted/jailbroken device, or through any backup extraction, both are readable. **Move them to `expo-secure-store`**, which uses the Android Keystore and iOS Keychain. Keep non-sensitive values (`theme`, `onboarding_complete`) in AsyncStorage.

### Finding 21 — Android allowed full app-data backup
**Status: ✅ FIXED.** `android:allowBackup="true"` let anyone with USB debugging run `adb backup` and extract the app's private data — including the AsyncStorage file holding the auth tokens from Finding 20. Set to `false` in [app/app.json](app/app.json) and [AndroidManifest.xml](app/android/app/src/main/AndroidManifest.xml).

### Finding 22 — API traffic over plaintext HTTP
**Status: ✅ FIXED for release builds.** `app/.env` points at `http://192.168.31.135:8001` and `app.json` `extra.apiUrl` at `http://10.72.192.2:8001`. Over plain HTTP, every request — including the `Authorization: Bearer` header — is readable by anyone on the same Wi-Fi.

Added `"usesCleartextTraffic": false` to `app.json`, so **release builds cannot use HTTP at all**. Your `android/app/src/debug/AndroidManifest.xml` already overrides this for debug builds, so **LAN development still works unchanged**.

**You must:** point `EXPO_PUBLIC_API_URL` at `https://api.filmyconnect24.com` for production builds. Set it as an EAS environment variable per build profile in [app/eas.json](app/eas.json) rather than shipping a committed `.env` — `eas.json` currently defines no `env` block for any profile, so builds silently inherit whatever `.env` is on the build machine.

### Finding 23 — Admin JWT in `localStorage`
[admin/src/hooks/useAuth.tsx](admin/src/hooks/useAuth.tsx) keeps `admin_token` in `localStorage`, readable by any JavaScript on the page — so a single XSS anywhere in the admin panel (or in a dependency) hands over a `SUPER_ADMIN` token. Prefer an `httpOnly` + `Secure` + `SameSite=Strict` cookie. Note also that the panel ships `lovable-tagger` in [vite.config.ts](admin/vite.config.ts); confirm it is dev-only.

### Finding 24 — HTML injection in support emails
**Status: ✅ FIXED.** Covered under Finding 14 — user-supplied `reason`, `name`, and `email` are now HTML-escaped before being interpolated into the admin notification email.

### Finding 25 — Unescaped regex in admin user search
[adminUser.controller.js](backend/server/src/controllers/adminUser.controller.js) builds `{ $regex: search, $options: 'i' }` from raw query input. A crafted pattern (`(a+)+$`) causes catastrophic backtracking and pins the database CPU. Escape regex metacharacters, or use a MongoDB text index.

### Finding 26 — `SYSTEM_ALERT_WINDOW` permission requested
**Status: ✅ FIXED.** The release manifest requested the "draw over other apps" overlay permission, which nothing in the app uses. It is a tapjacking primitive and a common Play Store review flag. Removed from the main manifest; the debug manifest keeps it for the React Native dev overlay.

### Finding 27 — No account lockout or failed-attempt tracking
Rate limiting (Finding 11) is per-IP only. There is no per-account attempt counter, no lockout, and no alerting on repeated failures, so a distributed attempt across many IPs is invisible. Add a failed-attempt counter on the User/Admin document with progressive backoff.

### Finding 28 — Request bodies written to logs
[requestLogger.middleware.js](backend/server/src/middlewares/requestLogger.middleware.js) logs full request bodies, redacting only `password`, `refreshToken`, and `accessToken`. Not redacted: `otp`, `currentPassword`, `newPassword`, `razorpay_signature`, message `content`. Private message text ends up in plaintext logs even though it is encrypted at rest in the database. Widen the redaction list and disable body logging in production.

---

## 5. Low findings

### Finding 29 — Firebase API key in `google-services.json`
`AIzaSyB-TmmYsOQ1MFguhQ-UHlXmhMGM4dUueHE` appears in three copies of the file. This is **expected and not a leak** — Firebase client keys are designed to ship inside app binaries and are identifiers, not secrets. I deliberately did *not* add these files to `.gitignore`, since doing so risks breaking EAS Android builds for no security gain. Do apply Application Restrictions (Android package + SHA-1) in the Google Cloud console, and note the duplicate at `app/components/google-services.json` serves no purpose and can be deleted.

### Finding 30 — Generic deep-link scheme `myapp://`
`app.json` sets `"scheme": "myapp"`. Any other app can register the same scheme and intercept links — including the payment-return deep links carrying `sessionId`. Change it to something unique, e.g. `filmyconnect://`. The payment service already allowlists `filmyconnect://`, so the backend is ready for the switch.

### Finding 31 — Global rate limit too permissive
1000 requests / 15 min per IP is high enough to permit sustained scraping and enumeration on ordinary endpoints. Consider 200–300 for general traffic now that credential endpoints have their own tighter limits.

### Finding 32 — `debug.keystore` committed
`app/android/app/debug.keystore` is tracked. This is the standard shared Android debug key, so it is not a production risk — but confirm no **release** keystore ever lands in the repo. The root `.gitignore` now excludes `*.keystore` and `*.jks` for new files.

---

## 6. What was changed

All changes are in the working tree, unstaged. Nothing has been committed or pushed.

**Backend — route protection**
- `routes/comment.routes.js`, `like.routes.js`, `share.routes.js`, `follow.routes.js`, `feed.routes.js` — added `auth` to 11 previously public routes
- `middlewares/rateLimiters.js` *(new)* — shared limiters for credential endpoints
- `routes/adminAuth.routes.js`, `routes/v1/auth.routes.js`, `routes/auth.routes.js` — applied those limiters

**Backend — authentication & authorisation**
- `middlewares/auth.middleware.js` — enforce suspended/banned status; reject admin tokens on user routes
- `services/user.service.js` — `SELF_EDITABLE_FIELDS` allowlist closes the mass-assignment hole
- `services/auth.service.js` — removed the password oracle from `checkAvailability` and `register`; removed a `User.find({})` full-table scan that ran on every login
- `services/media.service.js`, `controllers/media.controller.js` — ownership check before Cloudinary deletion
- `sockets/community.socket.js` — membership check before joining community/group rooms

**Backend — payments**
- `controllers/wallet.controller.js` — amount from Razorpay not the client; replay guard; positive-amount validation; atomic deduction; removed hardcoded keys
- `controllers/subscription.controller.js` — removed `simulated_success` bypass and placeholder secrets; timing-safe signature comparison
- `services/payment.service.js`, `controllers/payment.controller.js` — removed placeholder secret fallbacks; `PUBLIC_BASE_URL` now required in production (the `Host`-header fallback was spoofable)

**Backend — other**
- `controllers/support.controller.js` — Cloudinary-only attachment URLs; HTML escaping; configurable admin recipient
- `scripts/createAdmin.js`, `server/src/scripts/seed-admin.js` — credentials from environment, minimum length enforced, password no longer printed
- `server/env.example` — real credentials replaced with placeholders

**App**
- `app.json` — `allowBackup: false`, `usesCleartextTraffic: false`
- `android/app/src/main/AndroidManifest.xml` — same, plus removed `SYSTEM_ALERT_WINDOW`
- `app/communities/[id]/groups/[groupId].tsx` — sends `communityId` with `join_group`

**Config**
- `.gitignore`, `app/.gitignore`, `backend/.gitignore` — exclude `.env`, keystores, service-account files

**Verification performed**
- `node --check` passes on all 21 modified backend files
- Full app boot test: `app.js`, all routes, and both socket handlers load without error
- Route sweep confirms no unintentionally unauthenticated route remains
- App typecheck shows no new errors (10 pre-existing errors elsewhere in the codebase are untouched)

### Two behaviour changes worth knowing

1. **The signup form no longer warns "this password is already registered."** That warning was the password oracle in Finding 8 — it told an anonymous caller when a guess was correct. The UI handles its absence gracefully (it renders whatever fields the API returns), so nothing breaks visually.
2. **The backend now refuses to start without `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.** This is deliberate: the previous behaviour was to fall back to a secret published in your repo, which silently accepted forged payments. Failing at boot is the safe direction.

---

## 7. Your action checklist

**Today**
- [ ] Rotate all 7 credentials from Finding 1 (Mongo, both JWT secrets, Twilio, Razorpay, Cloudinary, SMTP, message key)
- [ ] Check whether the GitHub repo is public; make it private
- [ ] `git rm --cached backend/.env app/.env`
- [ ] Delete or re-password `admin@flimy.com` and `admin1@testing.com` if they exist in production
- [ ] Set `NODE_ENV=production` on the server — this alone disarms Findings 5, 7, and 19

**This week**
- [ ] `npm audit fix` in `backend/` (Finding 17)
- [ ] `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES=7d` (Finding 18)
- [ ] Point `EXPO_PUBLIC_API_URL` at `https://api.filmyconnect24.com`; move build env vars into `eas.json` profiles (Finding 22)
- [ ] Set `PUBLIC_BASE_URL` and `SUPPORT_ADMIN_EMAIL` on the server
- [ ] Review MongoDB Atlas access logs for unfamiliar IPs
- [ ] Restrict the Firebase API key in Google Cloud console (Finding 29)

**This month**
- [ ] Move app tokens to `expo-secure-store` (Finding 20)
- [ ] Move the admin token to an httpOnly cookie (Finding 23)
- [ ] Separate `JWT_ADMIN_SECRET` with `iss`/`aud` claims (Finding 16)
- [ ] Escape regex input in admin search (Finding 25)
- [ ] Per-account lockout on repeated failures (Finding 27)
- [ ] Widen log redaction; disable body logging in production (Finding 28)
- [ ] Change the deep-link scheme from `myapp://` (Finding 30)

---

## Closing note

The architecture here is sound — Helmet, `express-mongo-sanitize`, Joi validation, bcrypt, AES-256-GCM message encryption, atomic balance deduction in `boostProfile`, and correctly-scoped Cloudinary upload signatures are all in place. The new `payment.service.js` in your working tree is genuinely well-built: server-derived amounts, timing-safe comparison, idempotent fulfilment, a return-URL allowlist, and proper raw-body webhook verification. Post and comment ownership checks are correct, community role enforcement is correct, and public endpoints select only non-PII fields.

The problems were concentrated in three places: **committed secrets**, **money-handling logic that trusted the client**, and **development shortcuts guarded by conditions that fail open in production**. That last pattern is the one worth internalising — `!process.env.NODE_ENV` counting as "development" and `NODE_ENV === 'development'` being what your committed `.env` actually sets turned three separate debug conveniences into production authentication and payment bypasses.

Nothing here is committed. Review the diff, then commit when you are satisfied.
