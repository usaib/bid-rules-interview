// Claude Code runs this before every prompt (see .claude/settings.json) and adds the text below
// to the model's context. It repeats the AGENTS.md rule each turn, because small models tend to
// forget a rule they only saw once at the start. Part of the interview setup: leave it as it is.
process.stdout.write(
  'Interview rule (AGENTS.md), applies to this prompt: work on ONE README task only. ' +
    'If this prompt asks for more than one task (for example "do all the tasks"), say you take them ' +
    'one at a time, do only the first task it asks for, then stop and ask which task is next. ' +
    'Do not start a second task in this turn. ' +
    'When you start a new task, first ask the candidate up to three short clarifying questions about what to build (edge cases, unclear behaviour; not about your process) and wait; ' +
    'once they have answered, build it. Never decide a point the SPEC marks "Open: ask Product": ' +
    'tell the candidate to ask the interviewer.\n',
);
