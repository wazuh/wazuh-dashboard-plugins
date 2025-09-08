import { FallbackHintStrategy } from './fallback-strategy';

const buildCtx = (line: string, ch: number) => ({
  editor: { getCursor: () => ({ line: 0, ch }) },
  line,
  word: '',
  model: [
    { method: 'GET', endpoints: [] },
    { method: 'POST', endpoints: [] },
  ],
  groups: [],
  currentGroup: null,
  cursorLine: 0,
  parsed: {} as any,
  inputEndpoint: [],
  methodEndpoints: [],
  apiEndpoint: undefined,
  isOnRequestLine: false,
  isInsideBodyBlock: false,
});

describe('FallbackHintStrategy', () => {
  it('handles only at start of line or after leading spaces', () => {
    const s = new FallbackHintStrategy();
    // Cursor at SOL
    expect(s.canHandle(buildCtx('GET', 0) as any)).toBe(true);
    // Cursor after spaces
    expect(s.canHandle(buildCtx('   GE', 3) as any)).toBe(true);
    // Cursor after non-space characters (should not handle)
    expect(s.canHandle(buildCtx('xx GE', 5) as any)).toBe(false);
  });

  it('returns available methods when it handles', () => {
    const s = new FallbackHintStrategy();
    const ctx = buildCtx('   ', 3) as any;
    expect(s.getHints(ctx)).toEqual(['GET', 'POST']);
  });

  it('does not handle inside a body block', () => {
    const s = new FallbackHintStrategy();
    const ctx = buildCtx('  "name":', 2) as any;
    ctx.isInsideBodyBlock = true;
    expect(s.canHandle(ctx)).toBe(false);
  });

  it('does not handle inside an array block', () => {
    const s = new FallbackHintStrategy();
    // Simulate typing inside an array body
    const ctx = buildCtx('  [', 2) as any;
    ctx.isInsideBodyBlock = true; // array is part of JSON body
    expect(s.canHandle(ctx)).toBe(false);
  });

  it('does not handle on closing array bracket line', () => {
    const s = new FallbackHintStrategy();
    // Cursor on the closing ']' line of the body
    const ctx = buildCtx(']', 0) as any;
    ctx.isInsideBodyBlock = true; // closing bracket considered inside body
    expect(s.canHandle(ctx)).toBe(false);
  });
});
