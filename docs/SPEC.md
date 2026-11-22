# Bid Rules — Product Spec

Xnurta customers run Amazon Sponsored Products campaigns. A **bid rule** looks at recent keyword
performance and proposes bid changes, e.g. *"if a keyword's ACoS over the last 7 days is above 35%
and it has at least 20 clicks, lower its bid by 15%"*. Users **preview** the changes, then **apply** them.

Glossary
- **ACoS** (Advertising Cost of Sale) = ad spend ÷ ad sales, as a ratio (0.25 = 25%). Lower is better.
- **Bid** = the max cost-per-click for a keyword, in integer cents.
- **Marketplace day** = a calendar day in `America/Los_Angeles` (Amazon US reporting time).
- **Restatement**: Amazon can re-send a day's numbers. See `DailyMetric.reportedAt`.

Types for every request/response are in [`shared/src/index.ts`](../shared/src/index.ts). Error responses
always use the shape in [CONVENTIONS.md](./CONVENTIONS.md#errors).

---

## 1. Campaign performance — `GET /api/campaigns` (exists)

Query: `sort` = `name | spendCents | salesCents | acos` (default `name`), `order` = `asc | desc` (default `asc`).

- Window: the 7 full marketplace days before today. Today is never included.
- `clicks`, `spendCents`, `salesCents` are totals over the window across all of the campaign's keywords.
- `acos` = total spend ÷ total sales over the window. `null` when total sales are 0.
- Sorting: by the given key and order. Campaigns whose sort value is `null` always come **last**, in both
  directions. Ties keep their original order.

## 2. Rule preview — `POST /api/rules/:id/preview`

Computes what a rule *would* change right now. **Never writes anything.**

Response: `PreviewResponse`. Unknown rule → `404 NOT_FOUND`.

**Window** — the `rule.lookbackDays` full marketplace days before today (today excluded).
`window` in the response is that range.

**Candidates** — the `enabled` keywords of `rule.campaignId`. If the campaign itself is `paused`,
the response is `200` with no changes.

**Match** — for each candidate, total its metrics over the window. It matches when **both**:
1. `clicks >= rule.minClicks`, and
2. if sales > 0: `spend / sales > rule.acosAbove` (strictly greater);
   if sales = 0: it matches only if spend > 0 (spend with no sales is the worst case).

**New bid**
1. The percentage change is capped to ±50% per run, whatever the rule says.
   (`bidChangePct: -70` behaves like `-50`.)
2. `newBid = bid × (100 + pct) / 100`, rounded **half up** to a whole cent.
   Money is integer cents end to end — see CONVENTIONS.
3. Clamp the result to `[rule.minBidCents, rule.maxBidCents]`.
4. If the new bid equals the current bid, the keyword is **not** included in `changes`.

**Output** — one `BidChange` per changed keyword, sorted by `keywordId` ascending. `version` is the
keyword's current version. `acos` is `null` when sales are 0.

## 3. Rule apply — `POST /api/rules/:id/apply`

Applies a previewed rule. The client sends the versions it saw in the preview so we never apply
changes the user didn't approve.

Request
- Header `Idempotency-Key`: required, 1–100 characters.
- Body `ApplyRequest`: `{ "expectedVersions": { "<keywordId>": <positive integer version>, ... } }`

Errors (checked in this order)
| Case | Status | `code` |
|---|---|---|
| Missing/invalid `Idempotency-Key` | 400 | `VALIDATION_ERROR` |
| Invalid body | 400 | `VALIDATION_ERROR` |
| Unknown rule | 404 | `NOT_FOUND` |
| Data changed since preview (below) | 409 | `VERSION_CONFLICT` |

**Behaviour**
1. Recompute the preview (§2) at apply time.
2. It's a conflict if **any** of these is true:
   - a keyword in the fresh preview is missing from `expectedVersions`, or its version differs;
   - a keyword in `expectedVersions` no longer exists, or its current version differs.
3. On conflict nothing is written (**all or nothing**).
4. Otherwise update each changed keyword's bid. The database bumps `version` on every write.
   Respond `200` with `ApplyResponse` (`applied` in the same order as the preview).

**Idempotency** — the same `Idempotency-Key` for the same rule must give the same result as the first
request with that key, and must **never** apply changes twice:
- A later retry returns the first request's status and body (both `200` and `409` results are replayed).
- This includes a retry that arrives **while the first request is still running**.
- `400` and `404` responses are not stored (nothing ran).

**Overlapping applies** — two applies can run at the same moment with *different* keys (two tabs, two
teammates, two rules on the same campaign). The version check and the writes must behave as one step:
if both were approved against the same keyword versions, exactly one succeeds and the other gets `409`.

## 4. Keyword listing — `GET /api/campaigns/:campaignId/keywords?q=` (exists)

- Returns the campaign's keywords with 7-day totals (same window as §1); `404` for an unknown campaign.
- `q` filters by case-insensitive substring of `text`.
- Must make a bounded number of database queries no matter how many keywords a campaign has.

## 5. Web UI

### Rules page (`web/src/pages/RulesPage.tsx`)
- A select labelled **Rule** lists all rules; the first is selected by default. Changing the selection
  clears any preview, message and error.
- **Preview** button calls `previewRule`. While loading it is disabled.
- Preview result:
  - If there are no changes, show exactly: `No keywords match this rule.`
  - Otherwise a table, one row per change: keyword text, clicks, spend, sales, ACoS, current bid,
    new bid. Money via `formatCents`, ACoS via `formatAcos` (`—` for null).
- An **Apply** button (label starts with "Apply") appears when there are changes. It calls `applyRule`
  with `expectedVersions` built from the preview (`keywordId → version`) and an idempotency key.
  - **One key per preview**: retrying the same preview (e.g. after a network error) reuses the key;
    a new preview gets a new key.
  - While applying, the button is disabled. Apply must never be sent twice for one click sequence.
  - Success: show `Applied N bid changes.` (`Applied 1 bid change.` for one) in an element with
    `role="status"`, and hide the Apply button.
  - `VERSION_CONFLICT`: show exactly `Bids changed since preview. Please preview again.` with
    `role="alert"`; Apply stays disabled until the user previews again.
  - Any other error: show the error message with `role="alert"`; Apply is enabled again for a retry.
- Preview errors are also shown with `role="alert"`.

### Keywords page (`web/src/pages/KeywordsPage.tsx`) (exists)
- Campaign select + **Search keywords** input. The table must always show results for the
  **latest** search input, never an older one.
