import assert from 'node:assert/strict';
import {
  resolveStage2Tools,
  buildRoutingPrompt,
  CO_ROUTED_CATEGORIES,
  withCoRoutedCategories,
} from './router';

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

// --- issue #8935: deterministic co-routing for overlapping category vocabulary -------------------

test('resolveStage2Tools: routing to compliance also offers the SCA tools', () => {
  // The measured defect: "How badly are we failing CIS, in plain numbers?" routed to
  // ["compliance"] on 3/3 instrumented runs, and get_sca_results -- which holds the answer -- was
  // never offered, so the assistant truthfully reported that none of the tools it HAD covered CIS.
  const names = resolveStage2Tools(['compliance']).map(spec => spec.name);
  assert.ok(
    names.includes('get_sca_results'),
    'get_sca_results must be offered',
  );
  assert.ok(names.includes('get_sca_checks'), 'get_sca_checks must be offered');
  // The originally-routed category's own tools must survive co-routing.
  assert.ok(names.includes('get_compliance_summary'));
  assert.ok(names.includes('get_compliance_alerts'));
});

test('resolveStage2Tools: routing to sca also offers the compliance tools (symmetric)', () => {
  // Symmetric on purpose: "which PCI controls are we failing" deserves the SCA tools for the same
  // reason the CIS question deserves the compliance ones -- in Wazuh either side can hold the answer.
  const names = resolveStage2Tools(['sca']).map(spec => spec.name);
  assert.ok(names.includes('get_compliance_summary'));
  assert.ok(names.includes('get_sca_results'));
});

test('withCoRoutedCategories: order-preserving, deduped, and does not widen `general`', () => {
  assert.deepEqual(withCoRoutedCategories(['compliance']), [
    'compliance',
    'sca',
  ]);
  assert.deepEqual(withCoRoutedCategories(['sca']), ['sca', 'compliance']);
  // Already both: no duplicates, original order kept.
  assert.deepEqual(withCoRoutedCategories(['sca', 'compliance']), [
    'sca',
    'compliance',
  ]);
  // `general` is the no-data-path recovery category; widening it would defeat the minimal recovery
  // set resolveStage2Tools falls back to.
  assert.deepEqual(withCoRoutedCategories(['general']), ['general']);
  // An unrelated category is untouched.
  assert.deepEqual(withCoRoutedCategories(['fim']), ['fim']);
});

test('CO_ROUTED_CATEGORIES: every pair is symmetric and names a real category (coverage)', () => {
  // A one-way pair would silently make routing asymmetric: the CIS question would find SCA but a
  // PCI question would not find the benchmark data, and nothing else in the suite would notice.
  const failures: string[] = [];
  for (const [category, siblings] of Object.entries(CO_ROUTED_CATEGORIES)) {
    for (const sibling of siblings ?? []) {
      if (!(CO_ROUTED_CATEGORIES[sibling] ?? []).includes(category as never)) {
        failures.push(`${category} -> ${sibling} is not mirrored back`);
      }
      if (resolveStage2Tools([sibling]).length === 0) {
        failures.push(`${sibling} resolves to no tools`);
      }
    }
  }
  assert.deepEqual(failures, []);
  assert.ok(
    Object.keys(CO_ROUTED_CATEGORIES).length > 0,
    'the map must not be empty, or these tests pass vacuously',
  );
});

test('every general-alone turn still gets the minimal recovery set, unchanged by co-routing', () => {
  const names = resolveStage2Tools(['general']).map(spec => spec.name);
  assert.deepEqual(names.sort(), ['get_security_summary', 'search_wazuh_data']);
});
