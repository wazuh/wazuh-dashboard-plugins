import assert from 'node:assert/strict';
import { getVulnerabilitiesByAgentTool } from './get-vulnerabilities-by-agent';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getVulnerabilitiesByAgentTool.buildRequest(params) as IndexerRequest;
}

test('get_vulnerabilities_by_agent: buildRequest matches agent_identifier against name OR id', () => {
  const request = build({ agent_identifier: 'web-prod-01' });
  assert.equal(request.index, 'wazuh-states-vulnerabilities*');
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        {
          multi_match: {
            query: 'web-prod-01',
            fields: ['wazuh.agent.name', 'wazuh.agent.id'],
          },
        },
      ],
    },
  });
});

// Generic sole-candidate parameter resolution (template: #8913's resolveDeicticAgentParams in
// get-agent-inventory.ts): agent_identifier is schema-OPTIONAL, resolving via the generic
// resolver (param-resolution.ts) with valueFrom: 'id-or-name' since this param already accepts
// either shape -- the resolved agent's id is injected (exact, unambiguous).

test('get_vulnerabilities_by_agent: agent_identifier is schema-optional, not required', () => {
  const schema = getVulnerabilitiesByAgentTool.spec.parameters as {
    required?: string[];
  };
  assert.ok(
    !schema.required || !schema.required.includes('agent_identifier'),
    'agent_identifier must not be schema-required -- server-side resolution needs it omittable',
  );
});

test('get_vulnerabilities_by_agent: agent_identifier\'s description explains server-side resolution on omission', () => {
  const schema = getVulnerabilitiesByAgentTool.spec.parameters as {
    properties: Record<string, { description?: string }>;
  };
  assert.match(
    schema.properties.agent_identifier.description ?? '',
    /Optional: omit this.*resolves to the only active agent automatically/s,
  );
});

test('get_vulnerabilities_by_agent: declares agent_identifier as a manager-agents sole-candidate param, valueFrom "id-or-name"', () => {
  assert.deepEqual(getVulnerabilitiesByAgentTool.soleCandidateParams, [
    {
      param: 'agent_identifier',
      source: { kind: 'manager-agents' },
      valueFrom: 'id-or-name',
    },
  ]);
});
