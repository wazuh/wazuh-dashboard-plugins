import assert from 'node:assert/strict';
import { tableSpecSchema } from './conversations';

/**
 * Regression guard for the bug where a persisted message's `table.securityAnalyticsLink`
 * (`common/types.ts`'s `TableSpec.securityAnalyticsLink`, added for get_rules/
 * get_threat_intel_components) rejected the whole conversations save/update request with
 * `[...table.securityAnalyticsLink]: definition for this key is missing` -- `tableSpecSchema`
 * (server/routes/conversations.ts) had never been updated for the new field, unlike its sibling
 * `discover`. Every `TableSpec` field must have a matching case here so a future field gets the
 * same guard.
 */

const MINIMAL_TABLE = {
  columns: [{ id: 'name', label: 'Name' }],
  rows: [{ name: 'suricata' }],
};

test('tableSpecSchema: accepts the minimal shape (no discover, no securityAnalyticsLink)', () => {
  assert.doesNotThrow(() => tableSpecSchema.validate(MINIMAL_TABLE));
});

test('tableSpecSchema: accepts a table carrying discover (Open in Discover)', () => {
  assert.doesNotThrow(() =>
    tableSpecSchema.validate({
      ...MINIMAL_TABLE,
      discover: {
        index: 'wazuh-findings-v5*',
        dsl: { match_all: {} },
      },
    }),
  );
});

test('tableSpecSchema: accepts a table carrying securityAnalyticsLink (Open in Security Analytics)', () => {
  assert.doesNotThrow(() =>
    tableSpecSchema.validate({
      ...MINIMAL_TABLE,
      securityAnalyticsLink: {
        label: 'Open in Security Analytics',
        url: '/app/rules#/rules?space=standard',
      },
    }),
  );
});

test('tableSpecSchema: accepts a table carrying both discover and securityAnalyticsLink at once', () => {
  assert.doesNotThrow(() =>
    tableSpecSchema.validate({
      ...MINIMAL_TABLE,
      discover: { index: 'wazuh-findings-v5*', dsl: { match_all: {} } },
      securityAnalyticsLink: {
        label: 'Open in Security Analytics',
        url: '/app/rules#/rules?space=standard',
      },
    }),
  );
});

test('tableSpecSchema: rejects a securityAnalyticsLink missing its url', () => {
  assert.throws(() =>
    tableSpecSchema.validate({
      ...MINIMAL_TABLE,
      securityAnalyticsLink: { label: 'Open in Security Analytics' },
    }),
  );
});

test('tableSpecSchema: accepts a table carrying provenance (issue #9008 rework)', () => {
  assert.doesNotThrow(() =>
    tableSpecSchema.validate({
      ...MINIMAL_TABLE,
      provenance: {
        toolCallId: 'call-1',
        index: 'wazuh-findings-v5*',
        requestedRange: { gte: 'now-720d', lte: 'now' },
        effectiveRange: { gte: '2026-05-23T00:00:00.000Z', lte: 'now' },
        clamped: true,
        executedAt: Date.now(),
      },
    }),
  );
});

test('tableSpecSchema: accepts provenance with only `clamped` set (no range/index known)', () => {
  assert.doesNotThrow(() =>
    tableSpecSchema.validate({
      ...MINIMAL_TABLE,
      provenance: { clamped: false },
    }),
  );
});

test('tableSpecSchema: still rejects a genuinely unknown top-level key', () => {
  assert.throws(() =>
    tableSpecSchema.validate({
      ...MINIMAL_TABLE,
      somethingNobodyDefined: { anything: true },
    }),
  );
});
