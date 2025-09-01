import { FallbackHintStrategy } from './fallback-strategy';

describe('FallbackHintStrategy', () => {
  it('always handles and returns available methods from model', () => {
    const s = new FallbackHintStrategy();
    const ctx: any = {
      isInsideBodyBlock: false,
      isOnRequestLine: false,
      model: [
        { method: 'GET', endpoints: [] },
        { method: 'POST', endpoints: [] },
      ],
    };
    expect(s.canHandle(ctx)).toBe(true);
    expect(s.getHints(ctx)).toEqual(['GET', 'POST']);
  });
});

