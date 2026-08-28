import assert from 'node:assert/strict';
import { MAX_VISIBLE_RESULT_COLUMNS } from '../../../common/types';
import { listToolDefinitions } from '../registry';

/**
 * Registry-wide guard for the client-side column budget: result-table.tsx renders
 * only the first `MAX_VISIBLE_RESULT_COLUMNS` of a tool's `tableSpec.columns` as visible table
 * columns — anything after that is reachable only through the row expander. That budget is a
 * rendering invariant, but which columns fall past it is a SERVER-side ordering decision, and two
 * classes of column must never fall off the edge silently:
 *
 * 1. The SEVERITY column. A `severity: true` column demoted past the budget removes the one
 *    at-a-glance triage signal the badge exists for (the concrete regression this caught:
 *    get_mitre_findings' 7-column spec had Level at position 7 — the budget hid the severity
 *    badge from the exact tool whose findings are triaged by severity).
 *
 * 2. Nothing else is asserted here BY DESIGN: which non-severity columns win visibility is a
 *    per-tool editorial decision (each reordered tool records its reasoning in its own file),
 *    and pinning full orders here would just duplicate the per-tool tests. The invariant that
 *    generalizes — and that a future tool can silently violate — is the severity one.
 *
 * Driven from `listToolDefinitions()`; **nothing is exempt by default** — a new tool with a
 * severity column past the budget fails this test the moment it is registered.
 */
test('every severity column sits inside the visible-column budget', () => {
  const failures: string[] = [];
  for (const def of listToolDefinitions()) {
    const severityIndex = def.tableSpec.columns.findIndex(
      column => column.severity,
    );
    if (severityIndex === -1) {
      continue;
    }
    if (severityIndex >= MAX_VISIBLE_RESULT_COLUMNS) {
      failures.push(
        `${def.spec.name}: severity column "${
          def.tableSpec.columns[severityIndex].field
        }" is at position ${severityIndex + 1}, past the visible-column ` +
          `budget of ${MAX_VISIBLE_RESULT_COLUMNS} — the severity badge would be invisible. ` +
          'Reorder the tableSpec so severity is inside the budget.',
      );
    }
  }
  assert.deepEqual(failures, []);
});

test('at least one registered tool declares a severity column (mechanism sanity)', () => {
  // If the severity flag were renamed or dropped, the test above would pass vacuously — this
  // pins that the registry actually exercises it.
  assert.ok(
    listToolDefinitions().some(def =>
      def.tableSpec.columns.some(column => column.severity),
    ),
    'no registered tool declares a severity column — did TableColumn.severity change?',
  );
});
