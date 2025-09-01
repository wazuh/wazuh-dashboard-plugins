import {
  buildNextPathWithQuery,
  isDefiningQueryParamValue,
  parseQueryString,
} from './query-utils';

describe('query-utils', () => {
  describe('parseQueryString', () => {
    it('parses key/value pairs', () => {
      expect(parseQueryString('a=1&b=2')).toEqual([
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ]);
    });

    it('handles keys without value', () => {
      expect(parseQueryString('a&b=2')).toEqual([
        { key: 'a', value: undefined },
        { key: 'b', value: '2' },
      ]);
    });

    it('returns empty for empty input', () => {
      expect(parseQueryString()).toEqual([]);
    });
  });

  describe('isDefiningQueryParamValue', () => {
    it('detects defining value after &', () => {
      const full = 'GET /x?a=1&b=';
      const qs = 'a=1&b=';
      expect(isDefiningQueryParamValue(full, qs)).toBe(true);
    });

    it('detects defining after first ?', () => {
      const full = 'GET /x?a=';
      const qs = 'a=';
      expect(isDefiningQueryParamValue(full, qs)).toBe(true);
    });

    it('false when not defining', () => {
      const full = 'GET /x?a=1&';
      const qs = 'a=1&';
      expect(isDefiningQueryParamValue(full, qs)).toBe(false);
    });
  });

  describe('buildNextPathWithQuery', () => {
    it('builds next path with existing valid entries', () => {
      const out = buildNextPathWithQuery(
        '/x',
        [
          { key: 'a', value: '1' },
          { key: 'b', value: '' as any }, // invalid value -> filtered
          { key: 'c', value: '3' },
        ],
        'next',
      );
      expect(out).toBe('/x?a=1&c=3&next=');
    });

    it('starts with ? when no entries', () => {
      expect(buildNextPathWithQuery('/x', [], 'a')).toBe('/x?a=');
    });
  });
});
