import assert from 'node:assert/strict';
import { searchWazuhDataTool } from './search-wazuh-data';

// Issue #8917: `failClosedFieldPolicy` must be set explicitly on the genuine escape hatch, not
// merely inherited from `deriveColumns` (which is now a separate flag that only controls column
// derivation -- see ToolDefinition.failClosedFieldPolicy's doc comment in types.ts). This tool's
// arbitrary caller-supplied DSL is exactly the case field policy hardening exists for, so this
// must never be flipped to `false`/omitted.
test('search_wazuh_data: deriveColumns and failClosedFieldPolicy are both explicitly true', () => {
  assert.equal(searchWazuhDataTool.deriveColumns, true);
  assert.equal(searchWazuhDataTool.failClosedFieldPolicy, true);
});

// EXPLAIN-WAVE PHASE 5 -- escape-hatch drift (eval run 20260825-193632, EV2-FIM-001). The answer
// was correct and FASTER, but it came from this tool instead of get_fim_files: tool_selection
// 1.00 -> 0.00, params 1.00 -> 0.00, and the whole `fim` family drop. "Prefer a typed tool first"
// was already here and lost to a real cost difference, so the primary fix is get_fim_files' new
// `agent_name` parameter (which removes that difference). This clause is the second half: it says
// WHY the typed tool still wins when both can find the same rows -- curated columns and
// population-true totals this tool cannot produce -- rather than restating a preference.
test('search_wazuh_data: the description scopes it to gaps a typed tool does not cover', () => {
  const description = searchWazuhDataTool.spec.description;
  assert.match(
    description,
    /Prefer a typed tool first when one matches the question/,
  );
  assert.match(
    description,
    /Use it ONLY when no dedicated tool covers the surface the question is about/,
  );
  assert.match(
    description,
    /never pick this tool merely to avoid a typed tool's parameters/,
    'the measured drift shape: the typed tool wanted an id, this one took a name',
  );
});

test('search_wazuh_data: the index_pattern description still names the FIM registry surface', () => {
  // The registry route the system prompt states depends on the model reading, from this schema,
  // that wazuh-states-* covers registry state -- the label it used to carry said only "FIM".
  const properties = searchWazuhDataTool.spec.parameters.properties as Record<
    string,
    { description?: string }
  >;
  assert.match(
    properties.index_pattern.description ?? '',
    /Windows registry keys\/values/,
  );
});
