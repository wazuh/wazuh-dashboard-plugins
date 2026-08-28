'use strict';

/**
 * Runs eval/lint_cases.json against the COMPILED server/tools/guardrails.ts module. This repo
 * ships guardrails.ts as TypeScript source; there is no build artifact checked in, so the path to
 * the compiled JS must come from the environment (EVAL_GUARDRAILS_JS) or be found among a list of
 * plausible post-build locations. See eval/README.md for how to produce/find that file.
 *
 * Replicates executor.ts's exact call order for an indexer request (executeIndexerRequest,
 * executor.ts:82-124):
 *   1. checkIndexAllowlist(index)                     -- executor.ts:82-85
 *   2. applySafetyValves(body)                        -- executor.ts:95-98
 *   3. lintDsl(valved.body, index, toolName)           -- executor.ts:100-103
 * A case's `expect` determines which stage's result is asserted (see lint_cases.json's _meta).
 * `toolName` is optional per case (most cases omit it) -- see the vuln_field_* cases' citations.
 *
 * Exit code = number of FAILed cases.
 */

const path = require('path');
const fs = require('fs');

/** Plausible compiled locations if EVAL_GUARDRAILS_JS isn't set -- OSD plugins typically build to
 * a `target/` or `build/` tree via @osd/plugin-helpers; these are best-effort guesses, NOT
 * confirmed against an actual build output (that would require running the OSD build, which this
 * harness is explicitly told not to do) -- see eval/README.md. */
const FALLBACK_CANDIDATES = [
  path.join(__dirname, '..', 'target', 'server', 'tools', 'guardrails.js'),
  path.join(__dirname, '..', 'build', 'server', 'tools', 'guardrails.js'),
  path.join(
    __dirname,
    '..',
    'build',
    'kibana',
    'wazuh_ai_assistant',
    'server',
    'tools',
    'guardrails.js',
  ),
  path.join(
    __dirname,
    '..',
    'build',
    'opensearch-dashboards',
    'wazuh_ai_assistant',
    'server',
    'tools',
    'guardrails.js',
  ),
  path.join(__dirname, '..', 'dist', 'server', 'tools', 'guardrails.js'),
];

function resolveGuardrailsPath() {
  const fromEnv = process.env.EVAL_GUARDRAILS_JS;
  if (fromEnv) {
    if (!fs.existsSync(fromEnv)) {
      throw new Error(
        `EVAL_GUARDRAILS_JS points at a nonexistent file: ${fromEnv}`,
      );
    }
    return path.resolve(fromEnv);
  }
  const found = FALLBACK_CANDIDATES.find(candidate => fs.existsSync(candidate));
  if (found) {
    console.warn(
      `WARNING: EVAL_GUARDRAILS_JS not set; guessed ${found}. Verify this is really the compiled module.`,
    );
    return found;
  }
  throw new Error(
    'Could not find a compiled guardrails.js. Set EVAL_GUARDRAILS_JS to its path explicitly ' +
      '(see eval/README.md "Lint mode"). Tried:\n' +
      FALLBACK_CANDIDATES.map(candidate => `  - ${candidate}`).join('\n'),
  );
}

async function loadGuardrailsModule(modulePath) {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const mod = require(modulePath);
    return mod && mod.lintDsl ? mod : mod && mod.default ? mod.default : mod;
  } catch (error) {
    if (error && error.code === 'ERR_REQUIRE_ESM') {
      const mod = await import(`file://${modulePath.replace(/\\/g, '/')}`);
      return mod && mod.lintDsl ? mod : mod.default;
    }
    throw error;
  }
}

function deepGet(obj, path_) {
  return path_
    .split('.')
    .reduce(
      (acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined),
      obj,
    );
}

function runCase(testCase, guardrails) {
  const { checkIndexAllowlist, applySafetyValves, lintDsl } = guardrails;
  if (
    typeof checkIndexAllowlist !== 'function' ||
    typeof applySafetyValves !== 'function' ||
    typeof lintDsl !== 'function'
  ) {
    return {
      pass: false,
      reason:
        'guardrails module is missing checkIndexAllowlist/applySafetyValves/lintDsl exports',
    };
  }

  // Stage 1: index allowlist (executor.ts:87-90).
  const allowlistResult = checkIndexAllowlist(testCase.index);
  if (!allowlistResult.ok) {
    if (testCase.expect !== 'reject') {
      return {
        pass: false,
        reason: `unexpected index-allowlist rejection: ${allowlistResult.reason}`,
      };
    }
    const regex = new RegExp(testCase.reason_match, 'i');
    if (!regex.test(allowlistResult.reason)) {
      return {
        pass: false,
        reason: `reason "${allowlistResult.reason}" did not match /${testCase.reason_match}/i`,
      };
    }
    return { pass: true };
  }
  if (
    testCase.expect === 'reject' &&
    testCase.reason_match &&
    /not in the allowed set/i.test(testCase.reason_match)
  ) {
    return {
      pass: false,
      reason: 'expected an index-allowlist rejection but the index passed',
    };
  }

  // Stage 2: safety valves (executor.ts:92-95) -- clamps size/track_total_hits/timeout, or
  // rejects a too-deep `from`.
  const valved = applySafetyValves(testCase.body);
  if (!valved.ok) {
    if (testCase.expect !== 'reject') {
      return {
        pass: false,
        reason: `unexpected applySafetyValves rejection: ${valved.reason}`,
      };
    }
    const regex = new RegExp(testCase.reason_match, 'i');
    if (!regex.test(valved.reason)) {
      return {
        pass: false,
        reason: `reason "${valved.reason}" did not match /${testCase.reason_match}/i`,
      };
    }
    return { pass: true };
  }

  // Stage 3: static DSL lint. The index is passed through for the per-index checks (mandatory
  // time bound on time-based indices; vulnerability-field-on-findings/events-index). lintDsl takes
  // (body, index) only -- there is no per-tool `toolName` exemption.
  const lintResult = lintDsl(valved.body, testCase.index);
  if (!lintResult.ok) {
    if (testCase.expect !== 'reject') {
      return {
        pass: false,
        reason: `unexpected lintDsl rejection: ${lintResult.reason}`,
      };
    }
    const regex = new RegExp(testCase.reason_match, 'i');
    if (!regex.test(lintResult.reason)) {
      return {
        pass: false,
        reason: `reason "${lintResult.reason}" did not match /${testCase.reason_match}/i`,
      };
    }
    return { pass: true };
  }

  // Nothing rejected. For "reject" cases, that's a failure.
  if (testCase.expect === 'reject') {
    return {
      pass: false,
      reason:
        'expected a rejection (from index-allowlist, safety valves, or lintDsl), but everything passed',
    };
  }

  // For "clamp" cases, verify the documented field actually got clamped in the executed body.
  if (testCase.expect === 'clamp') {
    if (!testCase.clampField) {
      return {
        pass: false,
        reason:
          'lint_cases.json bug: expect:"clamp" case is missing clampField/clampValue',
      };
    }
    const actual = deepGet(valved.body, testCase.clampField);
    if (String(actual) !== String(testCase.clampValue)) {
      return {
        pass: false,
        reason: `expected ${testCase.clampField} to be clamped to ${
          testCase.clampValue
        }, got ${JSON.stringify(actual)}`,
      };
    }
    if (
      testCase.absentField &&
      deepGet(valved.body, testCase.absentField) !== undefined
    ) {
      return {
        pass: false,
        reason: `expected ${testCase.absentField} to be removed by the rewrite, but it is still present`,
      };
    }
    return { pass: true };
  }

  // expect:"pass" -- everything passing through untouched (aside from documented silent
  // rewrites like the forced track_total_hits/timeout) is exactly what we wanted.
  if (testCase.expect === 'pass') {
    return { pass: true };
  }

  return {
    pass: false,
    reason: `lint_cases.json bug: unknown expect value "${testCase.expect}"`,
  };
}

async function main() {
  const guardrailsPath = resolveGuardrailsPath();
  console.log(`Loading guardrails module from: ${guardrailsPath}\n`);
  const guardrails = await loadGuardrailsModule(guardrailsPath);

  const corpus = require(path.join(__dirname, 'lint_cases.json'));
  let failCount = 0;

  for (const testCase of corpus.cases) {
    let result;
    try {
      result = runCase(testCase, guardrails);
    } catch (error) {
      result = {
        pass: false,
        reason: `threw: ${
          error && error.message ? error.message : String(error)
        }`,
      };
    }
    console.log(
      `${result.pass ? 'PASS' : 'FAIL'}  ${testCase.name}  (expect: ${
        testCase.expect
      })`,
    );
    if (!result.pass) {
      console.log(`    - ${result.reason}`);
      failCount += 1;
    }
  }

  console.log('\n=== Summary ===');
  console.log(
    `PASS: ${corpus.cases.length - failCount}  FAIL: ${failCount}  TOTAL: ${
      corpus.cases.length
    }`,
  );
  process.exit(failCount);
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(2);
});
