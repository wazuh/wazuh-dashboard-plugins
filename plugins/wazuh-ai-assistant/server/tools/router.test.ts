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

/**
 * Out-of-scope regression: M-OOS-01/02 (active-response questions) and M-OOS-05 (agent
 * comms-channel health) were mis-routed onto adjacent tools (get_brute_force,
 * get_events_by_agent, get_agents) instead of being declined, because neither category's
 * stage-1 menu line said what it does NOT cover. These two categories' descriptions must carry
 * that exclusion so a mismatch is visible before stage 2 ever offers the misleading tool.
 */
test('the "findings" category description excludes active-response actions', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const findingsLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- findings:'));
  assert.ok(findingsLine, 'routing prompt must list a "findings" menu entry');
  assert.match(
    findingsLine as string,
    /NOT automated actions Wazuh took/,
    "findings's description must explicitly exclude active-response actions",
  );
});

test('the "agents" category description excludes comms-channel health', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const agentsLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- agents:'));
  assert.ok(agentsLine, 'routing prompt must list an "agents" menu entry');
  assert.match(
    agentsLine as string,
    /NOT comms-channel health/,
    "agents's description must explicitly exclude comms-channel health",
  );
});
