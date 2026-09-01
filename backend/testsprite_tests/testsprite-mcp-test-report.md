# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** backend (FilmyConnect API)
- **Date:** 2026-09-01
- **Prepared by:** TestSprite AI Team
- **Test Type:** BACKEND
- **Target:** `http://localhost:8777` (local Express server, `filmy_testsprite` database)
- **Scope:** entire codebase

---

## 2️⃣ Requirement Validation Summary

### Requirement: Crowd-funding posts are segregated from the main feed
A post created with `isDonation: true` must be treated as a crowd-funding request: it is
excluded from the personalized feed, but it must still appear in the donations list —
including for the author who raised it.

#### Test TC001 — Create post with isDonation true
- **Test Code:** [TC001_postposts_create_post_with_isdonation_true.py](./TC001_postposts_create_post_with_isdonation_true.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42e7cdcc-6981-53e5-a2e2-57a6f8f2192f/test/75688d7e-12d6-4fae-a311-8c06ef9c6aed
- **Status:** ✅ Passed
- **Analysis / Findings:** The test registers a fresh user, creates a text post with
  `isDonation: true`, then asserts the post is absent from `GET /api/feed` and present in
  `GET /posts/donations`. All four assertions held, confirming the feed filter and the
  donations query agree on the same flag and that an author can see their own request.
  This validates the crowd-fund segregation fix directly. Teardown exercises
  `DELETE /posts/{id}` and `DELETE /users/me`, though its failures are swallowed and so
  carry no assertion weight.

---

## 3️⃣ Coverage & Matching Metrics

- **100.00%** of executed tests passed (1 of 1)

| Requirement                                        | Total Tests | ✅ Passed | ❌ Failed |
|----------------------------------------------------|-------------|-----------|-----------|
| Crowd-funding posts segregated from the main feed   | 1           | 1         | 0         |
| **Total**                                           | **1**       | **1**     | **0**     |

### Coverage against the documented API

| Feature (from `code_summary.yaml`) | Endpoints | Covered by TestSprite |
|------------------------------------|-----------|-----------------------|
| Authentication                     | 7         | 1 (register only)     |
| User Profile                       | 6         | 0 asserted            |
| Posts                              | 5         | 2                     |
| Feed                               | 4         | 1                     |
| Engagement                         | 6         | 0                     |
| Follow Graph                       | 4         | 0                     |
| Communities                        | 9         | 0                     |
| Messaging                          | 4         | 0                     |
| Notifications                      | 4         | 0                     |
| Media                              | 2         | 0                     |
| Wallet and Payments                | 3         | 0                     |
| Moderation                         | 3         | 0                     |
| **Total**                          | **57**    | **4 (7%)**            |

---

## 4️⃣ Key Gaps / Risks

1. **Coverage is 7% of the documented surface.** The generated plan contained a single
   test case against 57 endpoints. This is a plan/tier limit on the TestSprite account,
   not a reflection of the code. Treat the ✅ above as one validated behaviour, not as a
   passing grade for the API.

2. **No negative-path or authorization testing was generated.** Nothing exercised 401,
   403, 404 or 409 handling. That matters here because the largest defect found in this
   round was precisely in that area: 81 status-less `throw new Error(...)` sites across 12
   services were being masked as `500 Internal Server Error`, so genuine permission and
   not-found failures reached clients as blank server errors. TestSprite's plan would not
   have surfaced it.

3. **Untested critical paths.** Account deletion and its cascade, community and group
   membership rules, messaging, engagement counter integrity, and media validation all
   received no coverage.

4. **Service reliability during this run.** Two earlier execution attempts failed on
   TestSprite infrastructure — `503` from the PRD API, and `503 Tunnel client is not
   connected` from the tunnel proxy, with a 15-second probe consuming 17 minutes of wall
   clock. The local server responded `200` on `/health` throughout. The run succeeded on
   retry with no change to code or configuration.

5. **Complementary local suite.** A hand-written suite at `server/tests/api-smoke.mjs`
   (`npm test`) runs 41 assertions across authentication, posts, engagement, the follow
   graph, messaging, notifications, search, communities, wallet and the full
   account-deletion cascade. All 41 pass. It found four defects this round: the masked-500
   sweep, `CastError` on malformed ids returning 500, two authorization paths returning
   500 instead of 403, and user search not matching `username`. Until TestSprite coverage
   is expanded, that suite is the primary regression gate.

---
