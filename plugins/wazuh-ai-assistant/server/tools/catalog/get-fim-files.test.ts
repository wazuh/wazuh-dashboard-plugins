import assert from 'node:assert/strict';
import { getFimFilesTool } from './get-fim-files';

/**
 * This tool accepts an agent NAME as well as a numeric id. An id-only schema rejects
 * `get_fim_files({ agent_id: '<host name>' })` outright (`validateAgentId`), and telling the model
 * to resolve the name first only prices the detour -- making the `search_wazuh_data` escape hatch,
 * where `wazuh.agent.name` is one filter, the genuinely cheaper route. No prompt clause preferring
 * the typed tool beats a real cost difference, so the schema removes the difference.
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
    'the old copy sent the model off to resolve an id, which is what cost the routing',
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
  assert.deepEqual(filterClauses({ agent_name: 'web-server-01' }), [
    { match: { 'wazuh.agent.name': 'web-server-01' } },
  ]);
});

test('get_fim_files: agent_id wins when both identifiers are supplied', () => {
  // An exact Manager-API identifier beats the fuzzier `match`, and the request stays byte-identical
  // to the one an id-only call built before agent_name existed.
  assert.deepEqual(
    filterClauses({ agent_id: '002', agent_name: 'web-server-01' }),
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
    filterClauses({ agent_name: 'web-server-01', path_prefix: 'C:\\Windows' }),
    [
      { match: { 'wazuh.agent.name': 'web-server-01' } },
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
  // tool" for a Run-key question.
  const description = getFimFilesTool.spec.description;
  assert.match(description, /covers FILES only/);
  assert.match(description, /wazuh-states-fim-registry-\*/);
  assert.match(description, /search_wazuh_data/);
  assert.match(
    description,
    /scope it with "agent_name" directly, no id lookup needed/,
  );
});
