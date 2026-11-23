# Bid Rules — Product Spec

Our customers advertise products on a search-ads platform. They pay when someone clicks their ad.
A **bid rule** looks at recent results and suggests new bids, e.g. *"if a keyword's cost ratio over the
last 7 days is above 35% and it has at least 20 clicks, lower its bid by 15%"*. Users **preview** the
changes, then **apply** them.

You don't need to know anything about advertising. These words are all you need:
- **Campaign**: a group of keywords with a daily budget. It is `enabled` or `paused`.
- **Keyword**: a search term the ad shows for, e.g. "gift for dad". It is `enabled` or `paused`.
- **Bid**: the most we pay for one click on a keyword, in integer cents.
- **Spend / sales**: what the clicks cost us, and the sales they led to, per keyword per day.
- **Cost ratio** = spend ÷ sales, as a ratio (0.25 = 25%). Lower is better.
- **Reporting day**: a calendar day in Los Angeles time (`America/Los_Angeles`), written `YYYY-MM-DD`.
- **Corrected report**: the platform can send a day's numbers again later, with corrections.
  See `DailyMetric.reportedAt`.

**Open points.** Some sections have a list marked **Open: ask Product**. Those are product decisions
nobody has written down yet. Don't guess them: ask your interviewer, who plays Product. The hidden tests
check the answers Product gives.

Types for every request/response are in [`shared/src/index.ts`](../shared/src/index.ts). Error responses
always use the shape in [CONVENTIONS.md](./CONVENTIONS.md#errors).

---

## 1. Campaign performance — `GET /api/campaigns` (exists)

Query: `sort` = `name | spendCents | salesCents | costRatio` (default `name`), `order` = `asc | desc` (default `asc`).

- Window: the 7 full reporting days before today. Today is never included.
- `clicks`, `spendCents`, `salesCents` are totals over the window across all of the campaign's keywords.
- `costRatio` = total spend ÷ total sales over the window. `null` when total sales are 0.
- Sorting: by the given key and order. Campaigns whose sort value is `null` always come **last**, in both
  directions. Ties keep their original order.

## 2. Rule preview — `POST /api/rules/:id/preview`

Computes what a rule *would* change right now. **Never writes anything.**

Response: `PreviewResponse`. Unknown rule → `404 NOT_FOUND`.

**Window** — the `rule.lookbackDays` full reporting days before today (today excluded).
`window` in the response is that range.

**Candidates** — the `enabled` keywords of `rule.campaignId`. If the campaign itself is `paused`,
the response is `200` with no changes.

**Match** — for each candidate, total its metrics over the window. It matches when **both**:
1. `clicks >= rule.minClicks`, and
2. if sales > 0: `spend / sales > rule.costRatioAbove` (strictly greater);
   if sales = 0: it matches only if spend > 0 (spend with no sales is the worst case).

**New bid**
1. The percentage change is capped to ±50% per run, whatever the rule says.
   (`bidChangePct: -70` behaves like `-50`.)
2. `newBid = bid × (100 + pct) / 100`, rounded **half up** to a whole cent.
   Money is integer cents end to end — see CONVENTIONS.
3. Clamp the result to `[rule.minBidCents, rule.maxBidCents]`.
4. If the new bid equals the current bid, the keyword is **not** included in `changes`.

**Output** — one `BidChange` per changed keyword, sorted by `keywordId` ascending. `version` is the
keyword's current version. `costRatio` is `null` when sales are 0.

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
  - Otherwise a table, one row per change: keyword text, clicks, spend, sales, cost ratio, current bid,
    new bid. Money via `formatCents`, cost ratio via `formatRatio` (`—` for null).
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

### New rule form (on the Rules page)
Build it to match the design: [wide screen](./design/new-rule.png) and [phone](./design/new-rule-narrow.png).
  The mock shows the form after the server rejected the maximum bid.
- A **New rule** button opens the form. The form's accessible name is **New rule** (e.g. its heading).
  When it opens, focus moves to the Name field.
- Fields and their exact labels:

  | Label | Sends | Input |
  |---|---|---|
  | `Name` | `name` | text |
  | `Campaign` | `campaignId` | select of all campaigns, by name |
  | `Look back (days)` | `lookbackDays` | whole number |
  | `Minimum clicks` | `minClicks` | whole number |
  | `Cost ratio above (%)` | `costRatioAbove` | percent: `35` sends `0.35`, `12.5` sends `0.125` |
  | `Bid change (%)` | `bidChangePct` | whole number, e.g. `-15` |
  | `Minimum bid ($)` | `minBidCents` | dollars: `1.15` sends `115`, `2` sends `200` |
  | `Maximum bid ($)` | `maxBidCents` | dollars |

- A dollar field must be a number with at most 2 decimals. If it isn't, show `Enter an amount like 1.25`
  as that field's error and don't send the request.
- **Save rule** sends `createRule`. While saving, it's disabled; one submit sends one request.
  Pressing Enter in a field also submits.
- On `VALIDATION_ERROR`, show each message from `fields` under its field. The field gets
  `aria-invalid="true"` and is linked to its message with `aria-describedby`. Focus moves to the first
  invalid field (in the order of the table above). Any other error: show its message with `role="alert"`.
- On success: close the form, add the new rule to the Rule select and select it, and show
  `Rule created.` with `role="status"`.
- **Cancel** closes the form without saving.

### Keywords page (`web/src/pages/KeywordsPage.tsx`) (exists)
- A campaign select labelled **Campaign** and a search box labelled **Search keywords**.
- The table must always show results for the **latest** search input, never an older one.
- When the search box isn't empty, a **Clear search** button empties it and puts focus back in it.
- Status is shown as text (`enabled` / `paused`), not only as a colour.
- Errors are shown with `role="alert"`.
- Follow the accessibility rules in CONVENTIONS. Screen-reader and keyboard users must be able to do
  everything a mouse user can.

## 6. Create rule — `POST /api/rules`

Body `CreateRuleRequest` (a `Rule` without `id`). Response `201` with the created `Rule`; the server
picks a unique `id`. The stored `name` is trimmed. `GET /api/rules` lists rules in the order they were created.

Validation. Any failure → `400 VALIDATION_ERROR` with `fields`: one message per invalid field, keyed by
field name, covering **every** invalid field (not just the first):

| Field | Valid when |
|---|---|
| `name` | 1–60 characters after trimming, and no other rule has the same name (ignoring case and surrounding spaces) |
| `campaignId` | the campaign exists |
| `lookbackDays` | whole number, 1–30 |
| `minClicks` | whole number, 0–10000 |
| `costRatioAbove` | number greater than 0 and at most 10 |
| `bidChangePct` | whole number, −50 to 50, not 0 |
| `minBidCents` | whole number, 2–100000 |
| `maxBidCents` | whole number, 2–100000, and not less than `minBidCents` |

A missing or wrongly typed field is invalid too. Two requests creating the same name at the same moment:
exactly one succeeds.

Example error body:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields are invalid",
  "fields": { "lookbackDays": "Must be a whole number from 1 to 30" } } }
```

## 7. Data table component — `web/src/components/DataTable.tsx`

A reusable table (props are in the file). Once it works, use it for the Keywords page table.
- A `<table>` whose `<caption>` is `caption`.
- **Sorting**: a `sortable` column's header holds a `<button>` with the header text. The first click sorts
  ascending, the next descending, and so on. Clicking another column starts ascending. The sorted `<th>`
  has `aria-sort="ascending"` or `"descending"`; the others have none.
  - Compare by `value(row)`: numbers as numbers; text ignoring case, with numbers inside text compared as
    numbers (`item 2` before `item 10`).
  - `null` always sorts **last**, in both directions. Equal values keep their input order.
  - Never change the `rows` array you were given.
- **Pages**: with more rows than `pageSize` (default 10), show one page at a time. Under the table:
  **Previous page** and **Next page** buttons (disabled on the first and last page) and the text
  `Page X of Y`. Changing the sort goes back to page 1. If `rows` shrinks and the current page no longer
  exists, show the last page.
- **States**:
  - `loading`: the table has `aria-busy="true"` and `Loading…` is shown with `role="status"`. Rows you
    already have stay visible.
  - `error`: show it with `role="alert"` instead of the rows.
  - No rows (and not loading, no error): one row with a single cell spanning every column, showing
    `emptyMessage`.

## 8. Campaigns page: filter and pause

### `PATCH /api/campaigns/:id`
Body `UpdateCampaignRequest`: `{ "status": "enabled" | "paused" }`. Response `200` with the updated `Campaign`.
Invalid body → `400 VALIDATION_ERROR`. Unknown campaign → `404 NOT_FOUND`. `GET /api/campaigns` shows the
new status right away.

### UI (`web/src/pages/CampaignsPage.tsx`)
- A select labelled **Show** with the options `All` (value `all`, the default), `Enabled` and `Paused`.
  It filters the table to campaigns with that status.
- A new **Actions** column. Each row has a button: `Pause` for an enabled campaign, `Resume` for a paused
  one. Its accessible name includes the campaign name, e.g. `Pause Holiday Gifts - SP`.
- The change is sent with `setCampaignStatus` from `api.ts`. While it runs, that row's button is disabled.
  On success the row shows the new status. On error, show the message with `role="alert"`; the row keeps
  its old status.

**Open: ask Product**
- Does pausing (or resuming) need a confirmation step? If yes, what does it say?
- Should the filter and the sort survive a page reload, or a link sent to a teammate?
- With **Show: Enabled**, what happens to a row right after you pause it? How does the user know it worked?

## 9. Edit a bid by hand

### `PATCH /api/keywords/:id`
Body `UpdateBidRequest`: `{ "bidCents": <integer>, "expectedVersion": <positive integer> }`.
Response `200` with the updated `Keyword` (its `version` goes up by one).

Errors, checked in this order:
| Case | Status | `code` |
|---|---|---|
| Invalid body (missing, not integers) | 400 | `VALIDATION_ERROR` |
| Unknown keyword | 404 | `NOT_FOUND` |
| `expectedVersion` isn't the keyword's current version | 409 | `VERSION_CONFLICT` |
| The bid isn't allowed (see the open point below) | 400 | `VALIDATION_ERROR` with a `fields.bidCents` message |

The version check and the write behave as one step, like §3: if two edits (or an edit and a rule apply)
were made against the same version, exactly one succeeds and the other gets `409`.

### UI (Keywords page)
- Each row's bid has an **Edit bid** button. Its accessible name includes the keyword: `Edit bid for gift for dad`.
- It opens an editor in that row: an input labelled `New bid ($)` holding the current bid in dollars
  (e.g. `1.25`), with focus in it, and **Save** and **Cancel** buttons. Only one editor is open at a time.
- Dollars become cents exactly as in the New rule form: at most 2 decimals, otherwise show
  `Enter an amount like 1.25` and send nothing.
- **Save** (or Enter) sends `updateKeywordBid` with the keyword's `version` as `expectedVersion`. While
  saving, Save is disabled; one save sends one request.
- Success: the editor closes, the row shows the new bid, focus goes back to its Edit bid button, and
  `Bid updated.` is shown with `role="status"`.
- **Cancel** or Escape closes the editor without saving and puts focus back on the Edit bid button.
- `VALIDATION_ERROR`: show `fields.bidCents` under the input; the input gets `aria-invalid="true"` and
  `aria-describedby` pointing at the message.

**Open: ask Product**
- Which bids are allowed? Is there a smallest or largest bid, or a limit on how far one edit can move it?
- What should the user see when someone else changed the bid first (`VERSION_CONFLICT`)?
