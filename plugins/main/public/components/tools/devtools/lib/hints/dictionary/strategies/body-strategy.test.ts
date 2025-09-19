import { BodyHintStrategy } from './body-strategy';
import type { HintContext } from '../context';

// Build a minimal editor buffer with a JSON body to exercise the strategy
const lines = ['GET /api', '{', '  "a": {', '    "existing": 1', '  }', '}'];

const editor = {
  getCursor: () => ({ line: 3, ch: 5 }),
  getLine: (n: number) => lines[n] || '',
  replaceRange: jest.fn(),
  setCursor: jest.fn(),
} as any;

const baseCtx = (over: Partial<HintContext> = {}): HintContext => ({
  editor,
  line: '  "n', // typing a key
  word: 'n',
  model: [],
  groups: [],
  currentGroup: {
    requestText: 'GET /api',
    requestTextJson: '{\n  "a": {\n    "existing": 1\n  }\n}',
    start: 0,
    end: 5,
  },
  cursorLine: 3,
  parsed: { method: 'GET', path: '/api' },
  inputEndpoint: ['api'],
  methodEndpoints: [],
  apiEndpoint: {
    name: '/api',
    body: [
      {
        name: 'root',
        type: 'object',
        properties: {
          a: {
            name: 'a',
            type: 'object',
            properties: {
              newKey: { name: 'newKey', type: 'string' },
              existing: { name: 'existing', type: 'string' },
            },
          },
        },
      },
    ],
  } as any,
  isOnRequestLine: false,
  isInsideBodyBlock: true,
  ...over,
});

describe('BodyHintStrategy', () => {
  it('canHandle only inside body block', () => {
    const s = new BodyHintStrategy();
    expect(s.canHandle(baseCtx())).toBe(true);
    expect(s.canHandle(baseCtx({ isInsideBodyBlock: false }))).toBe(false);
  });

  it('suggests body keys based on schema and filters existing', () => {
    const s = new BodyHintStrategy();
    const out = s.getHints(baseCtx());
    const names = (out as any[]).map(i => i.displayText);
    expect(names).toContain('newKey');
    expect(names).not.toContain('existing');
    // Ensure the hint action updates editor and cursor when invoked for strings
    const item: any = out.find((i: any) => i.displayText === 'newKey');
    expect(item._moveCursor).toBe(true);
    // Simulate invoking the hint; implementation uses the captured editor, not the argument
    item.hint?.(editor as any, null as any, item);
    expect(editor.replaceRange).toHaveBeenCalled();
    expect(editor.setCursor).toHaveBeenCalled();
  });

  it('returns [] when not on a key line', () => {
    const s = new BodyHintStrategy();
    const out = s.getHints(baseCtx({ line: '   },' }));
    expect(out).toEqual([]);
  });
});
