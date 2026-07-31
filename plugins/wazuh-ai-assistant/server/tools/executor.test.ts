import assert from 'node:assert/strict';
import { resolveSecurityAnalyticsSpace } from './executor';

function hit(space: string | undefined): unknown {
  return space === undefined ? { _source: {} } : { _source: { space: { name: space } } };
}

test('resolveSecurityAnalyticsSpace: a single distinct space across all hits is used as-is', () => {
  assert.equal(resolveSecurityAnalyticsSpace([hit('standard'), hit('standard')]), 'standard');
  assert.equal(resolveSecurityAnalyticsSpace([hit('draft')]), 'draft');
});

test('resolveSecurityAnalyticsSpace: falls back to "standard" when hits span multiple spaces', () => {
  assert.equal(resolveSecurityAnalyticsSpace([hit('draft'), hit('custom')]), 'standard');
});

test('resolveSecurityAnalyticsSpace: falls back to "standard" with no hits or non-array input', () => {
  assert.equal(resolveSecurityAnalyticsSpace([]), 'standard');
  assert.equal(resolveSecurityAnalyticsSpace(undefined), 'standard');
  assert.equal(resolveSecurityAnalyticsSpace(null), 'standard');
});

test('resolveSecurityAnalyticsSpace: falls back to "standard" when no hit carries a space.name', () => {
  assert.equal(resolveSecurityAnalyticsSpace([hit(undefined), hit(undefined)]), 'standard');
});
