# Bid Rules — Xnurta Full-Stack Interview

You'll work on a small but real-shaped web app for online ads: a campaign dashboard plus a **bid rules
engine** that suggests and applies new bids. No advertising knowledge needed: the SPEC explains the
few terms in plain words.

**Stack:** Node 22 · TypeScript · Express 5 · Zod · React 18 · Vite · Vitest. No database to install;
`server/src/db.ts` is an async in-memory store.

You'll use **your own AI coding assistant** (rules below). We're assessing how you work *with* it:
how you break the problem down, steer it, check its output and catch its mistakes. Not how much you type.

---

## Before the interview (≈10 min, do this the day before)

1. Click **Use this template → Create a new repository**. Make it **Private** and add the GitHub
   user we send you as a collaborator.
2. Set up **one** of these:
   - **GitHub Codespaces (easiest):** in your new repo, **Code → Codespaces → Create codespace**.
     Node, Claude Code and Codex CLI install automatically.
   - **Your machine:** install Node 22 (`nvm use` reads `.nvmrc`), clone your repo, then:
     ```bash
     npm ci
     npm run check        # must end with ✅ Environment ready
     ```
3. Make sure your AI assistant works in this folder with the model below.

## AI assistant rules

Use **one** of these small, fast models (Claude Haiku 4.5 preferred):

| Tool | Model | How | At the start, show us |
|---|---|---|---|
| **Claude Code** | Claude Haiku 4.5 | `claude --model claude-haiku-4-5` (already the default in this repo) | run `/status` |
| **OpenAI Codex CLI** | GPT-6 Luna, **Low** reasoning | `codex -m gpt-6-luna -c model_reasoning_effort=low`, or `/model` → gpt-6-luna → Low | run `/status` |
| **Cursor** | Claude Haiku 4.5 or GPT-6 Luna | pick it in the chat's model picker; **turn off Auto** and Max mode | the model picker |

- Don't switch models or raise the reasoning effort during the interview.
- No other AI help: no ChatGPT/Claude in a browser, no Copilot or Cursor Tab autocomplete on top of
  your main assistant.
- Share your **whole screen** for the full hour.
- `AGENTS.md` / `CLAUDE.md` give your assistant some interview ground rules. Leave them as they are.
- At the end you'll export your AI chat history into the repo (see [Rules](#rules)). We read it to
  see how you worked with the AI, so think out loud in your prompts.

## Running things

```bash
npm run dev           # API on :4000, web on http://localhost:5173
npm test              # all tests (server + web)
npm run test:server   # just server   (npm run test:watch -w server for watch mode)
npm run test:web      # just web
npm run typecheck
```

## Read first (5 min)

- [`docs/SPEC.md`](docs/SPEC.md): **the source of truth.** Hidden tests check exactly what it says.
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md): how we write code here (money, time, errors, data access).
- [`shared/src/index.ts`](shared/src/index.ts): API types shared by server and web.

---

## Your tasks (≈45 min, plus a change request)

Work top to bottom. **Nobody is expected to finish everything.** A clean, correct Must + Should beats
a rushed attempt at all of it. Each task has a one-line hint. There's backend, frontend and both.

### 1 · MUST — Fix support ticket SUP-1432 (backend)
> "The cost ratio on the Campaigns page doesn't match the ad platform's report for *Holiday Gifts - SP*
> or *Kitchen Essentials*. It's off by even more when I check in the evening. Also, sorting the table by
> cost ratio (or spend) doesn't seem to do anything."

There's a failing test for one part of it. Fix the root causes, not the symptoms. There's more than one.
💡 *Hint: one of the existing tests passes even though the code is wrong. Ask yourself why.*

### 2 · MUST — Rule preview (`POST /api/rules/:id/preview`): SPEC §2 (backend)
Implement `server/src/services/rulesEngine.ts`.
💡 *Hint: the code that's already here isn't guaranteed to be right, and neither is your assistant's.*

### 3 · SHOULD — Rule apply (`POST /api/rules/:id/apply`): SPEC §3 (backend)
Wire up the route and the logic (add files under `server/src/services/` as you like).
💡 *Hint: bad Wi-Fi sends the same request twice. Busy teams have the same page open in two tabs.*

### 4 · SHOULD — Rules page: preview and apply: SPEC §5 (frontend)
Finish `web/src/pages/RulesPage.tsx`: preview table, empty state, Apply with all its states.
💡 *Hint: users double-click, networks fail, and someone else edits bids while you're looking.*

### 5 · SHOULD — New rule form: SPEC §5 and §6 (full stack)
`POST /api/rules` on the server, and a form on the Rules page that matches the design in
[`docs/design/`](docs/design/) on a laptop and on a phone.
💡 *Hint: dollars typed by a person must become exact cents. A form is for keyboard and screen-reader users too.*

### 6 · STRETCH — Reusable data table: SPEC §7 (frontend)
Finish `web/src/components/DataTable.tsx` (sorting, pages, loading / empty / error), then use it on the Keywords page.
💡 *Hint: what happens to `null`, to "item 10", and to the array you were given?*

### 7 · STRETCH — Keywords page (frontend + backend)
It doesn't follow our accessibility rules, the listing gets slow on big campaigns, and search results
sometimes "jump back" to an older query.
💡 *Hints: try it with only a keyboard. Count your queries. Responses don't always arrive in the order you sent them.*

### 8 · Change request (around minute 30)
We'll hand you a small change request partway through, like a product manager would. Decide where it
fits in your plan and tell us.

---

## Rules

- **Don't edit or delete existing tests or test config.** They're restored before grading. You're
  welcome to **add** tests.
- We run **additional hidden tests** based on `docs/SPEC.md`. Passing the visible tests isn't the finish line.
- Commit as you go. At the end, export your AI history and push:
  ```bash
  npm run ai-log        # copies this repo's Claude Code / Codex sessions into ai-logs/
  git checkout -b solution && git add -A && git commit -m "Interview solution" && git push -u origin solution
  ```
  Then open a pull request from `solution` into `main` in your repo and send us the link.
  Using Cursor? Export each chat as Markdown into `ai-logs/` before committing.
- Last 10 minutes: a short chat about what you built, the trade-offs, and what the AI got wrong.

## Repo map

```
shared/src/index.ts            API contract (types only)
server/src/
  app.ts                       Express app + routes
  db.ts                        async in-memory DB (query-counted)
  clock.ts, dates.ts           "now" + reporting dates (LA time); always use these
  errors.ts                    HttpError, validate(), error format
  sort.ts                      generic sort helper
  routes/                      campaigns, keywords, rules
  services/                    metrics, rulesEngine (← you)
server/test/                   visible tests + fixtures
web/src/
  api.ts                       typed API client (all fetches go here)
  format.ts                    money / cost ratio formatting
  pages/                       CampaignsPage, RulesPage (← you), KeywordsPage
  components/DataTable.tsx     reusable table (← you, stretch)
docs/                          SPEC.md, CONVENTIONS.md, design/ (New rule form mock)
AGENTS.md, CLAUDE.md           ground rules for your AI assistant (don't edit)
scripts/export-ai-log.mjs      `npm run ai-log`
```

Good luck. Think out loud, it helps us.
