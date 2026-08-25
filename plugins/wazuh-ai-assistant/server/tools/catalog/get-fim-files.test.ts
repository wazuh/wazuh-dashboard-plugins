import assert from 'node:assert/strict';
import { getFimFilesTool } from './get-fim-files';

/**
 * EXPLAIN-WAVE PHASE 2 (eval item EV2-EXP-002, run 20260825-150326): the model called
 * `get_fim_files({ agent_id: 'win-ws-014' })` -- an agent NAME in a numeric-id-only parameter --
 * which `validateAgentId` rejects, so the round produced no table and no digest and the turn ended
 * on synthesised copy. The parameter's description said only "Optional numeric Wazuh agent ID to
 * scope to one agent", which is true but does not tell a model holding a NAME what to do.
 *
 * Unlike get_sca_checks/get_sca_results, this tool has NO `soleCandidateParams`, so omitting
 * `agent_id` genuinely means "every agent" -- the description must say that, not the
 * resolves-to-one-agent wording those two carry.
 */

function agentIdDescription(): string {
  const properties = getFimFilesTool.spec.parameters.properties as Record<
    string,
    { description?: string }
  >;
  return properties.agent_id.description ?? '';
}

test('get_fim_files: agent_id is documented as numeric-only, with a name to be resolved first', () => {
  const description = agentIdDescription();
  assert.match(description, /Numeric ids only/);
  assert.match(description, /an agent NAME here is rejected/);
  assert.match(description, /resolve that name to its id first/);
});

test('get_fim_files: the description states that omitting agent_id searches every agent', () => {
  // Load-bearing: the sibling SCA tools resolve an omitted agent_id to ONE agent, and copying that
  // wording here would be false for this tool.
  assert.match(agentIdDescription(), /Leaving this out searches every agent/);
  assert.equal(
    getFimFilesTool.soleCandidateParams,
    undefined,
    'if sole-candidate resolution is ever added here, the description above becomes wrong',
  );
});
