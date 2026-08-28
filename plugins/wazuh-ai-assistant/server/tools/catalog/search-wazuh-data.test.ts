import assert from 'node:assert/strict';
import { searchWazuhDataTool } from './search-wazuh-data';

// `failClosedFieldPolicy` must be set explicitly on the genuine escape hatch, not
// merely inherited from `deriveColumns` (which is now a separate flag that only controls column
// derivation -- see ToolDefinition.failClosedFieldPolicy's doc comment in types.ts). This tool's
// arbitrary caller-supplied DSL is exactly the case field policy hardening exists for, so this
// must never be flipped to `false`/omitted.
test('search_wazuh_data: deriveColumns and failClosedFieldPolicy are both explicitly true', () => {
  assert.equal(searchWazuhDataTool.deriveColumns, true);
  assert.equal(searchWazuhDataTool.failClosedFieldPolicy, true);
});

// "Prefer a typed tool first" loses to a real cost difference on its own, so this clause has to say
// WHY the typed tool wins when both can find the same rows -- curated columns and population-true
// totals this tool cannot produce -- rather than restating the preference. The other half of the
// same rule is get_fim_files' `agent_name` parameter, which removes the cost difference.
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
  // that wazuh-states-* covers registry state, not only FIM.
  const properties = searchWazuhDataTool.spec.parameters.properties as Record<
    string,
    { description?: string }
  >;
  assert.match(
    properties.index_pattern.description ?? '',
    /Windows registry keys\/values/,
  );
});
