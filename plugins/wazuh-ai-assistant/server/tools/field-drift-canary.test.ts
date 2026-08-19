import assert from 'node:assert/strict';
import {
  checkFieldDrift,
  flattenMappedFieldPaths,
  MappingClient,
  MappingsResponseBody,
} from './field-drift-canary';

/** Minimal fake Logger -- only the two levels this module calls. */
function fakeLogger() {
  const warn: string[] = [];
  const debug: string[] = [];
  return {
    warn: (msg: string) => warn.push(msg),
    debug: (msg: string) => debug.push(msg),
    get: () => fakeLogger() as unknown,
    warnMessages: warn,
    debugMessages: debug,
  };
}

function clientReturning(
  bodyByIndexPattern: Record<string, MappingsResponseBody>,
): MappingClient {
  return {
    indices: {
      async getMapping({ index }: { index: string }) {
        const body = bodyByIndexPattern[index];
        if (!body) {
          throw new Error(`no fixture for index pattern "${index}"`);
        }
        return { body };
      },
    },
  };
}

test('flattenMappedFieldPaths: flattens nested object properties into dot paths, never descending into multi-field "fields"', () => {
  const paths = flattenMappedFieldPaths({
    '@timestamp': { type: 'date' },
    agent: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'keyword', fields: { raw: { type: 'keyword' } } },
      },
    },
  });
  assert.deepEqual(
    [...paths].sort(),
    ['@timestamp', 'agent', 'agent.id', 'agent.name'],
  );
});

test('flattenMappedFieldPaths: an undefined properties tree yields an empty set', () => {
  assert.deepEqual(flattenMappedFieldPaths(undefined), new Set());
});

test('checkFieldDrift: logs nothing when every catalog field for a family is present live', async () => {
  // 'sca' is a small, real FIELD_CATALOG family -- build a live mapping that is a SUPERSET of it
  // (extra fields are fine; the canary only cares about MISSING ones).
  const { FIELD_CATALOG } = await import('../../common/field-catalog');
  const scaProperties: Record<string, unknown> = {};
  for (const entry of FIELD_CATALOG.sca) {
    const segments = entry.path.split('.');
    let node = scaProperties;
    for (const [i, segment] of segments.entries()) {
      if (i === segments.length - 1) {
        node[segment] = { type: entry.type };
      } else {
        node[segment] = node[segment] ?? { properties: {} };
        node = (node[segment] as { properties: Record<string, unknown> }).properties;
      }
    }
  }
  // checkFamily also live-checks the AGG_FIELD_ALLOWLIST fields get-field-values.ts knows for
  // "sca" (fieldsForFamily('sca')) -- wazuh.agent.id/wazuh.agent.name are not WCS/ECS paths, so
  // they are never in FIELD_CATALOG itself and must be added here too for this to be a genuine
  // no-drift fixture.
  (scaProperties.wazuh as { properties: Record<string, unknown> } | undefined) ??
    (scaProperties.wazuh = { properties: {} });
  const wazuhProperties = (
    scaProperties.wazuh as { properties: Record<string, unknown> }
  ).properties;
  wazuhProperties.agent = {
    properties: { id: { type: 'keyword' }, name: { type: 'keyword' } },
  };

  const client = clientReturning({
    'wazuh-states-sca*': {
      'wazuh-states-sca-000001': { mappings: { properties: scaProperties } },
    },
    // Other queried families in this run resolve to nothing -- treated as "no backing index yet",
    // not drift (see checkFamily's doc comment) -- so this test isolates the sca case cleanly.
    'wazuh-findings-v5*': {},
    'wazuh-events-v5*': {},
    'wazuh-states-vulnerabilities*': {},
    'wazuh-states-fim-files*': {},
    'wazuh-states-inventory-system*': {},
    'wazuh-states-inventory-packages*': {},
    'wazuh-states-inventory-ports*': {},
    'wazuh-states-inventory-processes*': {},
    'wazuh-states-inventory-hotfixes*': {},
  });
  const logger = fakeLogger();
  await checkFieldDrift(client, logger as never);
  assert.deepEqual(logger.warnMessages, []);
});

test('checkFieldDrift: warns, prefixed "[field-drift]", for a catalog field missing from the live mapping', async () => {
  const client = clientReturning({
    'wazuh-states-sca*': {
      'wazuh-states-sca-000001': {
        mappings: {
          properties: {
            check: { properties: { id: { type: 'keyword' } } },
            // 'policy.id'/'policy.name' etc. deliberately omitted -- simulates a renamed/dropped
            // field group.
          },
        },
      },
    },
    'wazuh-findings-v5*': {},
    'wazuh-events-v5*': {},
    'wazuh-states-vulnerabilities*': {},
    'wazuh-states-fim-files*': {},
    'wazuh-states-inventory-system*': {},
    'wazuh-states-inventory-packages*': {},
    'wazuh-states-inventory-ports*': {},
    'wazuh-states-inventory-processes*': {},
    'wazuh-states-inventory-hotfixes*': {},
  });
  const logger = fakeLogger();
  await checkFieldDrift(client, logger as never);
  assert.ok(logger.warnMessages.length > 0, 'expected at least one warning');
  for (const message of logger.warnMessages) {
    assert.match(message, /^\[field-drift\]/);
  }
  assert.ok(
    logger.warnMessages.some(message => message.includes('"policy.id"')),
    'expected a warning naming the missing "policy.id" field',
  );
});

test('checkFieldDrift: a family whose index pattern matches nothing live is not drift', async () => {
  const client = clientReturning({
    'wazuh-states-sca*': {},
    'wazuh-findings-v5*': {},
    'wazuh-events-v5*': {},
    'wazuh-states-vulnerabilities*': {},
    'wazuh-states-fim-files*': {},
    'wazuh-states-inventory-system*': {},
    'wazuh-states-inventory-packages*': {},
    'wazuh-states-inventory-ports*': {},
    'wazuh-states-inventory-processes*': {},
    'wazuh-states-inventory-hotfixes*': {},
  });
  const logger = fakeLogger();
  await checkFieldDrift(client, logger as never);
  assert.deepEqual(logger.warnMessages, []);
});

test('checkFieldDrift: never throws when the client itself errors for a family -- logged at debug, other families still checked', async () => {
  const client: MappingClient = {
    indices: {
      async getMapping({ index }: { index: string }) {
        if (index === 'wazuh-states-sca*') {
          throw new Error('simulated indexer unreachable');
        }
        return { body: {} };
      },
    },
  };
  const logger = fakeLogger();
  await assert.doesNotReject(checkFieldDrift(client, logger as never));
  assert.ok(
    logger.debugMessages.some(
      message =>
        message.includes('[field-drift]') && message.includes('simulated indexer unreachable'),
    ),
  );
});
