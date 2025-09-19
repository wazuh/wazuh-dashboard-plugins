import { ResponseHandler } from './response-handler';
import { PERMISSIONS_FORBIDDEN_TOKEN } from '../constants/config';

describe('ResponseHandler', () => {
  const handler = new ResponseHandler();

  it('detects insufficient-permissions forbidden token', () => {
    expect(
      handler.isPermissionsForbidden(`...${PERMISSIONS_FORBIDDEN_TOKEN}...`),
    ).toBe(true);
    expect(handler.isPermissionsForbidden('nope')).toBe(false);
  });

  it('normalizes axios-like response successfully (ok=true)', () => {
    const normalized = handler.normalize({
      status: 200,
      statusText: 'OK',
      data: { x: 1 },
    });
    expect(normalized).toEqual({
      body: { x: 1 },
      status: 200,
      statusText: 'OK',
      ok: true,
    });
  });

  it('ok=false when body contains error (even if status=200)', () => {
    const normalized = handler.normalize({
      status: 200,
      statusText: 'OK',
      data: { error: { code: 1 } },
    });
    expect(normalized.ok).toBe(false);
    expect(normalized.body).toEqual({ error: { code: 1 } });
  });

  it('ok=false when status is not 2xx', () => {
    const normalized = handler.normalize({
      status: 400,
      statusText: 'Bad Request',
      data: { x: 1 },
    });
    expect(normalized.ok).toBe(false);
  });

  it('normalizes primitives (no status)', () => {
    const normalized = handler.normalize('raw body');
    expect(normalized).toEqual({
      body: 'raw body',
      status: undefined,
      statusText: undefined,
      ok: false,
    });
  });
});
