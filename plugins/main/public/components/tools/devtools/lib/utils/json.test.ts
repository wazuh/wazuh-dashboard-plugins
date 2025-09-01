import { safeJsonParse, stripReservedFlags } from './json';

/**
 * Tests for utils/json.ts
 * - Covers happy paths, error handling, and edge cases
 * - Keeps tests independent and reproducible
 */

describe('safeJsonParse', () => {
  it('parses a valid JSON object (happy path)', () => {
    const raw = '{"foo":"bar","num":42,"nested":{"a":1}}';
    const result = safeJsonParse(raw);
    expect(result).toEqual({ foo: 'bar', num: 42, nested: { a: 1 } });
    expect(result).toMatchSnapshot();
  });

  it('parses arrays', () => {
    const raw = '[1,2,3]';
    const result = safeJsonParse<number[]>(raw);
    expect(result).toEqual([1, 2, 3]);
  });

  it('returns default fallback {} when input is empty/falsy and no custom fallback provided', () => {
    const res1 = safeJsonParse('');
    const res2 = safeJsonParse(undefined);
    const res3 = safeJsonParse(null);
    expect(res1).toEqual({});
    expect(res2).toEqual({});
    expect(res3).toEqual({});
  });

  it('returns provided fallback when input is empty/falsy', () => {
    const fallback = { ok: true } as const;
    expect(safeJsonParse(undefined, fallback)).toBe(fallback);
    expect(safeJsonParse(null, fallback)).toBe(fallback);
    expect(safeJsonParse('', fallback)).toBe(fallback);
  });

  it('returns fallback when JSON is invalid (error path)', () => {
    const fallback = { error: 'invalid-json' } as const;
    const raw = '{ "bad": true,'; // missing closing brace
    const result = safeJsonParse(raw, fallback);
    expect(result).toBe(fallback);
  });

  it('parses with leading/trailing whitespace', () => {
    const raw = '  {\n  "x": 1\n}  ';
    const result = safeJsonParse<{ x: number }>(raw);
    expect(result).toEqual({ x: 1 });
  });

  it('returns null when input is the string "null" (not the fallback)', () => {
    const result = safeJsonParse('null', { will: 'not be used' } as any);
    expect(result).toBeNull();
  });
});

describe('stripReservedFlags', () => {
  it('removes top-level "pretty" when present (true/false) without mutating original (happy path)', () => {
    const originalTrue = { a: 1, pretty: true, b: 2 } as const;
    const originalFalse = { a: 1, pretty: false, b: 2 } as const;

    const sanitizedTrue = stripReservedFlags({ ...originalTrue });
    const sanitizedFalse = stripReservedFlags({ ...originalFalse });

    expect(sanitizedTrue).toEqual({ a: 1, b: 2 });
    expect(sanitizedFalse).toEqual({ a: 1, b: 2 });

    // Original objects are not mutated
    expect(originalTrue).toEqual({ a: 1, pretty: true, b: 2 });
    expect(originalFalse).toEqual({ a: 1, pretty: false, b: 2 });

    expect(sanitizedTrue).toMatchSnapshot(
      'stripReservedFlags-with-pretty-true',
    );
    expect(sanitizedFalse).toMatchSnapshot(
      'stripReservedFlags-with-pretty-false',
    );
  });

  it('does not remove nested "pretty" fields (only top-level)', () => {
    const obj = { a: 1, nested: { pretty: true, c: 3 } };
    const result = stripReservedFlags(obj);
    expect(result).toEqual({ a: 1, nested: { pretty: true, c: 3 } });
  });

  it('leaves object unchanged when "pretty" is not present', () => {
    const obj = { a: 1, b: 2 };
    const result = stripReservedFlags(obj);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('keeps the key when "pretty" is explicitly undefined (by design of implementation)', () => {
    const obj: { pretty?: boolean | undefined; x: number } = {
      pretty: undefined,
      x: 1,
    };
    const result = stripReservedFlags(obj);
    expect(result).toHaveProperty('pretty', undefined);
    expect(result).toHaveProperty('x', 1);
  });

  it('passes through non-objects/invalid inputs unchanged (error/edge cases)', () => {
    expect(stripReservedFlags(null as any)).toBeNull();
    expect(stripReservedFlags(undefined as any)).toBeUndefined();
    expect(stripReservedFlags(123 as any)).toBe(123);
    expect(stripReservedFlags('str' as any)).toBe('str');
  });
});
