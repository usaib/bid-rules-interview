// Claude Code runs this before every prompt (see .claude/settings.json) and adds the text below
// to the model's context. It repeats the AGENTS.md rule each turn, because small models tend to
// forget a rule they only saw once at the start. Part of the interview setup: leave it as it is.
process.stdout.write(
  'Interview rule (AGENTS.md), applies to this prompt: work on ONE README task only. ' +
    'If this prompt asks for more than one task (for example "do all the tasks"), say you take them ' +
    'one at a time, do only the first task it asks for, then stop and ask which task is next. ' +
    'Do not start a second task in this turn.\n',
);
