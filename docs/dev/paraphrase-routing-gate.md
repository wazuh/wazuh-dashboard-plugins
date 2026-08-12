# Paraphrase routing gate (AI Assistant)

This gate checks the AI Assistant's **stage-1 router**
(`plugins/wazuh-ai-assistant/server/tools/router.ts`): the cheap first model call that picks 1-2
coarse categories (`agents`, `findings`, `vulnerabilities`, `fim`, `sca`, `mitre`, `inventory`,
`compliance`, `security_analytics`, `free_search`, `general`) before the real tool-calling turn.

## What it measures

The router only works well if it keeps routing the **same category** for a question no matter how
the user phrases it. The corpus has 12 canonical questions, each written in 4-5 registers
(canonical, terse, verbose, jargon, non-native/misspelled). The metric is **stage-1 category
agreement**: every paraphrase of a canonical question should route to the same category as its
canonical form.

Corpus file:
`plugins/wazuh-ai-assistant/server/tools/paraphrase-routing-corpus.json`

## Two separate things live here — do not confuse them

1. **Corpus coherence (automated, committed, no LLM call).**
   `plugins/wazuh-ai-assistant/server/tools/paraphrase-routing-corpus.test.ts` runs under
   `yarn test:jest` like any other unit test. It makes no network call and calls no provider. It
   only checks that the corpus file itself is well-formed: every `expect_category` is a real
   category in `router.ts`'s live category enum, every canonical group agrees on one category,
   required fields are present, ids are unique, and no environment hostname or bare IP crept back
   into the questions. This is a regression guard for the corpus, not a test of the router's
   accuracy — it exists so a router category rename (or an accidental un-sanitized edit) fails
   loudly here instead of quietly making the manual run below meaningless.

2. **The actual routing run against a real model (manual, per-release).** Described below. It is
   not automated in this repository today.

## Running the full gate (manual, per release)

The full run sends every question in the corpus through the real stage-1 routing prompt
(`router.ts`'s `buildRoutingPrompt` + `ROUTE_QUESTION_TOOL`) against a real, already-configured
provider, and records which category (or categories) came back for each question.

Requirements:

- A running dashboard with the AI Assistant plugin installed and at least one provider already
  configured (Settings -> AI Assistant -> Providers).
- Enough provider quota/budget for ~60 short tool-calling requests (see measured cost below).

Procedure:

1. Load `paraphrase-routing-corpus.json` and, for each entry, send its `q` text as the user's
   message for a single stage-1 routing call only (i.e. call the router the same way
   `server/routes/chat.ts`'s `orchestrate()` does before stage 2, without going on to execute a
   real tool).
2. Record the category (or categories, since stage 1 may return up to two) returned for each
   question id.
3. Group results by `canonical` and compare against `expect_category`.

There is no committed script that does this end-to-end yet — today it is run by hand (or with a
throwaway script) against a real dashboard, mirroring how `plugins/wazuh-ai-assistant/eval/`'s
`run_live.js` drives its own corpus against a real provider. If you automate this, keep it out of
the Jest suite above (it needs a live provider and costs money) — either extend `eval/` following
its existing pattern, or a similar standalone script.

## Measured baseline (2026-08-06)

- Provider: Bedrock-hosted `gpt-oss-120b`.
- Result: 60/60 paraphrases routed to their canonical's expected category.
- Wall time: approximately 4.5 minutes for the full 60-question run.
- Cost: approximately \$0.06 total for the run.

Treat this as the reference point for future runs, not a hard pass/fail threshold — a different
provider/model may have a different accuracy profile; that is exactly what this gate is meant to
surface.

## Interpreting a failure

- **Functional metric**: did the _expected_ category appear anywhere in the categories stage 1
  returned for that question? Stage 1 can return up to two categories
  (`ROUTE_QUESTION_TOOL.parameters.properties.categories`, `maxItems: 2`), and
  `resolveStage2Tools` unions every routed category's tools before adding the always-on
  `search_wazuh_data` escape hatch. So if the expected category is present in the returned set at
  all, stage 2 still has the right tools available — this is the failure mode that actually matters
  for users.
- **Primary-position ordering** (whether the expected category came back _first_ rather than
  second) is a **stability canary only** — useful for spotting drift in the model's confidence or
  prompt sensitivity between runs — but it has **no runtime effect**, since stage 2 always resolves
  the union of every returned category's tools regardless of order. Do not fail a release over an
  ordering-only regression; do treat a functional (expected category missing entirely) regression
  as a real router problem worth filing.
- If a functional failure reproduces, check first whether `router.ts`'s `CATEGORY_DESCRIPTIONS` for
  the relevant categories still clearly distinguish them (the most common real cause of
  misrouting is two category descriptions becoming ambiguous relative to each other after an
  edit), then whether the corpus itself is still coherent by re-running
  `paraphrase-routing-corpus.test.ts`.
