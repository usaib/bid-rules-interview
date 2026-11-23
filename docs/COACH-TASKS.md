# Coach-mode interview: your tasks

Use this page only if your interviewer told you this is a **coach-mode** interview. Otherwise follow
the task list in the README.

In coach mode your AI assistant is a coach. It can read the code, explain it, point you to the right
place and review what you wrote. It **can't edit files or run commands**, and it won't write the
solution for you. You write the code and run the tests.

Setup is different too: your interviewer gives you four lines to paste into your terminal before
you start `claude`. You don't need your own Anthropic account, and the model is set for you.

## Tasks (40 minutes, top to bottom)

Three tasks, sized so most engineers can finish them in about an hour by hand. **You're not
expected to finish all three in 40 minutes.** Correct and tested beats fast. Skip the other README
tasks and the change request.

### 1 · MUST: Fix support ticket SUP-1432 (backend)

The ticket and hint are in the README, task 1. In short: the cost ratio on the Campaigns page is
wrong, and sorting by cost ratio or spend doesn't work. There's more than one cause.

💡 *Hint: one of the existing tests passes even though the code is wrong. The SPEC glossary matters.*

```bash
npm test -w server -- campaigns.test
```

### 2 · MUST: Rule preview (`POST /api/rules/:id/preview`), SPEC §2 (backend)

Implement `server/src/services/rulesEngine.ts` (the route already calls it). SPEC §2 has every rule: which
keywords are candidates, when one matches, how the new bid is worked out.

💡 *Hint: read SPEC §2 line by line and turn each rule into a check. Ask your coach to explain any
helper you're unsure about.*

```bash
npm test -w server -- rules.preview
```

### 3 · SHOULD: Campaigns page: filter and pause, simple version, SPEC §8 (full stack)

A small UI task:

- `PATCH /api/campaigns/:id` in `server/src/routes/campaigns.ts` (body `{ "status": "enabled" | "paused" }`).
- On `web/src/pages/CampaignsPage.tsx`: the **Show** select (All / Enabled / Paused), and an
  **Actions** column with a Pause or Resume button per row, sent with `setCampaignStatus`.
- The button is disabled while saving. On error, show the message with `role="alert"` and keep the
  old status.

SPEC §8 lists the exact labels. Its **Open: ask Product** points are optional here: if you have time
left, ask us and build what we answer.

```bash
npm test -w server -- campaigns.status
npm test -w web -- CampaignsFilter
```

## Tips

- Run the tests yourself often. Paste a failure into the chat and ask your coach what it means.
- Ask "where is…", "how does… work", "why does this test fail": that's what the coach is good at.
- Commit as you go. At the end, push your `solution` branch and open a pull request into `main`.
