import {
  findMatchingEndpoint,
  getMethodEndpoints,
  parseRequestLine,
  splitPathToSegments,
} from './endpoint-utils';
import type { DevToolsModel, EndpointDef, MethodDef } from '../types';

describe('endpoint-utils', () => {
  describe('parseRequestLine', () => {
    it('parses method, path and query', () => {
      const out = parseRequestLine('GET /alpha/beta?x=1&y=2');
      expect(out).toEqual({
        method: 'GET',
        path: '/alpha/beta',
        queryMark: '?',
        queryString: 'x=1&y=2',
      });
    });

    it('returns empty object on empty input', () => {
      expect(parseRequestLine()).toEqual({});
    });
  });

  describe('splitPathToSegments', () => {
    it('splits by / and lowercases', () => {
      expect(splitPathToSegments('/A/B/c/')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getMethodEndpoints', () => {
    const model: DevToolsModel = [
      { method: 'GET', endpoints: [{ name: '/a' }] },
      { method: 'POST', endpoints: [{ name: '/b' }] },
    ];

    it('returns endpoints for method', () => {
      expect(getMethodEndpoints(model, 'POST')).toEqual([{ name: '/b' }]);
    });

    it('returns empty when method not found or model undefined', () => {
      expect(getMethodEndpoints(undefined, 'GET')).toEqual([]);
      expect(getMethodEndpoints(model, 'PUT')).toEqual([]);
    });
  });

  describe('findMatchingEndpoint', () => {
    const eps: EndpointDef[] = [
      { name: '/alpha/:id/items' },
      { name: '/alpha/static/items' },
      { name: '/beta/:id' },
    ];

    it('matches by structured segments including :params', () => {
      const match = findMatchingEndpoint(eps, ['alpha', '123', 'items']);
      expect(match?.name).toBe('/alpha/:id/items');
    });

    it('requires same segment length', () => {
      const match = findMatchingEndpoint(eps, ['alpha', '123']);
      expect(match).toBeUndefined();
    });
  });
});
