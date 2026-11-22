# Engineering conventions

These apply to all code in this repo. Reviewers check them.

## Money
- Money is **always integer cents** (`number`, named `...Cents`). Never dollars, never floats.
- Do arithmetic on integers. If you need a percentage of a cent amount, multiply first, divide last,
  and round explicitly.
- Format for display only at the edge, with `web/src/format.ts`.

## Time and dates
- Server code reads the current time **only** through `now()` from `server/src/clock.ts`
  (tests freeze it with `setNowForTests`). Don't call `new Date()` / `Date.now()` for "now".
- Reporting dates are marketplace days (`America/Los_Angeles`) formatted `YYYY-MM-DD`.
  Use the helpers in `server/src/dates.ts`. Don't use `toISOString()` to get "today".

## Errors
- Every error response has this shape:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "human readable" } }
  ```
  Codes: `NOT_FOUND`, `VALIDATION_ERROR`, `VERSION_CONFLICT`, `NOT_IMPLEMENTED`, `INTERNAL`.
- Throw `HttpError` (or `notFound(...)`) from `server/src/errors.ts`; the error middleware formats it.
- Validate request input with zod through `validate(schema, value)`, which throws a 400 `VALIDATION_ERROR`.
- Express 5 forwards errors from `async` handlers automatically; no try/catch needed in routes.

## Data access
- Go through `db` in `server/src/db.ts`. Don't touch its internal state.
- Every `db` call is one query with real async latency. Avoid per-row queries in loops (N+1);
  use the batch methods (`findByIds`, `findByKeywords`, ...).
- Objects returned by `db` are copies. Changing them changes nothing; use `db.keywords.update`.
- `db.keywords.update` bumps `version` for you.

## Shared contract
- Request/response types live in `shared/src/index.ts` and are shared by server and web.
  Don't redefine them locally. Use `import type`.

## Frontend
- All HTTP calls go through `web/src/api.ts`. Components never call `fetch`.
- `ApiError` carries `status` and `code`; branch on `code`, not on message text.
- Use accessible markup: real `<label>`s, `<button>`s, `<table>`s, `role="alert"` for errors,
  `role="status"` for success messages.

## Tests
- Vitest everywhere. Server tests use supertest against `createApp()` and `loadDataset(...)` fixtures.
- **Don't modify or delete existing tests or test config.** Add new tests freely.
