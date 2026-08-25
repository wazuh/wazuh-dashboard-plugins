import assert from 'node:assert/strict';
import {
  STATE_AGG_FIELDS,
  STATE_FAMILIES,
  STATE_FAMILY_UNKNOWN_CATALOG_FAMILIES,
  STATE_FAMILY_UNKNOWN_FIELDS,
  stateFamilyLabel,
} from './state-families';
import { checkIndexAllowlist, isAggAllowedField } from './guardrails';
import { FIELD_CATALOG } from '../../common/field-catalog';

// EXPLAIN-WAVE PHASE 6. These tests pin the two claims this module makes that are not visible by
// reading it: that every declared field actually EXISTS (per the generated WCS catalog, not per
// the author's memory), and that every declared index is actually REACHABLE (per the guardrail,
// not per the regex reading true). Both are the "widen it in one list, forget the other" drift
// `generic-query-families.ts`'s own header calls out -- with one more list now in the set.

test('every declared state field is a known field of its catalog family', () => {
  assert.deepEqual(
    STATE_FAMILY_UNKNOWN_FIELDS,
    [],
    'a declared field path is absent from common/field-catalog.ts -- either the platform renamed ' +
      'it (fix the declaration) or the catalog needs regenerating; an allowlist entry for a ' +
      'non-existent field can only ever produce an empty aggregation',
  );
});

test('every declared catalog family exists in FIELD_CATALOG', () => {
  assert.deepEqual(STATE_FAMILY_UNKNOWN_CATALOG_FAMILIES, []);
});

test('every state family pattern is accepted by checkIndexAllowlist', () => {
  // The exact failure this whole phase exists to fix, in its second form: these indices were
  // allowlisted all along and simply not enumerable. Assert the acceptance rather than trusting
  // the reading of INDEX_ALLOWLIST_RE.
  for (const family of STATE_FAMILIES) {
    assert.equal(
      checkIndexAllowlist(family.pattern).ok,
      true,
      `pattern "${family.pattern}" is offered to the model but rejected by the guardrail`,
    );
  }
});

test('every state family pattern targets the wazuh-states- namespace and is unique', () => {
  const patterns = STATE_FAMILIES.map(family => family.pattern);
  for (const pattern of patterns) {
    assert.ok(
      pattern.startsWith('wazuh-states-'),
      `"${pattern}" is not a current-state index`,
    );
  }
  assert.equal(new Set(patterns).size, patterns.length);
});

test('a family that opens a field-discovery route declares a tool family, and vice versa', () => {
  // `get-field-values.ts` keys its `index_family` enum on `toolFamily`; a family with fields but
  // no label would silently contribute nothing, and a label with no fields would offer the model
  // an `index_family` value no field accepts.
  for (const family of STATE_FAMILIES) {
    assert.equal(
      family.aggFields.length > 0,
      family.toolFamily !== undefined,
      `"${family.pattern}" declares ${family.aggFields.length} agg field(s) but ` +
        `toolFamily=${String(family.toolFamily)}`,
    );
  }
  const toolFamilies = STATE_FAMILIES.map(family => family.toolFamily).filter(
    (toolFamily): toolFamily is string => toolFamily !== undefined,
  );
  assert.equal(new Set(toolFamilies).size, toolFamilies.length);
});

test('STATE_AGG_FIELDS is the deduplicated union of every family aggFields', () => {
  const expected = [
    ...new Set(STATE_FAMILIES.flatMap(family => family.aggFields)),
  ].sort();
  assert.deepEqual([...STATE_AGG_FIELDS], expected);
  assert.equal(new Set(STATE_AGG_FIELDS).size, STATE_AGG_FIELDS.length);
});

test('every STATE_AGG_FIELDS entry is actually accepted by the aggregation guardrail', () => {
  // The union is folded into guardrails.ts's AGG_FIELD_ALLOWLIST; without this, a field could be
  // routed by get_field_values' FIELD_LOCATIONS and then rejected by checkAggs -- the exact
  // "allowlisted but unreachable" shape in reverse.
  for (const field of STATE_AGG_FIELDS) {
    assert.equal(isAggAllowedField(field), true, field);
  }
});

// The specific fields RESULTS.md (eval run 20260825-211841) recorded the model reporting as
// non-existent while they were live in the mapping. Each one is a question the product could not
// answer; pinned by name so a future trim of the allowlist has to argue with the evidence.
test('the state fields the eval measured as unreachable are now discoverable', () => {
  for (const field of [
    'service.name',
    'service.state',
    'host.cpu.name',
    'host.memory.total',
    'network.gateway',
    'network.ip',
    'network.netmask',
    'user.name',
    'user.groups',
    'group.name',
    'registry.value',
  ]) {
    assert.ok(
      STATE_AGG_FIELDS.includes(field),
      `"${field}" is live in the state mapping and was reported as non-existent; it must be ` +
        'discoverable',
    );
  }
});

test('browser extensions name the extension via package.name, not a guessed browser.* field', () => {
  // EV2-INV-016: the model tried `browser.extension.name` (does not exist) and concluded the data
  // was unavailable. The signature fields in the enum label are what prevent the guess.
  const extensions = STATE_FAMILIES.find(
    family => family.catalogFamily === 'inventory.browser_extensions',
  );
  assert.ok(extensions);
  assert.ok(extensions.signatureFields.includes('package.name'));
  assert.ok(
    !FIELD_CATALOG['inventory.browser_extensions'].includes(
      'browser.extension.name',
    ),
  );
});

test('the ports family label states that a listener carries its port in source.port', () => {
  // EV2-INV-017 filtered `destination.port: 3389` for "is RDP exposed" and got 0 rows, because on
  // this schema every listener has destination.port 0. The semantics have to be IN the label --
  // the field names alone do not carry them.
  const ports = STATE_FAMILIES.find(
    family => family.catalogFamily === 'inventory.ports',
  );
  assert.ok(ports);
  assert.match(stateFamilyLabel(ports), /source\.port/);
  assert.match(stateFamilyLabel(ports), /listening/);
});

test('a family owned by a typed tool names that tool in its label', () => {
  for (const family of STATE_FAMILIES) {
    if (!family.typedTool) {
      continue;
    }
    assert.match(
      stateFamilyLabel(family),
      /PREFER /,
      `"${family.pattern}" is owned by ${family.typedTool} but its label does not say so -- ` +
        'opening the family to the escape hatch must strengthen routing, never compete with it',
    );
  }
});

test('the surfaces with no typed tool are exactly the measured gap list', () => {
  const gaps = STATE_FAMILIES.filter(family => !family.typedTool).map(
    family => family.catalogFamily,
  );
  assert.deepEqual(gaps.sort(), [
    'fim.windows_registry_keys',
    'fim.windows_registry_values',
    'inventory.browser_extensions',
    'inventory.groups',
    'inventory.hardware',
    'inventory.interfaces',
    'inventory.networks',
    'inventory.protocols',
    'inventory.services',
    'inventory.users',
  ]);
});
