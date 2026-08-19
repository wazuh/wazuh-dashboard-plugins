import assert from 'node:assert/strict';
import {
  FIELD_CATALOG,
  FIELD_ALIASES,
  FIELD_CATALOG_TOTAL_FIELDS,
  isKnownField,
  resolveFieldAlias,
} from './field-catalog';

test('FIELD_CATALOG covers the index families the catalog tools query', () => {
  const expectedFamilies = [
    'events.main',
    'events.findings',
    'inventory.system',
    'inventory.packages',
    'inventory.ports',
    'inventory.processes',
    'inventory.hotfixes',
    'inventory.users',
    'inventory.groups',
    'inventory.networks',
    'inventory.interfaces',
    'inventory.services',
    'inventory.hardware',
    'inventory.protocols',
    'inventory.browser_extensions',
    'sca',
    'vulnerabilities',
    'fim.files',
    'fim.windows_registry_keys',
    'fim.windows_registry_values',
  ];
  for (const family of expectedFamilies) {
    assert.ok(
      Array.isArray(FIELD_CATALOG[family]),
      `expected FIELD_CATALOG to have a "${family}" entry`,
    );
    assert.ok(
      FIELD_CATALOG[family].length > 0,
      `expected "${family}" to have at least one indexed field`,
    );
  }
});

test('every entry has a non-empty path and type', () => {
  for (const [family, entries] of Object.entries(FIELD_CATALOG)) {
    for (const entry of entries) {
      assert.ok(entry.path.length > 0, `${family}: empty path`);
      assert.ok(entry.type.length > 0, `${family}: empty type for ${entry.path}`);
    }
  }
});

test('no duplicate paths within a family', () => {
  for (const [family, entries] of Object.entries(FIELD_CATALOG)) {
    const paths = entries.map(entry => entry.path);
    assert.equal(
      new Set(paths).size,
      paths.length,
      `${family}: duplicate field path found`,
    );
  }
});

test('FIELD_CATALOG_TOTAL_FIELDS matches the sum of every family', () => {
  const total = Object.values(FIELD_CATALOG).reduce(
    (sum, entries) => sum + entries.length,
    0,
  );
  assert.equal(FIELD_CATALOG_TOTAL_FIELDS, total);
});

test('the host.os.* / host.name aliases exist for events.main and events.findings only, ' +
  'and never point at themselves', () => {
  for (const family of ['events.main', 'events.findings']) {
    const aliases = FIELD_ALIASES[family];
    assert.ok(aliases, `expected FIELD_ALIASES to cover "${family}"`);
    assert.equal(aliases['host.os.name'], 'wazuh.agent.host.os.name');
    assert.equal(aliases['host.name'], 'wazuh.agent.host.name');
    for (const [source, target] of Object.entries(aliases)) {
      assert.notEqual(source, target);
    }
  }
});

test('isKnownField finds catalog fields and alias sources, and fails closed on an unknown family', () => {
  assert.equal(isKnownField('events.main', '@timestamp'), true);
  assert.equal(isKnownField('events.main', 'host.os.name'), true);
  assert.equal(isKnownField('events.main', 'this.field.does.not.exist'), false);
  assert.equal(isKnownField('not_a_real_family', '@timestamp'), false);
});

test('resolveFieldAlias routes the empty ECS OS fields to the populated wazuh.agent.host.* twin, ' +
  'and passes through anything else unchanged', () => {
  assert.equal(
    resolveFieldAlias('events.main', 'host.os.name'),
    'wazuh.agent.host.os.name',
  );
  assert.equal(
    resolveFieldAlias('events.findings', 'host.name'),
    'wazuh.agent.host.name',
  );
  assert.equal(
    resolveFieldAlias('events.main', 'agent.id'),
    'agent.id',
  );
  assert.equal(
    resolveFieldAlias('sca', 'check.id'),
    'check.id',
  );
});

test('sca and vulnerabilities catalogs contain the fields the existing tools already rely on', () => {
  const scaPaths = new Set(FIELD_CATALOG.sca.map(e => e.path));
  assert.ok(scaPaths.has('check.id'));
  assert.ok(scaPaths.has('check.result'));
  assert.ok(scaPaths.has('policy.id'));

  const vulnPaths = new Set(FIELD_CATALOG.vulnerabilities.map(e => e.path));
  assert.ok(vulnPaths.has('vulnerability.id'));
  assert.ok(vulnPaths.has('vulnerability.severity'));
  assert.ok(vulnPaths.has('package.name'));
});
