import assert from 'node:assert/strict';
import { resolveStage2Tools, buildRoutingPrompt } from './router';

/**
 * Proves the "never route zero tools" fix: a stage-1 route of `general` alone must still resolve
 * a minimal recovery tool set (get_security_summary + search_wazuh_data) instead of `undefined`,
 * so a misclassified operational question can self-correct mid-turn instead of losing the data
 * path for the whole turn (see the "never route zero tools" issue). Also proves a normal
 * data-category resolution is unaffected by that change, and that the narrowed `general`
 * category description carries the explicit exclusion the fix relies on to reduce
 * misclassification in the first place.
 */

test('resolveStage2Tools(general) returns the minimal set, never undefined/empty', () => {
  const specs = resolveStage2Tools(['general']);
  assert.ok(Array.isArray(specs), 'must return an array, never undefined');
  const names = specs.map(spec => spec.name).sort();
  assert.deepEqual(names, ['get_security_summary', 'search_wazuh_data']);
});

test('resolveStage2Tools: a data category resolution is unchanged', () => {
  const specs = resolveStage2Tools(['agents']);
  const names = specs.map(spec => spec.name).sort();
  assert.deepEqual(names, ['get_agents', 'search_wazuh_data']);
});

test('resolveStage2Tools: general + a data category still resolves that category', () => {
  const specs = resolveStage2Tools(['general', 'findings']);
  const names = specs.map(spec => spec.name);
  assert.ok(names.includes('search_wazuh_data'));
  assert.ok(names.includes('get_critical_findings'));
  // Not the lone-`general` minimal-recovery branch, so no forced get_security_summary beyond
  // whatever `findings` itself already contributes.
});

test('the "general" category description carries the explicit exclusion', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const generalLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- general:'));
  assert.ok(generalLine, 'routing prompt must list a "general" menu entry');
  assert.match(
    generalLine as string,
    /do NOT pick general/,
    "general's description must explicitly exclude environment questions",
  );
});

test('the "findings" category description mentions top/noisiest agents (get_top_agents routing)', () => {
  // Pins get_top_agents' routing hint in TOOL_CATEGORY/CATEGORY_DESCRIPTIONS -- with no test, this
  // line has no guard against silently disappearing in a future three-way merge of router.ts.
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const findingsLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- findings:'));
  assert.ok(findingsLine, 'routing prompt must list a "findings" menu entry');
  assert.match(
    findingsLine as string,
    /top\/noisiest agents/,
    "findings' description must mention top/noisiest agents so get_top_agents-shaped questions route here",
  );
});
