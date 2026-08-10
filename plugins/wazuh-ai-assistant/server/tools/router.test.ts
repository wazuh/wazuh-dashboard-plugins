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
 * Issue #8913's own worked example ("What software does this box have installed?") measured
 * live at 0/5 for `get_agent_inventory` even AFTER the tool learned to self-resolve a missing
 * agent (see get-agent-inventory.ts's `resolveDeicticAgentParams`) -- because stage 1 never
 * routed to the `inventory` category in the first place, so the tool was never even offered in
 * stage 2 (`resolveStage2Tools`). The pre-fix `inventory` description said "installed packages"
 * but never the word "software", and had no note that a vague host reference ("this box") is
 * still an inventory-domain question rather than an identity question. Pin both additions here
 * so a future reword silently regresses this instead of failing loudly.
 */
test('the "inventory" category description covers "software" and vague host phrasing', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const inventoryLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- inventory:'));
  assert.ok(
    inventoryLine,
    'routing prompt must list an "inventory" menu entry',
  );
  assert.match(
    inventoryLine as string,
    /\bsoftware\b/i,
    'inventory description must literally say "software", not just "installed packages", to ' +
      "match #8913's exact worked-example phrasing",
  );
  assert.match(
    inventoryLine as string,
    /this box\/server\/machine/,
    'inventory description must call out vague host references as still in-scope, not just ' +
      'named/numbered agents',
  );
});
