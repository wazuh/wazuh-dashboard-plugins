import assert from 'node:assert/strict';
import {
  FINDING_BREAKDOWN_AGGS,
  FINDING_BREAKDOWN_DIMENSIONS,
  severitiesAtOrAbove,
  severitiesAtOrBelow,
  severityFilterValues,
} from './common';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

test('severitiesAtOrAbove returns the tail of the severity order, inclusive', () => {
  assert.deepEqual(severitiesAtOrAbove('medium'), [
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severitiesAtOrAbove('critical'), ['critical']);
});

test('severitiesAtOrAbove is case-insensitive and fails open on an unknown value', () => {
  assert.deepEqual(severitiesAtOrAbove('MEDIUM'), [
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severitiesAtOrAbove('bogus'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severitiesAtOrBelow returns the head of the severity order, inclusive', () => {
  assert.deepEqual(severitiesAtOrBelow('medium'), [
    'informational',
    'low',
    'medium',
  ]);
  assert.deepEqual(severitiesAtOrBelow('informational'), ['informational']);
});

test('severitiesAtOrBelow is case-insensitive and fails open on an unknown value', () => {
  assert.deepEqual(severitiesAtOrBelow('MEDIUM'), [
    'informational',
    'low',
    'medium',
  ]);
  assert.deepEqual(severitiesAtOrBelow('bogus'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues defaults to an exact match', () => {
  assert.deepEqual(severityFilterValues('medium'), ['medium']);
  assert.deepEqual(severityFilterValues('medium', 'exact'), ['medium']);
});

test('severityFilterValues supports at_or_above and at_or_below', () => {
  assert.deepEqual(severityFilterValues('medium', 'at_or_above'), [
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severityFilterValues('medium', 'at_or_below'), [
    'informational',
    'low',
    'medium',
  ]);
});

test('severityFilterValues fails open to the full list for an unrecognized exact value', () => {
  assert.deepEqual(severityFilterValues('bogus'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues is case-insensitive in exact mode', () => {
  assert.deepEqual(severityFilterValues('MEDIUM'), ['medium']);
  assert.deepEqual(severityFilterValues('  High  '), ['high']);
});

test('severityFilterValues fails open to the full list for an empty-string value', () => {
  assert.deepEqual(severityFilterValues(''), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues fails open to the full list for an unrecognized comparison, never silently exact-matching', () => {
  assert.deepEqual(severityFilterValues('medium', 'gte'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severityFilterValues('medium', 'at-or-above'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues treats an undefined comparison as exact', () => {
  assert.deepEqual(severityFilterValues('medium', undefined), ['medium']);
});

// --- FINDING_BREAKDOWN_AGGS: real aggregations attached to every finding-hits tool's request ----

test('FINDING_BREAKDOWN_AGGS declares one terms aggregation per FINDING_BREAKDOWN_DIMENSIONS', () => {
  assert.equal(
    Object.keys(FINDING_BREAKDOWN_AGGS).length,
    FINDING_BREAKDOWN_DIMENSIONS.length,
  );
  for (const field of FINDING_BREAKDOWN_DIMENSIONS) {
    const aggName = field.replace(/\./g, '_');
    const agg = FINDING_BREAKDOWN_AGGS[aggName] as {
      terms?: { field?: string; size?: number };
    };
    assert.ok(
      agg,
      `expected an aggregation named "${aggName}" for field "${field}"`,
    );
    assert.equal(agg.terms?.field, field);
    // Sized identically to the synthetic fallback's per-dimension cap (digest.ts's
    // buildSyntheticBreakdown) so the token cost of a breakdown does not depend on which of the
    // two paths ends up serving a given call.
    assert.equal(agg.terms?.size, BREAKDOWN_BUCKET_CAP);
  }
});
