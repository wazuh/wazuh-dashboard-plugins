import { RequestLineHintStrategy } from './request-line-strategy';
import type { HintContext } from '../context';

const baseContext = (over: Partial<HintContext> = {}): HintContext => ({
  // Place cursor after the method and a space by default
  editor: { getCursor: () => ({ line: 0, ch: 8 }) } as any,
  line: 'GET /api',
  word: '',
  model: [],
  groups: [],
  currentGroup: {
    requestText: 'GET /api?foo=1',
    requestTextJson: '',
    start: 0,
    end: 0,
  },
  cursorLine: 0,
  parsed: { method: 'GET', path: '/api', queryMark: '?', queryString: 'foo=1' },
  inputEndpoint: ['api'],
  methodEndpoints: [],
  apiEndpoint: undefined,
  isOnRequestLine: true,
  isInsideBodyBlock: false,
  ...over,
});

describe('RequestLineHintStrategy', () => {
  it('canHandle only on request line with method', () => {
    const s = new RequestLineHintStrategy();
    expect(s.canHandle(baseContext())).toBe(true);
    expect(s.canHandle(baseContext({ isOnRequestLine: false }))).toBe(false);
    expect(s.canHandle(baseContext({ parsed: { path: '/x' } as any }))).toBe(
      false,
    );
  });

  it('suggests query params when adding modifiers', () => {
    const s = new RequestLineHintStrategy();
    const ctx = baseContext({
      apiEndpoint: {
        name: '/api',
        query: [
          { name: 'bar', schema: { type: 'boolean' } },
          { name: 'baz' },
          { name: 'foo' }, // already present in qs -> skipped
        ],
      },
      methodEndpoints: [{ name: '/api' }],
      parsed: {
        method: 'GET',
        path: '/api',
        queryMark: '?',
        queryString: 'foo=1&',
      } as any,
      currentGroup: {
        requestText: 'GET /api?foo=1&',
        requestTextJson: '',
        start: 0,
        end: 0,
      },
    });
    const out = s.getHints(ctx);
    const labels = (out as any[]).map(i => i.displayText);
    expect(labels).toContain('bar');
    expect(labels).toContain('baz');
    expect(labels).not.toContain('foo');
    const bar = (out as any[]).find(i => i.displayText === 'bar');
    expect(bar.text).toBe('/api?foo=1&bar=');
  });

  it('suggests endpoint paths by prefix and structured matches', () => {
    const s = new RequestLineHintStrategy();
    const ctx = baseContext({
      parsed: { method: 'GET', path: '/_c' } as any,
      inputEndpoint: ['_c'],
      methodEndpoints: [
        { name: '/_cat/indices' },
        { name: '/_cluster/health' },
        { name: '/_other' },
      ],
      apiEndpoint: undefined,
    });
    const out = s.getHints(ctx);
    const texts = (out as any[]).map(i => i.text);
    expect(texts).toContain('/_cat/indices');
    expect(texts).toContain('/_cluster/health');
    // Includes all entries too via dedupe union
    expect(texts).toContain('/_other');
  });

  it('does not suggest endpoints after a typed path followed by a space', () => {
    const s = new RequestLineHintStrategy();
    const ctx = baseContext({
      editor: { getCursor: () => ({ line: 0, ch: 12 }) } as any,
      line: 'POST /api ',
      parsed: { method: 'POST', path: '/api ' } as any,
      methodEndpoints: [{ name: '/api' }, { name: '/api/other' }],
      apiEndpoint: undefined,
    });
    const out = s.getHints(ctx);
    expect(out).toEqual([]);
  });

  it('does not suggest endpoints when query mark is present', () => {
    const s = new RequestLineHintStrategy();
    const ctx = baseContext({
      line: 'GET /api?pretty=1',
      parsed: {
        method: 'GET',
        path: '/api',
        queryMark: '?',
        queryString: 'pretty=1',
      } as any,
      methodEndpoints: [{ name: '/api' }],
      apiEndpoint: undefined, // even if no query hints, endpoints should not be suggested
    });
    const out = s.getHints(ctx);
    expect(out).toEqual([]);
  });

  it('suggests endpoints when cursor is after METHOD and spaces only', () => {
    const s = new RequestLineHintStrategy();
    const ctx = baseContext({
      editor: { getCursor: () => ({ line: 0, ch: 5 }) } as any, // after 'POST '
      line: 'POST ',
      parsed: { method: 'POST', path: '' } as any,
      methodEndpoints: [{ name: '/agents' }, { name: '/events' }],
    });
    const out = s.getHints(ctx);
    const texts = (out as any[]).map(i => i.text);
    expect(texts).toContain('/agents');
    expect(texts).toContain('/events');
  });
});
