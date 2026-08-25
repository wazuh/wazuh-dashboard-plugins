import assert from 'node:assert/strict';
import { getFimFilesTool } from './get-fim-files';

/**
 * EXPLAIN-WAVE PHASE 2 (eval item EV2-EXP-002, run 20260825-150326): the model called
 * `get_fim_files({ agent_id: 'win-ws-014' })` -- an agent NAME in a numeric-id-only parameter --
 * which `validateAgentId` rejects, so the round produced no table and no digest and the turn ended
 * on synthesised copy. The parameter's description was widened to say so.
 *
 * EXPLAIN-WAVE PHASE 5 (eval item EV2-FIM-001, run 20260825-193632) is the follow-up that phase 2
 * caused: telling the model to "resolve that name to its id first and pass the id" priced the
 * detour explicitly, and on a question that names the host ("which files changed on agent
 * win-ws-014 according to file integrity monitoring?") the model simply went to the
 * `search_wazuh_data` escape hatch instead, where `wazuh.agent.name` is one filter -- tool_selection
 * 1.00 -> 0.00, params 1.00 -> 0.00, and the whole `fim` family drop. The baseline reached this
 * tool only by burning three rounds (get_field_values -> search_wazuh_data -> get_fim_files "002"),
 * so the escape hatch was genuinely the cheaper route and no prompt clause was going to beat it.
 * The fix removes the reason instead: this tool now accepts the identifier the user actually said.
 *
 * Unlike get_sca_checks/get_sca_results, this tool has NO `soleCandidateParams`, so omitting BOTH
 * identifiers genuinely means "every agent" -- the description must say that, not the
 * resolves-to-one-agent wording those two carry.
 */

function propertyDescription(name: string): string {
  const properties = getFimFilesTool.spec.parameters.properties as Record<
    string,
    { description?: string }
  >;
  return properties[name]?.description ?? '';
}

function filterClauses(params: Record<string, unknown>): unknown[] {
  const request = getFimFilesTool.buildRequest(params);
  const body = request.body as {
    query: { bool: { filter: unknown[] } };
  };
  return body.query.bool.filter;
}

test('get_fim_files: agent_id is documented as numeric-only and points at agent_name', () => {
  const description = propertyDescription('agent_id');
  assert.match(description, /Numeric ids only/);
  assert.match(description, /an agent NAME here is rejected/);
  assert.match(
    description,
    /pass the name as "agent_name" instead/,
    'phase 5: the old copy sent the model off to resolve an id, which is what cost the routing',
  );
});

test('get_fim_files: agent_name is offered for the named-host case, with no id lookup', () => {
  const description = propertyDescription('agent_name');
  assert.notEqual(
    description,
    '',
    'agent_name must exist as a declared parameter',
  );
  assert.match(description, /there is no need to look its id up first/);
  assert.match(
    description,
    /"agent_id" wins/,
    'precedence must be stated where the model reads it, not only in code',
  );
});

test('get_fim_files: an agent_name scopes the query with a wazuh.agent.name match clause', () => {
  // Same clause shape get_agent_inventory's `resolveAgentFilter` uses for its own agent_name.
  assert.deepEqual(filterClauses({ agent_name: 'win-ws-014' }), [
    { match: { 'wazuh.agent.name': 'win-ws-014' } },
  ]);
});

test('get_fim_files: agent_id wins when both identifiers are supplied', () => {
  // An exact Manager-API identifier beats the fuzzier `match`, and the request stays byte-identical
  // to the one an id-only call built before agent_name existed.
  assert.deepEqual(
    filterClauses({ agent_id: '002', agent_name: 'win-ws-014' }),
    [{ term: { 'wazuh.agent.id': '002' } }],
  );
});

test('get_fim_files: an id-only call is unchanged by the new parameter', () => {
  assert.deepEqual(filterClauses({ agent_id: '002' }), [
    { term: { 'wazuh.agent.id': '002' } },
  ]);
});

test('get_fim_files: agent_name combines with path_prefix rather than replacing it', () => {
  assert.deepEqual(
    filterClauses({ agent_name: 'win-ws-014', path_prefix: 'C:\\Windows' }),
    [
      { match: { 'wazuh.agent.name': 'win-ws-014' } },
      { prefix: { 'file.path': 'C:\\Windows' } },
    ],
  );
});

test('get_fim_files: a blank agent_name does not silently scope the query', () => {
  // Whitespace is not a host name; treating it as one would turn a fleet-wide question into a
  // zero-row answer that reads like "no monitored files exist".
  assert.deepEqual(filterClauses({ agent_name: '   ' }), [{ match_all: {} }]);
});

test('get_fim_files: with neither identifier nor a path prefix, the query stays fleet-wide', () => {
  assert.deepEqual(filterClauses({}), [{ match_all: {} }]);
  assert.equal(
    getFimFilesTool.soleCandidateParams,
    undefined,
    'if sole-candidate resolution is ever added here, the description below becomes wrong',
  );
  assert.match(
    propertyDescription('agent_id'),
    /Leaving BOTH out searches every agent/,
  );
});

test('get_fim_files: the tool description scopes it to FILES and names the registry surface', () => {
  // The registry half of FIM has no typed tool but IS reachable (wazuh-states-fim-registry-*, via
  // search_wazuh_data on wazuh-states-*). Saying so here is what stops "FIM" reading as "this
  // tool" for a Run-key question -- the EV2-FIM-002 / EV2-EXP-002 shape.
  const description = getFimFilesTool.spec.description;
  assert.match(description, /covers FILES only/);
  assert.match(description, /wazuh-states-fim-registry-\*/);
  assert.match(description, /search_wazuh_data/);
  assert.match(
    description,
    /scope it with "agent_name" directly, no id lookup needed/,
  );
});
