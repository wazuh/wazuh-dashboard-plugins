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
