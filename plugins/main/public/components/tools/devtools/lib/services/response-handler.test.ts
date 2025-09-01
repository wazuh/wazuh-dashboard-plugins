import { ResponseHandler } from './response-handler';
import { ADMIN_MODE_FORBIDDEN_TOKEN } from '../constants/config';

describe('ResponseHandler', () => {
  const handler = new ResponseHandler();

  it('detecta admin-mode forbidden token', () => {
    expect(handler.isAdminModeForbidden(`...${ADMIN_MODE_FORBIDDEN_TOKEN}...`)).toBe(true);
    expect(handler.isAdminModeForbidden('nope')).toBe(false);
  });

  it('normaliza respuesta axios-like con éxito (ok=true)', () => {
    const normalized = handler.normalize({ status: 200, statusText: 'OK', data: { x: 1 } });
    expect(normalized).toEqual({ body: { x: 1 }, status: 200, statusText: 'OK', ok: true });
  });

  it('ok=false cuando body contiene error (aunque status=200)', () => {
    const normalized = handler.normalize({ status: 200, statusText: 'OK', data: { error: { code: 1 } } });
    expect(normalized.ok).toBe(false);
    expect(normalized.body).toEqual({ error: { code: 1 } });
  });

  it('ok=false cuando status no es 2xx', () => {
    const normalized = handler.normalize({ status: 400, statusText: 'Bad Request', data: { x: 1 } });
    expect(normalized.ok).toBe(false);
  });

  it('normaliza primitivas (sin status)', () => {
    const normalized = handler.normalize('raw body');
    expect(normalized).toEqual({ body: 'raw body', status: undefined, statusText: undefined, ok: false });
  });
});

