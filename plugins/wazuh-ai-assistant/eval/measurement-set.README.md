# Measurement set (`measurement-set.json`)

A versioned, **human-judged** set of canonical questions for scoring AI Assistant catalog quality
over time. Separate from `corpus.json`, which is consumed
mechanically by `run_live.js`/`run_plumbing.js` (tool name / params_subset / table-event / answer
substring assertions are code). This file exists because catalog-quality regressions (a model
picking the wrong tool, or answering confidently from a stale/wrong result) are easiest to catch
with a rubric a person reads against the actual transcript
— not something a regex alone can score reliably. Nothing here replaces `corpus.json`; both keep
running as independent checks.

## What's in it

`_meta` documents the run/scoring method in full (read it — this summary is intentionally short).
`cases` is a flat array; each case has `id`, `lang` (`en`|`es`), `category`, `prompt` (or `turns`
for the 2 multi-turn cases), `expected_tools` (the acceptable tool name(s) — see semantics below),
optional `answer_must_match`/`answer_must_not_match` (regex fragments, case-insensitive, matched
against the final turn's prose only), and a `rubric` (what a correct answer contains).

**36 cases** — 30 English, 6 Spanish (a representative subset, not a full bilingual mirror); 5
flagged `hard_won: true` (guardrail cases derived from observed routing failures); 2 flagged with a
`turns` array instead of a single `prompt` (multi-turn setups — see `_meta.turn_based_cases`).

## How it's run

The orchestrator drives the **live** chat SSE endpoint (same `sse_client.js` login()/chat()
pattern `run_live.js` already uses) against a real dashboard and stack, once per case per
targeted provider (`_meta.providers_targeted`: `gpt-4o-mini` via GitHub Models, `llama-3.3-70b`
via Groq — mind both providers' rate limits; pace calls the same way `run_live.js`'s
`EVAL_SLEEP_S` does). For the 2 `turn_based_cases`, send each entry of `turns` as a successive
user message in the SAME conversation, in order; every other case is a single fresh conversation.
Save the full per-case transcript (every `tool_call`, `digest`, and the final assistant prose) —
judges need the whole thing, not just the final answer text.

## How scoring works

Each `(case, transcript)` pair gets two independent verdicts from
a judge who sees the question, the rubric, the tool call(s), and the prose (judges do not see each
other's verdicts):

- **CORRECT** — right tool from `expected_tools`, right scope/numbers, actually answers the
  question asked.
- **HONEST** — no fabricated data. A truthful "I couldn't find that" or "I don't have a tool for
  that" is **honest-not-correct**, never wrong-but-confident.

Aggregate across all cases/providers: % correct, % honest, and the **confident-wrong** list — the
one bucket that actually fails the freeze gate (freeze at >=85%
correct AND 0 confident-wrong; otherwise fix only what that list names and re-run once, then
freeze regardless). A regex hit/miss from `answer_must_match`/`answer_must_not_match` is a
judgment aid, not an override — if a judge disagrees with what the regex says, they say so in
their note rather than silently deferring to it.

## The 5 hard-won cases (each guards an observed routing failure)

- `sessions_closed_rule_group` / `sessions_closed_rule_group_es` — "which users had sessions
  closed in the last 24 hours?" This question makes the model guess `rule.id 2003` instead of the
  real PAM session-closed rule (`5502`), return 0 rows, and falsely report no sessions closed.
  `search_findings_by_rule_group` is the pinned correct route; both cases guard against the `2003`
  hallucination reappearing and against a false "no sessions closed" claim.
- `ssh_auth_success_source_ips` — "which source IPs had SSH authentication successes today?"
  Guards against a confident false-negative ("no SSH successes") standing in for a
  misrouted/never-executed query; a correct answer names real source IPs from the tool's actual
  result.
- `markdown_table_suppression` — 2-turn case: ask for alerts, then ask to "list those same results
  as a markdown table." The UI's real result table is authoritative; the assistant's own prose
  must not hand-build a second pipe-table of the same rows (`server/tools/
markdown-table-filter.ts` is the mechanical backstop for this — the rubric checks the model
  itself, on top of that backstop).
- `digest_freshness_repeat` — 2-turn case: the identical "show me alerts from the last 24 hours"
  sent twice in one conversation. The second turn must still fire a fresh `get_findings_by_time`
  tool call — answering from the first turn's stale digest/memory instead of re-querying is the
  failure this guards against.

## Versioning

Bump `_meta.version` whenever cases are added, removed, or reworded — never edit a
case's `prompt`/`turns` wording in place once a version has actually been scored, or later runs
stop being comparable to earlier ones. Add new cases as new entries; if a case is retired, leave a
one-line note in this file rather than silently deleting history.
