# AI Assistant eval harness

Plain Node 18 scripts, CommonJS, zero npm dependencies (global `fetch` + Node built-ins only).
Nothing here touches the plugin's build, `package.json`, or any file outside `eval/`.

Five independent modes:

| Mode                        | Script                                 | Needs                                         | Costs tokens? |
| --------------------------- | -------------------------------------- | --------------------------------------------- | ------------- |
| Live provider eval          | `run_live.js`                          | a real dashboard + a real configured provider | yes           |
| Plumbing regression         | `run_plumbing.js` + `mock_provider.js` | a real dashboard, no real LLM                 | no            |
| Guardrail unit tests        | `run_lint.js`                          | a compiled `guardrails.js`                    | no            |
| Multi-turn measurement eval | `run_multiturn.js`                     | a real dashboard + a real configured provider | yes           |
| (shared helper)             | `sse_client.js`                        | —                                             | —             |

## 0. Common setup: TLS and login

The target dashboard (`https://localhost:8443` by default) uses a self-signed certificate. Node's
global `fetch` will refuse it unless you disable certificate verification for the process. Do this
in your shell, not in code — disabling certificate verification is an operator decision and must
never be committed:

```bash
# bash / git-bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

```powershell
# PowerShell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
```

`sse_client.js`'s `login()` performs the same two-step flow a browser session does
(`POST /auth/login {username,password}` then `POST /api/login {"idHost":"default"}`), accumulating
cookies across both, and sends `osd-xsrf: true` on every non-GET request (OSD's CSRF guard). It
never sets `NODE_TLS_REJECT_UNAUTHORIZED` itself.

## 1. Live provider eval (`run_live.js`)

Sends every case in `corpus.json` (EN and/or ES) through a real, already-configured provider
against a real dashboard + AIO VM, and checks each case's `expect` block: which tool got called
(and with what params), whether a `table` StreamEvent came back, and any required/forbidden
substrings in the answer text. See `corpus.json`'s own `_meta` block for the exact assertion
semantics.

You need a provider already registered in the dashboard (Settings -> AI Assistant -> Providers, or
`POST /api/wazuh_ai_assistant/providers`) and its saved-object id.

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
export EVAL_PASS='...'
export EVAL_PROVIDER_ID='...'          # id of an already-registered provider
node run_live.js
```

### Env vars

| Var                | Default                  | Notes                                                          |
| ------------------ | ------------------------ | -------------------------------------------------------------- |
| `EVAL_BASE_URL`    | `https://localhost:8443` | dashboard base URL                                             |
| `EVAL_USER`        | `admin`                  | dashboard username                                             |
| `EVAL_PASS`        | —                        | **required**                                                   |
| `EVAL_PROVIDER_ID` | —                        | **required**; a provider saved-object id                       |
| `EVAL_LANG`        | `both`                   | `en` \| `es` \| `both`                                         |
| `EVAL_FILTER`      | (all cases)              | comma-separated case ids, e.g. `active_agents,critical_alerts` |
| `EVAL_SLEEP_S`     | `30`                     | seconds slept between calls -- see quota notes below           |

Output: a `PASS`/`FAIL`/`SKIPPED-QUOTA` line per (case, language) with failure reasons indented
underneath, a final case-x-language matrix, and a summary line. Exit code = number of FAILs
(`SKIPPED-QUOTA` does not count as a failure). A stream that ends in a provider `error` event whose
message mentions a rate limit/quota/429 (after `server/providers/retry.ts`'s own bounded retries
already ran) is reported `SKIPPED-QUOTA`, not `FAIL`.

### Quota notes

Groq's free tier is a common cheap choice for sweeps, but budget accordingly:

- `llama-3.3-70b-versatile`: **100k tokens/day** total. Fine for one full EN+ES pass (23 cases x 2
  langs = 44 calls), tight for repeated runs the same day.
- `meta-llama/llama-4-scout-17b-16e-instruct`: **30k TPM** (tokens/minute) -- much friendlier for
  a sweep since the per-turn tool-schema payload (§3.3's ~1k token/turn target) is what actually
  burns the budget across the up-to-4-round orchestration loop (`MAX_TOOL_ROUNDS=3` + 1 final
  no-tools round, `server/routes/chat.ts:26,143-220`). Prefer this for iterating on the corpus.

`EVAL_SLEEP_S=30` (default) paces calls to stay under Groq's per-minute caps; raise it for TPM-tight
models, lower it (or set to `0`) against a local/self-hosted provider (Ollama/vLLM) with no quota.

### Known ambiguous case: `guardrail_90_day`

This case's `table` expectation is `required_empty_ok`, i.e. it expects the model to receive the
90-day-lookback rejection reason and successfully retry with a clamped range
(`guardrails.ts:83,226-231`; the "one bounded model retry" design). A
weak model that gives up after the first rejection instead of retrying will legitimately FAIL this
case's table assertion -- that is itself a useful finding (that provider doesn't self-correct on
guardrail feedback), not a harness bug. Read the failure reason before flagging it as a corpus bug.

### Known environment-dependent case: `honesty_on_empty`

Exercises whether the model reports a truthful "no vulnerabilities found" instead of misdescribing
an empty result as "no CRITICAL vulnerabilities found" (see `get_vulnerabilities.ts` vs
`get_critical_vulnerabilities.ts` -- similarly named/shaped tools). This only tests the intended
behavior if the target VM's `wazuh-states-vulnerabilities-*` index is actually empty or sparse (a
fresh VM, or one where the vulnerability-detection scan hasn't completed). Confirm that before
trusting either a PASS or a FAIL here.

## 2. Plumbing regression (`run_plumbing.js` + `mock_provider.js`)

Drives the REAL `server/routes/chat.ts` orchestration loop for all 28 catalog tools
(`server/tools/registry.ts:42-82`), but swaps the LLM for a free, deterministic, zero-token
scripted provider. Tool EXECUTION still hits the real Wazuh Manager/Indexer via whatever
`EVAL_BASE_URL` points at -- only the "thinking" step is mocked -- so this also regression-tests
`guardrails.ts` + `digest.ts` end to end against live data, without depending on any real model's
tool-selection accuracy.

### Step 1: start the mock provider

```bash
node mock_provider.js
# mock_provider listening on http://0.0.0.0:9876/v1/chat/completions
```

Runs on port `9876` by default (override with `MOCK_PORT`).

### Step 2: register it as a provider in the dashboard

`run_plumbing.js` does this automatically on each run (via `POST /api/wazuh_ai_assistant/providers`,
type `openai_compatible`) unless you set `MOCK_PROVIDER_ID` to reuse an existing one. If you'd
rather register it by hand once (Settings -> AI Assistant -> Providers):

- **Type**: `openai_compatible`
- **Base URL**: `http://HOST:9876/v1` where `HOST` is reachable from wherever the dashboard server
  process runs:
  - same machine as this script: `http://localhost:9876/v1`
  - **inside the AIO VM** (if the dashboard runs there and `mock_provider.js` runs on your host):
    the VM's NAT gateway back to the host is conventionally `10.0.2.2` -- use
    `http://10.0.2.2:9876/v1`. Set `MOCK_BASE_URL=http://10.0.2.2:9876/v1` so `run_plumbing.js`
    registers the same address it tells the dashboard to use.
- **Model**: any string (e.g. `mock-model`) -- the mock ignores it.

### Step 3: run it

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
export EVAL_PASS='...'
export MOCK_BASE_URL='http://localhost:9876/v1'   # or http://10.0.2.2:9876/v1 from inside the VM
node run_plumbing.js
```

### Env vars

| Var                    | Default                         | Notes                                                                                                                                     |
| ---------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `EVAL_BASE_URL`        | `https://localhost:8443`        | dashboard base URL                                                                                                                        |
| `EVAL_USER`            | `admin`                         | dashboard username                                                                                                                        |
| `EVAL_PASS`            | —                               | **required**                                                                                                                              |
| `MOCK_BASE_URL`        | `http://localhost:9876/v1`      | where the DASHBOARD should reach the mock                                                                                                 |
| `MOCK_PROVIDER_ID`     | (auto-registers one)            | reuse an existing provider instead                                                                                                        |
| `EVAL_SLEEP_S`         | `2`                             | this paces real Manager/Indexer calls, not a token quota                                                                                  |
| `MOCK_PORT`            | `9876`                          | `mock_provider.js`'s own listen port                                                                                                      |
| `MOCK_DEBUG_URL`       | `http://localhost:${MOCK_PORT}` | where THIS script reaches the mock's own `/debug/requests` admin endpoints (see "Debug endpoints" below) -- distinct from `MOCK_BASE_URL` |
| `EVAL_REAL_AGENT_NAME` | `wazuh-aio`                     | the real, enrolled agent name the privacy checks assert must never leak to the provider                                                   |

For each of the 28 tools: sends a prompt containing a `[[route:CATEGORY]]` marker (see "Two-stage
router" below) followed by a `[[mock:TOOLNAME:{json args}]]` marker, asserts a `tool_call` event
for that tool, no `error` event, a `table` event, and a `done` at the end -- and, since the router
routes internally, also asserts `route_question` never itself appears as a `tool_call` SSE event.
One extra case (`retry_429_once`) asserts a `status` event containing "retrying" (see
`server/providers/retry.ts:94-100`), reproducing a 429-then-succeed provider without touching a
real rate limit. Another (`route_general_only`) sends a `[[route:general]]`-only prompt and asserts
NO `tool_call` and NO `table` event, just a normal `done`. Five more exercise the privacy pipeline
-- see "Privacy pipeline checks" below.

### Two-stage router

`server/tools/router.ts` implements a tool-count mitigation: a
cheap stage-1 call picks 1-2 coarse categories via one synthetic tool (`route_question`) before
stage 2 re-invokes the model with only that category's real tools (+ `search_wazuh_data`, always
appended) instead of the full ~28-tool catalog every round. `ROUTER_ENABLED` in that file is the
kill switch -- flipping it to `false` reproduces today's (pre-router) behavior exactly, sending the
full catalog on every turn.

`mock_provider.js` handles stage 1 purely from the wire shape: whenever an incoming request's
`tools` array contains a function named `route_question` (the sole tool
`server/routes/chat.ts`'s `runStage1Routing` sends), it streams back a tool call to
`route_question` whose `categories` come from a `[[route:cat1,cat2]]` marker found anywhere in the
last user message (comma-separated, no spaces); absent that marker, it defaults to
`["free_search"]`. This branch is checked before every other marker/behavior in the file, and
leaves all of them (`[[mock:...]]`, `[[mock:429-once]]`, tool-result summarization) unchanged --
the mock works identically whether `ROUTER_ENABLED` is `true` or `false`: when disabled, chat.ts
never sends a `tools:[route_question]` request in the first place, so this branch simply never
triggers.

`run_plumbing.js` mirrors `server/tools/router.ts`'s tool-to-category map by hand in its own
`TOOL_CATEGORY` constant (a comment there points back at `router.ts` as the source of truth -- keep
the two in sync if the real map changes) and prepends `[[route:CATEGORY]]` to every per-tool
prompt, so each tool's stage-1 call routes to the category that actually contains it before the
stage-2 round exercises that tool's real schema. The marker is prepended, not appended, because
`mock_provider.js`'s `[[mock:...]]`/`[[mock:429-once]]` markers are matched anchored to the end of
the message -- prepending `[[route:...]]` keeps both markers usable in the same prompt.

### Per-tool minimal args (what this script hardcodes)

Derived by reading every `server/tools/catalog/*.ts` file's `parameters` schema + `buildRequest`,
supplying only the properties each tool actually requires:

| Tool                                 | Args                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `get_active_agents`                  | `{}`                                                                                        |
| `get_disconnected_agents`            | `{}`                                                                                        |
| `get_critical_findings`              | `{}`                                                                                        |
| `search_findings_by_agent`           | `{agent_name:"wazuh-aio"}`                                                                  |
| `get_top_rules`                      | `{}`                                                                                        |
| `get_critical_vulnerabilities`       | `{}`                                                                                        |
| `get_findings_by_time`               | `{}`                                                                                        |
| `get_brute_force`                    | `{}`                                                                                        |
| `get_security_summary`               | `{}`                                                                                        |
| `get_suspicious_powershell`          | `{}`                                                                                        |
| `search_findings_by_rule_title`      | `{rule_title:"Wazuh Rootcheck - Rootkit or malware detected"}`                              |
| `get_pci_dss_findings`               | `{}`                                                                                        |
| `get_pci_dss_summary`                | `{}`                                                                                        |
| `search_findings_by_multiple_agents` | `{agent_names:["wazuh-aio"]}`                                                               |
| `search_findings_by_os`              | `{os_name:"Ubuntu"}`                                                                        |
| `get_vulnerabilities`                | `{}`                                                                                        |
| `get_vulnerabilities_by_agent`       | `{agent_identifier:"wazuh-aio"}`                                                            |
| `get_solved_vulnerabilities`         | `{}`                                                                                        |
| `get_vulnerability_by_cve`           | `{cve_id:"CVE-2021-44228"}`                                                                 |
| `get_fim_events`                     | `{}`                                                                                        |
| `get_sca_results`                    | `{agent_id:"000"}`                                                                          |
| `get_mitre_findings`                 | `{}`                                                                                        |
| `get_mitre_summary`                  | `{}`                                                                                        |
| `get_agent_os`                       | `{agent_id:"000"}`                                                                          |
| `get_agent_packages`                 | `{agent_id:"000"}`                                                                          |
| `get_agent_ports`                    | `{agent_id:"000"}`                                                                          |
| `get_agent_processes`                | `{agent_id:"000"}`                                                                          |
| `search_wazuh_data`                  | `{index_pattern:"wazuh-findings-v5-*", query_dsl:"<JSON-encoded body, 90d range, size 5>"}` |

**Risk flag**: `get_sca_results`/`get_agent_os`/`get_agent_packages`/`get_agent_ports`/
`get_agent_processes` use agent id `"000"` (the manager's own pseudo-agent).
Whether the real Manager API's `/sca/000` and `/syscollector/000/*` endpoints accept that ID (vs.
erroring "not a valid agent for this operation") was **not verified against a live response** --
if these specific tools FAIL with a Manager-side error rather than a guardrail/digest bug, that is
the likely cause; substitute a real non-manager agent id via `TOOL_ARGS` if the VM has one enrolled.

### Privacy pipeline checks (also part of `run_plumbing.js`)

Five more checks run after the 30 above, exercising the privacy mode wiring
(`server/routes/chat.ts`'s `resolvePrivacyEnabled`/`scrubMessagesForProvider`,
`server/tools/privacy.ts`'s `Pseudonymizer`/`applyFieldPolicy`, `server/routes/settings.ts`'s
GET/PUT settings singleton) and the debug endpoints below:

| #   | Check                         | What it asserts                                                                                                                                |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 31  | `settings_routes_smoke`       | GET `/settings` (shape), PUT a modified `fieldPolicy` (defaults + an inert `{field:'eval.test_field', action:'never'}`), GET again (persisted) |
| 32  | `privacy_on_pseudonymization` | `get_active_agents` with `privacy:{enabled:true, map:[]}` -- see assertions (a)-(e) below                                                      |
| 33  | `privacy_off_regression`      | same prompt with no `privacy` key at all -- digest keeps the real value, no `privacy_map` event                                                |
| 34  | `privacy_map_dedup_roundtrip` | re-sending the minted map does not re-mint the same value as a new `privacy_map` entry (in fact: no `privacy_map` event at all)                |
| 35  | `settings_restore_defaults`   | PUTs `originalSettings` back, undoing check 31's added rule, and confirms it stuck                                                             |

**Tool-scoped policy entries**: Manager-API tools carry BARE digest field names
(`get_active_agents.ts`: `sampleColumns: ['id','name','ip','status']`) that a plain `agent.name`
policy entry can never match — a gap this harness's first authoring pass found. The shipped fix is
tool-scoped entries in `FIELD_POLICY_DEFAULTS` (`server/tools/privacy.ts`):
`get_active_agents/name` (kind HOST), `get_active_agents/ip` (IP), and the same for
`get_disconnected_agents`. Scoped entries win over plain ones; a bare `name` elsewhere (package
names, SCA policy names) stays readable. Check 31's added rule is therefore INERT
(`{field:'eval.test_field', action:'never'}` — pure persistence test); it stays active through
checks 32-34 only to prove persistence across intervening writes, and check 35 restores the
original settings exactly.

**Assertions for check 32** (`privacy_on_pseudonymization`, prompt `[[route:agents]] Which agents
are active? [[mock:get_active_agents:{}]]`):

- **(a)** a `privacy_map` SSE event arrives with an entry whose `value` is the real agent name
  (`wazuh-aio` on this VM, overridable via `EVAL_REAL_AGENT_NAME`).
- **(b)** the `digest` event correlated to the `get_active_agents` `tool_call` (matched by
  `toolCallId`) does **not** contain that real value and **does** contain a `HOST_<n>` pseudonym:
  the tool-scoped default `{field:'get_active_agents/name', action:'anonymize', kind:'HOST'}`
  applies out of the box, no policy modification needed.
- **(c)** fetching mock_provider.js's `GET /debug/requests` (cleared right before this check via
  `DELETE /debug/requests`), no request body the mock actually received contains the real value
  anywhere -- covers the stage-1 routing call, the stage-2 tool-call round, and the follow-up round
  that summarizes the tool result.
- **(d)** the `table` SSE event (rendered locally, never sent to the provider) DOES contain the
  real value -- confirms real data stays local per §6's "displayed answer ... values never left the
  box".
- **(e)** the `tool_call` SSE event's arguments are real-form. `get_active_agents` takes no
  arguments at all, so this only confirms the inbound reversal pass (`chat.ts:452-465`) didn't
  corrupt an empty object -- a stronger round-trip check isn't possible with this harness, because
  the zero-token scripted mock never actually emits pseudonym-form arguments in the first place (it
  just echoes the prompt's plain-JSON `[[mock:...]]` marker straight back); it has no notion of the
  pseudonym map at all.

### Debug endpoints (`mock_provider.js`)

- **`GET /debug/requests`**: returns a JSON array of every raw (parsed) request body the mock has
  received on `POST .../chat/completions` since startup, oldest first, capped at the last 50 (a
  ring buffer -- pushing past the cap drops the oldest entry).
- **`DELETE /debug/requests`**: clears the ring buffer, returns `{cleared: true, previousCount}`.

Both are served directly by `mock_provider.js` itself (not proxied through the dashboard), so a
script needs mock*provider.js's OWN address to reach them -- see `run_plumbing.js`'s
`MOCK_DEBUG_URL` (defaults to `http://localhost:${MOCK_PORT}`, assuming the eval script and the mock
run on the same host, as the "Step 1"/"Step 3" instructions below already assume). This is distinct
from `MOCK_BASE_URL`, which is what the \_dashboard* is told to use and may point at a different
address (e.g. `10.0.2.2` from inside a VM) -- the debug endpoints are never reached through that
address unless the dashboard and this script happen to run on the same host too.

### Load-test stream marker: `[[mock:stream:CHARS:MS]]`

Used by `run_load.js` (see "6. Load test" below), not by the per-tool plumbing cases above. When
the last user message ends with `[[mock:stream:CHARS:MS]]`, `mock_provider.js` streams a synthetic
plain-text answer totalling `CHARS` characters as small content deltas spread out over `MS`
milliseconds of wall-clock time (not sent all at once), then a normal `finish_reason:"stop"` +
`[DONE]` -- i.e. an SSE connection that stays open for a controllable duration, unlike every other
branch here (which resolves as fast as Node can flush). This is what lets `run_load.js` hold many
concurrent chat streams open long enough to measure the plugin's footprint under sustained
concurrency. Checked before the generic `[[mock:TOOLNAME:{json args}]]` marker, since `stream`
would otherwise itself parse as a tool name with non-JSON args.

### Provider stall marker: `[[mock:stall:MS]]`

Live-tests the provider stall watchdog (`server/providers/sse-utils.ts`'s `iterateSseLines`
per-read timeout +
`server/providers/retry.ts`'s `fetchWithHeaderTimeout`) against the real chat route, instead of
only through `server/providers/provider-stall-watchdog.test.ts`'s synthetic-stream unit tests.

A prompt ending in `[[mock:stall:MS]]` gets HTTP 200 + SSE headers, exactly ONE content delta chunk
(`"stalling..."`), then silence -- no more chunks, no `[DONE]` -- for `MS` milliseconds, after which
the mock closes the connection on its own. This is what a real "provider connected, sent something,
then went silent forever" stall looks like on the wire.

To actually exercise the watchdog rather than just the mock's own silence timer, start the dashboard
with a short idle-timeout override (test-only; see `sse-utils.ts`'s file-header doc comment --
production never reads these) and pick an `MS` comfortably larger than it, so the dashboard's own
timeout fires -- and the client disconnects -- well before the mock would otherwise close the
connection itself:

```bash
# dashboard process
export WZ_AI_PROVIDER_IDLE_TIMEOUT_MS=2000     # default 120000; override for the live test only
export WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS=2000  # default 30000

# prompt sent through sse_client.js's chat(), e.g.: "Tell me about active agents [[mock:stall:15000]]"
```

Expect a terminal SSE `error` event with message `"The AI provider stopped responding."` within
~`WZ_AI_PROVIDER_IDLE_TIMEOUT_MS` of the one delta chunk, not after the full 15s `MS`.

## 3. Guardrail unit tests (`run_lint.js` + `lint_cases.json`)

Runs 18 adversarial (and 2 clean) DSL bodies through the **compiled** `server/tools/guardrails.ts`
module, replicating `executor.ts`'s exact call order for an indexer request
(`checkIndexAllowlist` -> `applySafetyValves` -> `lintDsl`, `executor.ts:82-124`).

This repo ships `guardrails.ts` as TypeScript source only -- there's no build artifact checked in
and this harness does not build anything (`npm`/`yarn` builds are explicitly out of scope here).
Point it at a compiled JS build of that one file:

```bash
export EVAL_GUARDRAILS_JS=/path/to/compiled/guardrails.js
node run_lint.js
```

If `EVAL_GUARDRAILS_JS` is unset, `run_lint.js` tries a short list of plausible post-build paths
(`../target/server/tools/guardrails.js`, `../build/...`, `../dist/...`) relative to `eval/` and
warns loudly if it guesses right -- these are unverified guesses based on common
`@osd/plugin-helpers` output layouts, not a confirmed build layout for this plugin. If you build
the plugin, capture the real path once and always pass it via `EVAL_GUARDRAILS_JS` afterwards.

The module can be CommonJS or an ES module; `run_lint.js` tries `require()` first and falls back
to dynamic `import()` on `ERR_REQUIRE_ESM`.

### What each case asserts

See `lint_cases.json`'s `_meta` and each case's `citation` field for the exact `guardrails.ts`
line(s) it targets. Two findings worth calling out explicitly, since they reflect what the code
actually does rather than the original design intent:

- **`no_time_range_at_all_on_time_index`** (expect: `pass`): a query with no `range` clause at all
  is never rejected -- `checkDateRanges` only inspects a `range` that's already present on a time
  field. There's no code-level enforcement that a time-based-index query must carry a time bound;
  only the typed catalog tools' own defaults (`resolveTimeRange`, `common.ts:67-77`) provide one in
  practice. The escape hatch has no such backstop.
- **`bool_must_context_not_actually_enforced`** (expect: `pass`): `search_wazuh_data.ts`'s tool
  description promises the model "query must use filter context (bool.filter, not must/should)",
  but `guardrails.ts`'s `lintDsl` has no check that inspects `bool.must` vs `bool.filter` at all --
  a `bool.must` query currently passes every guardrail unchanged.

Both are asserted as the code actually behaves, not as the tool description reads: a corpus that
encodes intended-but-unimplemented behavior would fail against the shipping code and hide the gap
rather than record it.

## Files

| File                   | Purpose                                                                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corpus.json`          | 22 live-eval cases (18 UAT intents x EN/ES + 4 extra: 90-day guardrail, escape-hatch long-tail, honesty-on-empty, no-tool conversational)                                                                                                             |
| `sse_client.js`        | shared `login()` + `chat()` + SSE frame parser, used by `run_live.js` and `run_plumbing.js`; `chat()`'s `options.privacy` is additive (see "Privacy pipeline checks")                                                                                 |
| `run_live.js`          | live-provider eval runner                                                                                                                                                                                                                             |
| `mock_provider.js`     | zero-token scripted OpenAI-compatible provider; also serves `GET`/`DELETE /debug/requests` (see "Debug endpoints")                                                                                                                                    |
| `run_plumbing.js`      | plumbing regression runner (drives `mock_provider.js` through the real route); checks total: per-tool (one per read tool) + `retry_429_once` + `route_general_only` + 5 privacy-pipeline                                                              |
| `lint_cases.json`      | 18 adversarial/clean DSL cases for `guardrails.ts`                                                                                                                                                                                                    |
| `run_lint.js`          | guardrail unit-test runner (needs a compiled `guardrails.js`)                                                                                                                                                                                         |
| `measurement-set.json` | 37-case human-judged measurement set (see `measurement-set.README.md`); 2 `turn_based_cases` are consumed by `run_multiturn.js`, everything else by a human-judged process outside this harness                                                       |
| `run_multiturn.js`     | multi-turn runner for `measurement-set.json`'s 2 `turn_based_cases`; reimplements `chat-page.tsx`'s digest-in-history reconstruction (see "4." above)                                                                                                 |
| `run_persistence.js`   | owner-scoped CRUD persistence checks for saved conversations (see "5." above); no LLM/provider involved                                                                                                                                               |
| `run_load.js`          | concurrent load driver measuring footprint under many simultaneous chat streams (see "6." below); talks to the chat route directly over `https` rather than reusing `sse_client.js`'s `chat()`                                                        |
| `browser_probe.mjs`    | automated headless-Chrome probe (per-tab heap, the HTTP/1.1 6-connection cap, heap growth across chat turns, a stored-XSS render check)                                                                                                               |
| `cli-env.js`           | shared `EVAL_BASE_URL`/`EVAL_USER`/`EVAL_PASS` env parsing + `fail()` helper, used by `run_live.js`, `run_plumbing.js`, `run_multiturn.js`, `run_persistence.js` (not `run_load.js`, which has its own argv-accepting `getParam`, or `sse_client.js`) |

## Known limitations

- `run_lint.js` is the only runner that needs no live stack: it exercises `lint_cases.json`
  against a CommonJS transliteration of `server/tools/guardrails.ts` (types stripped, logic
  unchanged), so it runs anywhere Node does. Every other runner needs a reachable dashboard and a
  seeded stack.
- `run_lint.js`'s cases document two places where `search_wazuh_data`'s tool description promises
  more than `guardrails.ts` enforces (see the section above). They are asserted as the code
  actually behaves, not as the description reads, so tightening the guardrail will require
  updating those expectations deliberately.
- The privacy checks in `run_plumbing.js` (checks 31-35) depend on `FIELD_POLICY_DEFAULTS`
  carrying a tool-scoped `HOST` entry for the agent-name field; changing those defaults changes
  what check 32 (b) expects.
- There are no React component tests anywhere in the plugin; `browser_probe.mjs` is the only
  automated coverage of the UI layer.

## 4. Multi-turn measurement-set eval (`run_multiturn.js`)

Runs `measurement-set.json`'s 2 `turn_based_cases` (`markdown_table_suppression`,
`digest_freshness_repeat`) against a real, already-configured provider + dashboard, sending each
case's `turns` as successive user messages in the SAME conversation (per `measurement-set.json`'s
own `_meta.run_method`). `run_live.js`/`sse_client.js`'s `chat()` only ever sends a single fresh
user turn per call (see `chat()`'s own doc comment) -- these 2 cases were never actually run before
this script existed.

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
export EVAL_PASS='...'
export EVAL_PROVIDER_ID='...'
node run_multiturn.js
```

### Env vars

| Var                | Default                  | Notes                                                                 |
| ------------------ | ------------------------ | --------------------------------------------------------------------- |
| `EVAL_BASE_URL`    | `https://localhost:8443` | dashboard base URL                                                    |
| `EVAL_USER`        | `admin`                  | dashboard username                                                    |
| `EVAL_PASS`        | —                        | **required**                                                          |
| `EVAL_PROVIDER_ID` | —                        | **required**; a provider saved-object id                              |
| `EVAL_FILTER`      | (both cases)             | comma-separated case ids                                              |
| `EVAL_SLEEP_S`     | `30`                     | seconds slept between calls, INCLUDING between turns of the same case |
| `EVAL_OUT_DIR`     | `os.tmpdir()`            | directory each turn's raw SSE transcript is written to                |

### The digest-in-history reconstruction

Between turn 1 and turn 2 of the SAME conversation, a real browser session (`public/components/
chat/chat-page.tsx`'s `buildOutgoingMessages`, ~L378-419) doesn't just resend turn 1's prose — it
replays the `[assistant{toolCalls}, tool{digest}]` pair the server itself appended to its own
in-memory `messages` accumulator while executing turn 1's tool call(s)
(`server/routes/chat.ts:489-494`), placed immediately before turn 1's prose assistant message, so
turn 2's model sees the exact same tool-call/tool-result context a real multi-round conversation
would. `run_multiturn.js`'s `buildOutgoingMessagesForTurn` is a line-for-line port of that function:
same `TOOL_HISTORY_MAX_TURNS` (2) / `TOOL_HISTORY_CHAR_BUDGET` (8000-char) budget, walked
newest-turn-first, same message shapes. `toolCall` is REAL-form arguments (the `tool_call` SSE
event's payload); `digestContent` is the correlated `digest` SSE event's `content`, matched by
`toolCallId`. A tool call that never got a correlated `digest` event is kept out of history, same as
the real client.

**Privacy is OFF** for every case here (no `privacy` key in the request body — matches
`run_live.js`'s default). Pseudonym-map replay (`privacy.map`/the `privacy_map` SSE event) is **not**
implemented — this is a known, documented limitation, fine for these 2 cases since neither's rubric
concerns privacy behavior.

`sse_client.js`'s `chat()` cannot be reused for turn 2+ (it hardcodes a single-`user`-message body
and doesn't export its SSE frame iterator), so `run_multiturn.js` reimplements the same
frame-buffering SSE parse inline (`postChatTurn`) rather than modifying the shared client.
`sse_client.js`, `run_live.js`, and `measurement-set.json` are untouched.

### What it asserts

- `expected_tools`: if the case sets `requires_tool_call_each_turn: true` (`digest_freshness_repeat`),
  a matching `tool_call` event must appear on EVERY turn — the point of that case is confirming turn
  2 re-queries instead of answering from turn 1's stale digest. Otherwise (`markdown_table_
suppression`), only turn 1 is checked — its own rubric treats turn 1 as setup that must produce a
  real `get_findings_by_time` call, while turn 2 is allowed to reformat from history without
  re-querying. This branch is driven by the `requires_tool_call_each_turn` case field, not a
  hardcoded case id.
- `answer_must_match`/`answer_must_not_match`: regex (case-insensitive, same as `run_live.js`),
  checked against the FINAL turn's joined `delta` prose only — per `measurement-set.json`'s `_meta.
matching_semantics` and each case's own rubric.
- Any turn that returns a non-200 HTTP status or a stream `error` event fails the whole case
  immediately (no further turns are sent — the conversation is broken).
- Every turn's full raw SSE transcript is saved to `EVAL_OUT_DIR/multiturn_<case_id>_turn<n>.sse` so
  a human judge (per `measurement-set.README.md`'s scoring method) can read the actual
  prose/tool_call/digest sequence afterwards, not just the PASS/FAIL verdict.

Output/exit code convention matches `run_live.js`: a PASS/FAIL line per case with reasons indented
underneath, a `PASS: n FAIL: m TOTAL: t` summary, exit code = number of FAILs.

### Message-history contract

`buildOutgoingMessagesForTurn` here must mirror `chat-page.tsx`'s own history assembly — the
`ToolExchange` shape, `TOOL_HISTORY_MAX_TURNS`/`TOOL_HISTORY_CHAR_BUDGET`, `buildOutgoingMessages`,
and the `digest` SSE-event handling that populates `exchange.digestContent`. A drift between the
two makes this runner measure a message array the real UI never sends.

## 5. Persistence checks (`run_persistence.js`)

Exercises the owner-scoped CRUD routes for persistent (saved/resumable) conversations
(`server/routes/conversations.ts`, `API_PATHS.CONVERSATIONS`/`CONVERSATION_BY_ID` in
common/constants.ts) against a real dashboard session. No mock provider and no LLM involved at
all -- these routes never call `adapter.chatStream`, so this only needs `sse_client.js`'s
`login()`. Deliberately its own file rather than folded into `run_plumbing.js`, to avoid a merge
conflict with another change in flight against that file at the time this was built.

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
export EVAL_PASS='...'
node run_persistence.js
```

### Env vars

| Var             | Default                  | Notes              |
| --------------- | ------------------------ | ------------------ |
| `EVAL_BASE_URL` | `https://localhost:8443` | dashboard base URL |
| `EVAL_USER`     | `admin`                  | dashboard username |
| `EVAL_PASS`     | —                        | **required**       |

### What it checks (9 total)

1. **`create_conversation`** — `POST /conversations` returns 200 with `id`/`title`/`messages`/
   `createdAt`/`updatedAt`, and the response body never contains an `owner` field (the server
   never echoes it back — common/types.ts's `ConversationRecord` has no such property at all).
2. **`list_contains_created`** — `GET /conversations` includes the new id, with only
   `id`/`title`/`updatedAt` (no `messages` on a list entry).
3. **`get_by_id_matches_created`** — `GET /conversations/{id}` returns the exact title/messages
   just created.
4. **`put_persists`** — `PUT /conversations/{id}` with a new title/messages returns the update,
   AND a follow-up `GET` confirms it actually persisted server-side (not just echoed in the PUT
   response).
5. **`get_nonexistent_404`** — `GET` on a fabricated, never-created id returns HTTP 404.
6. **`delete_nonexistent_404`** — `DELETE` on the same fabricated id also returns HTTP 404.
7. **`owner_injection_rejected_or_ignored`** — `POST /conversations` with an extra
   `owner: "attacker"` property in the body never results in the conversation being filed under
   that value. Two outcomes both count as PASS: the schema validator rejects the unrecognized
   property outright (HTTP 400), or it's silently ignored and the row is created under the REAL
   session's resolved owner — verified by confirming this same session can immediately list and
   fetch it by id (if the server had actually stored `owner:"attacker"` literally, this session's
   own `resolveOwner()` result would not match it, and both of those would fail). Either way, the
   check's own row is cleaned up in the `finally` block below.
8. **`delete_conversation`** — `DELETE /conversations/{id}` returns `{deleted: true}`.
9. **`deleted_gone_from_list_and_get`** — after deletion, the id is absent from `GET
/conversations` AND a direct `GET /conversations/{id}` now 404s.

Every conversation id this run creates (including check 7's owner-injection probe) is deleted in a
`finally` block regardless of pass/fail, so a failed run never leaves stray rows on the target
dashboard.

### Verification performed while building this check

Covers `server/routes/conversations.ts`'s route handlers: `resolveOwner`, owner scoping, the
404-not-403 owner-mismatch behavior, and retention pruning on access. Needs a live dashboard, like
every runner in this harness except `run_lint.js`.

## 6. Load test (`run_load.js`)

Concurrent load driver for measuring the plugin's memory/CPU footprint under many simultaneous
in-flight chat streams, run FROM THE HOST against a real dashboard (default
`https://localhost:8444`, the AIO VM's port-forwarded HTTPS). Pairs with `/vagrant/
sample_metrics.sh` (VM-side resource sampler, outside this repo) and `mock_provider.js`'s
`[[mock:stream:CHARS:MS]]` marker (see "Load-test stream marker" above), which lets a mocked SSE
stream stay open for a controllable duration under load.

Unlike every other script in this harness, `run_load.js` does NOT reuse `sse_client.js`'s `chat()`
for the load-generating requests themselves: `chat()` is built on global `fetch` (Node's bundled
undici), whose connection-pool size isn't configurable without the `undici` npm package (out of
scope — zero deps outside Node built-ins). To hit many concurrent TLS connections reliably, this
file instead talks to the chat route directly over the built-in `https` module with an explicit
`https.Agent({ maxSockets })`, using the same SSE frame-buffering approach as `sse_client.js`.
`login()` (one call per configured user, not per question) is reused as-is from `sse_client.js`.

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
export EVAL_PROVIDER_ID='...'                       # saved-object id of the mock provider
export EVAL_USERS='user1:pass,user2:pass,user3:pass'
node run_load.js
```

Every env var also accepts an argv `KEY=value` token (e.g. `node run_load.js TOTAL=20`), so this
runs unchanged from PowerShell, where inline `VAR=val cmd` shell syntax doesn't exist. `run_load.js`
has its own `getParam` helper for this — deliberately NOT the shared `cli-env.js` (see the Files
table above), since none of the other runners accept argv tokens.

### Env vars

| Var                   | Default                  | Notes                                                                                                                          |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `EVAL_BASE_URL`       | `https://localhost:8444` | dashboard base URL (note the different default port than the other scripts)                                                    |
| `EVAL_PROVIDER_ID`    | —                        | **required**; saved-object id of the mock provider                                                                             |
| `EVAL_USERS`          | —                        | **required**; `"user1:pass,user2:pass,..."` — each user logs in ONCE, its cookie jar is reused for every question routed to it |
| `CONCURRENCY`         | `5`                      | number of parallel in-flight questions (worker pool size)                                                                      |
| `TOTAL`               | `10`                     | total questions sent across the whole run                                                                                      |
| `QUESTION_MODE`       | `stream`                 | `stream` \| `tool` \| `mixed` \| `429` — see below                                                                             |
| `EVAL_STREAM_CHARS`   | `2000`                   | stream-mode marker's `CHARS`                                                                                                   |
| `EVAL_STREAM_MS`      | `20000`                  | stream-mode marker's `MS` (total streaming duration)                                                                           |
| `EVAL_TIMEOUT_MS`     | `60000`                  | per-request client-side timeout                                                                                                |
| `RAMP_MS`             | `25`                     | delay between starting successive workers, to avoid a single instant burst                                                     |
| `EVAL_ABORT_AFTER_MS` | `0`                      | closed-tab simulation — see below; `0` disables it                                                                             |
| `EVAL_LOADOUT_DIR`    | `eval/loadout`           | directory the per-run `.jsonl` output file is written to                                                                       |

### `QUESTION_MODE`

Selects what each load-generated question looks like:

- **`stream`**: every question ends with `[[mock:stream:EVAL_STREAM_CHARS:EVAL_STREAM_MS]]`,
  holding an SSE connection open for a controllable duration — the mode that actually exercises
  sustained concurrent-stream memory/CPU, independent of any tool-calling path.
- **`tool`**: every question cycles through a small fixed set of real catalog tools
  (`get_active_agents`, `get_critical_findings`, `get_top_rules`, `search_findings_by_agent`), each
  prefixed with the matching `[[route:CATEGORY]]` marker (same two-stage-router mechanics as
  `run_plumbing.js`) and suffixed with `[[mock:TOOLNAME:{json args}]]` — measures footprint for the
  tool-calling + digest path instead of a long-held stream.
- **`mixed`**: alternates `stream`/`tool` questions by index (even indices stream, odd indices call
  a tool) — a closer approximation of real mixed traffic than either pure mode alone.
- **`429`**: every question is `load q<index>: rate limit me [[mock:429-once]]` — each request's
  FIRST provider call gets rate-limited once (the `q<index>` prefix keeps every request body
  unique so each one triggers its own first-time 429), then `server/providers/retry.ts` retries
  after ~1s. Measures the retry pile-up shape under concurrent rate limiting rather than sustained
  streaming or tool execution.

### `EVAL_ABORT_AFTER_MS`: closed-tab simulation

When set `>0`, each request's underlying socket is destroyed this many milliseconds after it
starts — simulating a user closing the browser tab mid-stream instead of letting the stream finish
or error normally. The record for that request gets `error: 'aborted-by-test'` in the output
`.jsonl`; the actual point of this flag is verifying SERVER-SIDE cleanup out-of-band (established
connection count and RSS in `sample_metrics.sh`'s output should drop back down promptly instead of
the abandoned stream's resources lingering).

### Output

One JSON-lines file under `EVAL_LOADOUT_DIR` (one line per request, in request-index order,
filename `run_<QUESTION_MODE>_<timestamp>.jsonl`) plus a printed summary: p50/p95 time-to-first-
token and duration, error count, and achieved concurrency (the max number of requests observed
simultaneously in-flight, computed from each record's own start/end epoch timestamps, independent
of the configured `CONCURRENCY`). Exit code = number of failed/errored requests (`0` = all clean).

### Verification performed while building `run_load.js`

Syntax-checked (`node -c run_load.js`) only — not run against a live dashboard/VM as part of this
build; confirm against a real run before trusting a clean pass, same caveat as the rest of this
harness's untested scripts.
