/*
 * Unit tests for alerting health-check helpers
 */

import { __test__ as mod } from './alerting-monitors';

type AnyCtx = any;

function createCtx(requestImpl: jest.Mock): AnyCtx {
  return {
    context: {
      services: {
        core: {
          opensearch: {
            client: {
              asInternalUser: {
                transport: {
                  request: requestImpl,
                },
              },
            },
          },
        },
      },
    },
    logger: {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
}

describe('alerting health-check helpers', () => {
  test('monitorExists issues GET to /_plugins/_alerting/monitors/_search with minimal body', async () => {
    const req = jest
      .fn()
      .mockResolvedValue({ body: { hits: { total: { value: 2 } } } });
    const ctx = createCtx(req);
    const found = await mod.monitorExists(ctx, 'My Monitor');
    expect(found).toBe(true);
    expect(req).toHaveBeenCalledTimes(1);
    const arg = req.mock.calls[0][0];
    expect(arg.method).toBe('GET');
    expect(arg.path).toBe('/_plugins/_alerting/monitors/_search');
    // Ensure no index key and proper query shape
    expect(arg.body).toEqual({
      size: 0,
      query: { term: { 'monitor.name.keyword': 'My Monitor' } },
    });
  });

  test('monitorExists returns false when search throws', async () => {
    const req = jest.fn().mockRejectedValue(new Error('security_exception'));
    const ctx = createCtx(req);
    const found = await mod.monitorExists(ctx, 'Nope');
    expect(found).toBe(false);
  });

  test('getNotificationChannels returns [] on error and uses proper route', async () => {
    const req = jest.fn().mockRejectedValue(new Error('no permissions'));
    const ctx = createCtx(req);
    const list = await mod.getNotificationChannels(ctx);
    expect(list).toEqual([]);
    expect(req).toHaveBeenCalled();
    const arg = req.mock.calls[0][0];
    expect(arg.method).toBe('GET');
    expect(arg.path).toBe('/_plugins/_notifications/configs');
    expect(arg.querystring).toMatchObject({ from_index: 0, max_items: 1000 });
  });

  test('alertingAvailable returns true on successful probe', async () => {
    const req = jest
      .fn()
      .mockResolvedValue({ body: { hits: { total: { value: 0 } } } });
    const ctx = createCtx(req);
    await expect(mod.alertingAvailable(ctx)).resolves.toBe(true);
  });
});
