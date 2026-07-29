'use strict';

/**
 * Live eval runner: sends every corpus.json case (in EN and/or ES) through a real, configured
 * provider against a real dashboard + AIO VM, and checks the assertions described in each case's
 * `expect` block. See eval/README.md for setup (login, provider id, quota pacing).
 *
 * Env vars (all read once at startup -- see the table in eval/README.md):
 *   EVAL_BASE_URL   default "https://localhost:8443"
 *   EVAL_USER       default "admin"
 *   EVAL_PASS       required
 *   EVAL_PROVIDER_ID required
 *   EVAL_LANG       "en" | "es" | "both" (default "both")
 *   EVAL_FILTER     comma-separated case ids (optional; default = every case)
 *   EVAL_SLEEP_S    seconds to sleep between calls (default 30 -- free-tier quota pacing)
 *
 * Exit code = number of FAILed (case, lang) combinations (0 = all PASS/SKIPPED-QUOTA).
 */

const path = require('path');
const { login, chat } = require('./sse_client');
const { BASE_URL, USER, PASS, fail } = require('./cli-env');

const PROVIDER_ID = process.env.EVAL_PROVIDER_ID;
const LANG = (process.env.EVAL_LANG || 'both').toLowerCase();
const FILTER = process.env.EVAL_FILTER
  ? new Set(
      process.env.EVAL_FILTER.split(',')
        .map(id => id.trim())
        .filter(Boolean),
    )
  : undefined;
const SLEEP_S =
  process.env.EVAL_SLEEP_S !== undefined
    ? Number(process.env.EVAL_SLEEP_S)
    : 30;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (!PROVIDER_ID)
  fail(
    'EVAL_PROVIDER_ID is required (a saved-object id from GET /api/wazuh_ai_assistant/providers).',
  );
if (!['en', 'es', 'both'].includes(LANG))
  fail(`EVAL_LANG must be en|es|both, got "${LANG}"`);

const languages = LANG === 'both' ? ['en', 'es'] : [LANG];

/** Loose scalar equality: numbers/strings compare equal when their string forms match (task spec: "5"==5). */
function looseEquals(actual, expected) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    return expected.every(expectedItem =>
      actual.some(actualItem => String(actualItem) === String(expectedItem)),
    );
  }
  return String(actual) === String(expected);
}

/** True when every key/value in `subset` is present (loosely) in `actual`. */
function paramsSubsetMatches(actual, subset) {
  if (!subset || Object.keys(subset).length === 0) return true;
  if (!actual || typeof actual !== 'object') return false;
  return Object.entries(subset).every(([key, expectedValue]) =>
    looseEquals(actual[key], expectedValue),
  );
}

function expectedToolList(expectTool) {
  return Array.isArray(expectTool) ? expectTool : [expectTool];
}

/**
 * Evaluates one case's `expect` block against the collected StreamEvent array. Returns
 * {pass, reasons[], skippedQuota}. `reasons` is empty on pass.
 */
function evaluate(testCase, events) {
  const reasons = [];
  const toolCallEvents = events.filter(
    event => event && event.type === 'tool_call',
  );
  const tableEvents = events.filter(event => event && event.type === 'table');
  const errorEvents = events.filter(event => event && event.type === 'error');
  const lastEvent = events[events.length - 1];

  // Quota exhaustion (after retry.ts's bounded retries already ran) is not a case failure.
  const quotaError = errorEvents.find(event =>
    /rate.?limit|quota|429/i.test(event.message || ''),
  );
  if (quotaError) {
    return {
      pass: false,
      reasons: [`provider quota/rate-limit error: ${quotaError.message}`],
      skippedQuota: true,
    };
  }

  const expect = testCase.expect;
  const wantsNoTool = expect.tool === 'none';
  const expectedTools = wantsNoTool ? [] : expectedToolList(expect.tool);

  // --- tool assertion ---
  if (wantsNoTool) {
    if (toolCallEvents.length > 0) {
      reasons.push(
        `expected no tool_call, but got: ${toolCallEvents
          .map(e => e.toolCall.name)
          .join(', ')}`,
      );
    }
  } else {
    const matched = toolCallEvents.filter(event =>
      expectedTools.includes(event.toolCall.name),
    );
    if (matched.length === 0) {
      reasons.push(
        `expected one of [${expectedTools.join(', ')}] to be called; saw: ` +
          `${
            toolCallEvents.length
              ? toolCallEvents.map(e => e.toolCall.name).join(', ')
              : '(none)'
          }`,
      );
    } else if (
      expect.params_subset &&
      Object.keys(expect.params_subset).length > 0
    ) {
      // §"params_subset ⊆ that tool_call's arguments" -- check against any matching-name call
      // (the model may call the right tool more than once across bounded tool rounds).
      const anySatisfies = matched.some(event =>
        paramsSubsetMatches(event.toolCall.arguments, expect.params_subset),
      );
      if (!anySatisfies) {
        reasons.push(
          `params_subset ${JSON.stringify(
            expect.params_subset,
          )} not found in any matching tool_call's ` +
            `arguments (saw: ${matched
              .map(e => JSON.stringify(e.toolCall.arguments))
              .join(' | ')})`,
        );
      }
    }
  }

  // --- table assertion ---
  const tableExpectation = expect.table || 'none';
  if (tableExpectation === 'none') {
    if (tableEvents.length > 0) {
      reasons.push(
        `expected no table event, but ${tableEvents.length} were emitted`,
      );
    }
  } else if (tableExpectation === 'required_empty_ok') {
    if (tableEvents.length === 0) {
      reasons.push(
        'expected at least one table event (rows may be empty), got none',
      );
    }
  } else if (tableExpectation === 'required') {
    const hasNonEmpty = tableEvents.some(
      event => Array.isArray(event.spec?.rows) && event.spec.rows.length > 0,
    );
    if (!hasNonEmpty) {
      reasons.push('expected at least one table event with non-empty rows');
    }
  }

  // --- answer regex assertions ---
  const answerText = events
    .filter(event => event && event.type === 'delta')
    .map(event => event.content || '')
    .join('');
  for (const pattern of expect.answer_must_match || []) {
    if (!new RegExp(pattern, 'i').test(answerText)) {
      reasons.push(`answer_must_match /${pattern}/i did not match answer text`);
    }
  }
  for (const pattern of expect.answer_must_not_match || []) {
    if (new RegExp(pattern, 'i').test(answerText)) {
      reasons.push(
        `answer_must_not_match /${pattern}/i matched answer text (should not have)`,
      );
    }
  }

  // --- always: clean stream termination ---
  if (!lastEvent || lastEvent.type !== 'done') {
    if (lastEvent && lastEvent.type === 'error') {
      reasons.push(`stream ended with error: ${lastEvent.message}`);
    } else {
      reasons.push(
        `stream did not end with a 'done' event (last event: ${
          lastEvent ? lastEvent.type : '(no events)'
        })`,
      );
    }
  }

  return { pass: reasons.length === 0, reasons, skippedQuota: false };
}

async function main() {
  const corpus = require(path.join(__dirname, 'corpus.json'));
  let cases = corpus.cases;
  if (FILTER) {
    cases = cases.filter(testCase => FILTER.has(testCase.id));
    const missing = [...FILTER].filter(
      id => !cases.some(testCase => testCase.id === id),
    );
    if (missing.length) {
      console.warn(
        `WARNING: EVAL_FILTER named unknown case id(s): ${missing.join(', ')}`,
      );
    }
  }
  if (cases.length === 0) fail('No cases selected (check EVAL_FILTER).');

  console.log(`Logging in to ${BASE_URL} as ${USER}...`);
  const cookies = await login(BASE_URL, USER, PASS);
  console.log('Login OK.\n');

  /** matrix[caseId][lang] = 'PASS' | 'FAIL' | 'SKIP' */
  const matrix = {};
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;

  const totalRuns = cases.length * languages.length;
  let runIndex = 0;

  for (const testCase of cases) {
    matrix[testCase.id] = {};
    for (const lang of languages) {
      runIndex += 1;
      const prompt = lang === 'en' ? testCase.prompt_en : testCase.prompt_es;
      let result;
      try {
        const events = await chat(BASE_URL, cookies, PROVIDER_ID, prompt);
        result = evaluate(testCase, events);
      } catch (error) {
        result = {
          pass: false,
          reasons: [
            `harness crashed: ${
              error && error.message ? error.message : String(error)
            }`,
          ],
          skippedQuota: false,
        };
      }

      let label;
      if (result.skippedQuota) {
        label = 'SKIPPED-QUOTA';
        skipCount += 1;
      } else if (result.pass) {
        label = 'PASS';
        passCount += 1;
      } else {
        label = 'FAIL';
        failCount += 1;
      }
      matrix[testCase.id][lang] = label;

      console.log(
        `[${runIndex}/${totalRuns}] ${label}  ${testCase.id} (${lang})`,
      );
      if (!result.pass) {
        for (const reason of result.reasons) {
          console.log(`    - ${reason}`);
        }
      }

      if (runIndex < totalRuns && SLEEP_S > 0) {
        await sleep(SLEEP_S * 1000);
      }
    }
  }

  console.log('\n=== Matrix (case x lang) ===');
  const header = ['case', ...languages].join('\t');
  console.log(header);
  for (const testCase of cases) {
    console.log(
      [testCase.id, ...languages.map(lang => matrix[testCase.id][lang])].join(
        '\t',
      ),
    );
  }

  console.log('\n=== Summary ===');
  console.log(
    `PASS: ${passCount}  FAIL: ${failCount}  SKIPPED-QUOTA: ${skipCount}  TOTAL: ${totalRuns}`,
  );

  process.exit(failCount);
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(2);
});
