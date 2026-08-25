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
      getMapping({ index }: { index: string }) {
        const body = bodyByIndexPattern[index];
        if (!body) {
          return Promise.reject(
            new Error(`no fixture for index pattern "${index}"`),
          );
        }
        return Promise.resolve({ body });
      },
    },
  };
}

/** Every OTHER queried family's index pattern resolving to "no backing index" (empty body) --
 * treated as "nothing to check yet", not drift (see field-drift-canary.ts's `checkFamily` doc
 * comment) -- so a fixture can isolate the one family it actually cares about. */
const OTHER_EMPTY_FAMILY_INDICES: Record<string, MappingsResponseBody> = {
  'wazuh-findings-v5*': {},
  'wazuh-events-v5*': {},
  'wazuh-states-vulnerabilities*': {},
  'wazuh-states-inventory-system*': {},
  'wazuh-states-inventory-packages*': {},
  'wazuh-states-inventory-ports*': {},
};

/** Sets one leaf field (`path`, dot-separated) on a mapping `properties` tree, creating every
 * intermediate object-with-`properties` node it needs along the way. Safe to call repeatedly for
 * overlapping paths (e.g. "check.id" then "check.result") -- an existing intermediate node is
 * reused rather than clobbered, unlike a naive `node[segment] = node[segment] ?? {...}` inline
 * loop (which breaks the moment segment 0 of one path was already written as a LEAF by a
 * previous, unrelated single-segment path). */
function setMappingLeaf(
  root: Record<string, unknown>,
  path: string,
  type: string,
): void {
  const segments = path.split('.');
  let node = root;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      node[segment] = { type };
      return;
    }
    const existing = node[segment] as
      | { properties?: Record<string, unknown> }
      | undefined;
    if (!existing || typeof existing !== 'object' || !existing.properties) {
      node[segment] = { properties: {} };
    }
    node = (node[segment] as { properties: Record<string, unknown> })
      .properties;
  });
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
  assert.deepEqual([...paths].sort(), [
    '@timestamp',
    'agent',
    'agent.id',
    'agent.name',
  ]);
});

test('flattenMappedFieldPaths: an undefined properties tree yields an empty set', () => {
  assert.deepEqual(flattenMappedFieldPaths(undefined), new Set());
});

/** Builds a full, genuinely no-drift SCA mapping tree: every `FIELD_CATALOG.sca` path plus every
 * `fieldsForFamily('sca')` allowlist path (the latter are `wazuh.*` fields, never in
 * `FIELD_CATALOG` itself -- see field-drift-canary.ts's `QUERIED_FAMILIES` doc comment) minus
 * whichever `pathsToOmit` the caller wants to simulate as dropped/renamed. */
async function buildScaProperties(
  pathsToOmit: string[] = [],
): Promise<Record<string, unknown>> {
  const { FIELD_CATALOG } = await import('../../common/field-catalog');
  const { fieldsForFamily } = await import('./catalog/get-field-values');
  const omit = new Set(pathsToOmit);
  const properties: Record<string, unknown> = {};
  const allPaths = [...FIELD_CATALOG.sca, ...fieldsForFamily('sca')];
  for (const path of allPaths) {
    if (!omit.has(path)) {
      setMappingLeaf(properties, path, 'keyword');
    }
  }
  return properties;
}

test('checkFieldDrift: logs nothing when every catalog + tool-filter field for a family is present live', async () => {
  const properties = await buildScaProperties();
  const client = clientReturning({
    'wazuh-states-sca*': {
      'wazuh-states-sca-000001': { mappings: { properties } },
    },
    ...OTHER_EMPTY_FAMILY_INDICES,
  });
  const logger = fakeLogger();
  await checkFieldDrift(client, logger as never);
  assert.deepEqual(logger.warnMessages, []);
});

test('checkFieldDrift: warns, prefixed "[field-drift]", for a TOOL-FACING field missing from the live mapping', async () => {
  // Every other sca/tool-filter field present; ONLY "policy.id" (a fieldsForFamily('sca') field,
  // consumed by get_field_values) simulated as dropped/renamed -- keeps this fixture to a single
  // missing field, well inside MAX_MISSING_FIELDS_LOGGED_PER_FAMILY, so the assertion below cannot
  // be defeated by the per-family log cap.
  const properties = await buildScaProperties(['policy.id']);
  const client = clientReturning({
    'wazuh-states-sca*': {
      'wazuh-states-sca-000001': { mappings: { properties } },
    },
    ...OTHER_EMPTY_FAMILY_INDICES,
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
  // Nothing else was omitted -- exactly one missing-field line (plus no "additional" remainder
  // line, since 1 is well under the cap).
  assert.equal(logger.warnMessages.length, 1);
});

test(
  'checkFieldDrift: warns for a CATALOG-ONLY field are demoted to debug, never warn -- code ' +
    'review B2/B3 (AI/plan/b-review.md)',
  async () => {
    // "check.rationale" is a FIELD_CATALOG.sca entry with no get-field-values.ts tool field of its
    // own -- simulate it as dropped/renamed while every tool-facing field stays present.
    //
    // EXPLAIN-WAVE PHASE 6: this fixture used "check.id" until `state-families.ts` opened the
    // state schema to get_field_values, which made check.id (and policy.name) genuinely
    // TOOL-FACING for the sca family. The old choice would now correctly warn, so the fixture
    // moved to a field that is still catalog-only -- the test's subject is the warn/debug
    // DEMOTION, not which particular field happens to be untooled this month.
    const properties = await buildScaProperties(['check.rationale']);
    const client = clientReturning({
      'wazuh-states-sca*': {
        'wazuh-states-sca-000001': { mappings: { properties } },
      },
      ...OTHER_EMPTY_FAMILY_INDICES,
    });
    const logger = fakeLogger();
    await checkFieldDrift(client, logger as never);
    assert.deepEqual(logger.warnMessages, []);
    assert.ok(
      logger.debugMessages.some(message =>
        message.includes('"check.rationale"'),
      ),
      'expected a DEBUG line naming the missing catalog-only "check.rationale" field',
    );
  },
);

test(
  'checkFieldDrift: a live mapping missing MOST of the WCS catalog for a family, but every ' +
    'tool-facing field present, produces no warnings -- fixture is independent of FIELD_CATALOG ' +
    '(code review B3, AI/plan/b-review.md: the old mirror-test fixture was BUILT FROM ' +
    'FIELD_CATALOG.sca itself, so "logs nothing when everything is present" was true by ' +
    'construction and could never observe the real bug (B2): the live index TEMPLATE maps far ' +
    'fewer fields than the WCS schema defines. This fixture hand-lists only a handful of real ' +
    'sca fields plus every get-field-values.ts tool field, which is what a genuinely healthy ' +
    '"template is a subset of the schema" live mapping actually looks like -- it fails on the ' +
    'pre-B2 code (which warned on every catalog field not in this deliberately small mapping) and ' +
    'passes after the fix.',
  async () => {
    const { fieldsForFamily } = await import('./catalog/get-field-values');
    const properties: Record<string, unknown> = {};
    for (const path of fieldsForFamily('sca')) {
      setMappingLeaf(properties, path, 'keyword');
    }
    // A small, realistic subset of the WCS sca schema -- deliberately NOT the full
    // FIELD_CATALOG.sca list (52 fields), matching how a real live template maps a subset of the
    // schema, not the whole thing.
    setMappingLeaf(properties, 'check.id', 'keyword');
    setMappingLeaf(properties, '@timestamp', 'date');
    const client = clientReturning({
      'wazuh-states-sca*': {
        'wazuh-states-sca-000001': { mappings: { properties } },
      },
      ...OTHER_EMPTY_FAMILY_INDICES,
    });
    const logger = fakeLogger();
    await checkFieldDrift(client, logger as never);
    assert.deepEqual(logger.warnMessages, []);
  },
);

test('checkFieldDrift: a family whose index pattern matches nothing live is not drift', async () => {
  const client = clientReturning({
    'wazuh-states-sca*': {},
    ...OTHER_EMPTY_FAMILY_INDICES,
  });
  const logger = fakeLogger();
  await checkFieldDrift(client, logger as never);
  assert.deepEqual(logger.warnMessages, []);
});

test('checkFieldDrift: never throws when the client itself errors for a family -- logged at debug, other families still checked', async () => {
  const client: MappingClient = {
    indices: {
      getMapping({ index }: { index: string }) {
        if (index === 'wazuh-states-sca*') {
          return Promise.reject(new Error('simulated indexer unreachable'));
        }
        return Promise.resolve({ body: {} });
      },
    },
  };
  const logger = fakeLogger();
  await assert.doesNotReject(checkFieldDrift(client, logger as never));
  assert.ok(
    logger.debugMessages.some(
      message =>
        message.includes('[field-drift]') &&
        message.includes('simulated indexer unreachable'),
    ),
  );
});
