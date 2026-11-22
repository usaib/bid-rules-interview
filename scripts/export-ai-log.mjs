#!/usr/bin/env node
/**
 * Copies your AI assistant's chat history FOR THIS REPO ONLY into ./ai-logs so it can be
 * committed with your solution. Supports Claude Code and OpenAI Codex CLI.
 *
 *   npm run ai-log
 *
 * Only sessions whose working directory is this repo (or a folder inside it) are copied.
 * Nothing is uploaded anywhere; review ./ai-logs before you commit if you like.
 */
import { copyFileSync, existsSync, mkdirSync, openSync, readSync, closeSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outDir = join(repoRoot, 'ai-logs');
// `"cwd":"/path/to/repo` — matches the repo root and any folder inside it.
const cwdNeedle = `"cwd":${JSON.stringify(repoRoot).slice(0, -1)}`;

function head(file, bytes = 512 * 1024) {
  const fd = openSync(file, 'r');
  const buf = Buffer.alloc(Math.min(bytes, statSync(file).size));
  readSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
  return buf.toString('utf8');
}

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.name.endsWith('.jsonl')) yield p;
  }
}

function modelsIn(file) {
  const models = new Map();
  const visit = (v) => {
    if (Array.isArray(v)) return v.forEach(visit);
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v)) {
        if (k === 'model' && typeof val === 'string' && val && !val.startsWith('<')) models.set(val, (models.get(val) ?? 0) + 1);
        else visit(val);
      }
    }
  };
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    try { visit(JSON.parse(line)); } catch {}
  }
  return models;
}

const sources = [
  { tool: 'claude-code', dirs: [join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'), 'projects')] },
  {
    tool: 'codex',
    dirs: ['sessions', 'archived_sessions'].map((d) => join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), d)),
  },
];

mkdirSync(outDir, { recursive: true });
const found = [];
for (const { tool, dirs } of sources) {
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      if (!head(file).includes(cwdNeedle)) continue;
      const dest = join(outDir, `${tool}--${basename(file)}`);
      copyFileSync(file, dest);
      found.push({ tool, dest, models: modelsIn(dest) });
    }
  }
}

if (found.length === 0) {
  console.log('No Claude Code or Codex sessions found for this folder.');
  console.log('Using Cursor? Export each chat (chat menu → Export) as Markdown into ./ai-logs/ instead.');
  process.exit(0);
}

const allModels = new Map();
for (const f of found) for (const [m, n] of f.models) allModels.set(m, (allModels.get(m) ?? 0) + n);
console.log(`Copied ${found.length} session(s) into ai-logs/:`);
for (const f of found) console.log(`  ${f.tool.padEnd(12)} ${basename(f.dest)}`);
console.log(`Models seen: ${[...allModels.keys()].join(', ') || 'none'}`);
console.log('\nNow commit them:  git add ai-logs && git commit -m "AI session logs"');
