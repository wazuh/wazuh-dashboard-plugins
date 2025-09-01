import { DictionaryHintProvider } from './hint-provider';
import type { HintStrategy } from './strategies/hint-strategy';

const deps = {
  analyzeGroups: jest.fn(() => [{ requestText: 'GET /x', requestTextJson: '', start: 0, end: 0 }]),
  calculateWhichGroup: jest.fn((_e, _f, groups) => groups?.[0] || null),
  logError: jest.fn(),
  getModel: jest.fn(() => [
    { method: 'GET', endpoints: [{ name: '/x' }] },
    { method: 'POST', endpoints: [{ name: '/y' }] },
  ]),
};

const makeCtx = () => ({
  editor: { getCursor: () => ({ line: 0, ch: 0 }) } as any,
  line: 'GET /',
  word: '',
});

describe('DictionaryHintProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the first strategy that can handle and returns non-empty hints', () => {
    const s1: HintStrategy = { canHandle: () => true, getHints: () => [] };
    const s2: HintStrategy = { canHandle: () => true, getHints: () => ['a'] };
    const provider = new DictionaryHintProvider(deps as any, [s1, s2]);
    const out = provider.buildHints(makeCtx().editor as any, 'GET /', '');
    expect(out).toEqual(['a']);
  });

  it('logs and continues when a strategy throws', () => {
    const s1: HintStrategy = { canHandle: () => true, getHints: () => { throw new Error('boom'); } } as any;
    const s2: HintStrategy = { canHandle: () => true, getHints: () => ['ok'] } as any;
    const provider = new DictionaryHintProvider(deps as any, [s1, s2]);
    const out = provider.buildHints(makeCtx().editor as any, 'GET /', '');
    expect(out).toEqual(['ok']);
    expect(deps.logError).toHaveBeenCalledWith('dictionaryHint.strategy', expect.any(Error));
  });

  it('returns empty when no strategies return output', () => {
    const s1: HintStrategy = { canHandle: () => false, getHints: () => [] } as any;
    const provider = new DictionaryHintProvider(deps as any, [s1]);
    const out = provider.buildHints(makeCtx().editor as any, 'GET /', '');
    expect(out).toEqual([]);
  });
});

