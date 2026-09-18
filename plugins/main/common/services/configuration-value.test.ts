import { isConfigEnabled, normalizeConfigBoolean } from './configuration-value';

describe('normalizeConfigBoolean', () => {
  it('passes booleans through unchanged', () => {
    expect(normalizeConfigBoolean(true)).toBe(true);
    expect(normalizeConfigBoolean(false)).toBe(false);
  });

  it('maps the legacy yes/no dialect to booleans', () => {
    expect(normalizeConfigBoolean('yes')).toBe(true);
    expect(normalizeConfigBoolean('no')).toBe(false);
  });

  it('returns undefined for anything else', () => {
    expect(normalizeConfigBoolean(undefined)).toBeUndefined();
    expect(normalizeConfigBoolean(null)).toBeUndefined();
    expect(normalizeConfigBoolean(0)).toBeUndefined();
    expect(normalizeConfigBoolean(1)).toBeUndefined();
    expect(normalizeConfigBoolean('true')).toBeUndefined();
    expect(normalizeConfigBoolean('other')).toBeUndefined();
  });
});

describe('isConfigEnabled', () => {
  it('reads both dialects as the same affirmative answer', () => {
    expect(isConfigEnabled(true)).toBe(true);
    expect(isConfigEnabled('yes')).toBe(true);
  });

  it('reads both dialects as the same negative answer', () => {
    expect(isConfigEnabled(false)).toBe(false);
    expect(isConfigEnabled('no')).toBe(false);
  });

  it('is not affirmative for a missing or wrong-typed value', () => {
    expect(isConfigEnabled(undefined)).toBe(false);
    expect(isConfigEnabled(null)).toBe(false);
    expect(isConfigEnabled('other')).toBe(false);
  });
});
