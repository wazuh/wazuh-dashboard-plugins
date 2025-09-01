// Integration test for CodeMirror helper wiring and hint post-processing
import { registerDictionaryHint } from './dictionary-hint';

// Mock the dictionary hint provider factory to control returned hints
jest.mock('./dictionary/factory', () => ({
  createDictionaryHintProvider: () => ({
    buildHints: () => ['Zed', 'alpha', '?and??two?'],
  }),
}));

// Mock CodeMirror minimal surface used by registerDictionaryHint
jest.mock('../../../../../utils/codemirror/lib/codemirror', () => {
  const helpers: Record<string, any> = {};
  return {
    __helpers: helpers,
    Pos: (line: number, ch: number) => ({ line, ch }),
    registerHelper: (type: string, name: string, fn: any) => {
      helpers[`${type}:${name}`] = fn;
    },
  };
});

describe('registerDictionaryHint', () => {
  it('registers helper and returns filtered, normalized, sorted hints', () => {
    const modelInput = { model: [] } as any;
    registerDictionaryHint(modelInput);

    const CM = require('../../../../../utils/codemirror/lib/codemirror');
    const helper = CM.__helpers['hint:dictionaryHint'];
    // Editor stub returning a word boundary for filtering: current word = 'a'
    const editor = {
      getCursor: () => ({ line: 0, ch: 10 }),
      getLine: () => 'GET /_cat a',
    } as any;

    const res = helper(editor);
    // Filters to include only items containing 'a' (case-insensitive)
    const list = res.list.map((i: any) => (i.text ?? i)).map((t: any) => (typeof t === 'string' ? t : t.text));
    expect(list).toContain('alpha');
    expect(list).not.toContain('Zed');
    // Ensure question marks limited in strings
    expect(list).toContain('?andtwo');
    expect(res.from).toEqual({ line: 0, ch: 10 });
    expect(res.to).toEqual({ line: 0, ch: 11 });
  });
});
