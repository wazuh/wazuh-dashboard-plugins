import { flatten } from './asset-viewer'; // Adjust the import path as needed

describe('flatten', () => {
  it('should flatten a simple object', () => {
    const input = { a: 1, b: 2 };
    const expected = [
      { key: 'a', value: 1 },
      { key: 'b', value: 2 },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should flatten a nested object', () => {
    const input = { a: { b: { c: 3 } } };
    const expected = [{ key: 'a.b.c', value: 3 }];
    expect(flatten(input)).toEqual(expected);
  });

  it('should flatten an object with arrays', () => {
    const input = { a: [1, 2, 3] };
    const expected = [
      { key: 'a[0]', value: 1 },
      { key: 'a[1]', value: 2 },
      { key: 'a[2]', value: 3 },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should flatten a complex object with nested arrays and objects', () => {
    const input = { a: { b: [1, { c: 2 }] } };
    const expected = [
      { key: 'a.b[0]', value: 1 },
      { key: 'a.b[1].c', value: 2 },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should handle an empty object', () => {
    const input = {};
    const expected: { key: string; value: any }[] = [];
    expect(flatten(input)).toEqual(expected);
  });

  it('should handle null and undefined values', () => {
    const input = { a: null, b: undefined };
    const expected = [
      { key: 'a', value: null },
      { key: 'b', value: undefined },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should handle primitive values', () => {
    const input = { a: 1, b: 'string', c: true };
    const expected = [
      { key: 'a', value: 1 },
      { key: 'b', value: 'string' },
      { key: 'c', value: true },
    ];
    expect(flatten(input)).toEqual(expected);
  });
});
