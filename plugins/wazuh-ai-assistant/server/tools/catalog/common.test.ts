import assert from 'node:assert/strict';
import {
  severitiesAtOrAbove,
  severitiesAtOrBelow,
  severityFilterValues,
} from './common';

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
