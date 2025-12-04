import { flatten } from './asset-viewer'; // Adjust the import path as needed

describe('flatten', () => {
  it('should flatten a simple object with primitive values', () => {
    const input = { a: 1, b: 'test', c: true };
    const expected = [
      { key: 'a', value: '1' },
      { key: 'b', value: '"test"' },
      { key: 'c', value: 'true' },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should flatten an object with nested objects', () => {
    const input = { a: { b: 2 }, c: 'test' };
    const expected = [
      { key: 'a', value: '{"b":2}' },
      { key: 'c', value: '"test"' },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should flatten an object with arrays', () => {
    const input = { a: [1, 2, 3], b: 'test' };
    const expected = [
      { key: 'a', value: '[1,2,3]' },
      { key: 'b', value: '"test"' },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should handle an empty object', () => {
    const input = {};
    const expected: { key: string; value: string }[] = [];
    expect(flatten(input)).toEqual(expected);
  });

  it('should handle null and undefined values', () => {
    const input = { a: null, b: undefined };
    const expected = [
      { key: 'a', value: 'null' },
      { key: 'b', value: undefined },
    ];
    expect(flatten(input)).toEqual(expected);
  });

  it('should handle special characters in keys and values', () => {
    const input = { 'a-b': 'value-with-special-characters' };
    const expected = [{ key: 'a-b', value: '"value-with-special-characters"' }];
    expect(flatten(input)).toEqual(expected);
  });
});
