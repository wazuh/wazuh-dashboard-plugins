import { ILogger } from '../../common/services/configuration';
import { DashboardSecurity } from './dashboard-security';

const logger = { debug: jest.fn(), error: jest.fn() } as unknown as ILogger;

const fetchCurrentPlatform = (security: DashboardSecurity) =>
  (
    security as unknown as { fetchCurrentPlatform: () => Promise<string> }
  ).fetchCurrentPlatform();

describe('DashboardSecurity.fetchCurrentPlatform', () => {
  it('requests the platform once', async () => {
    const http = {
      get: jest.fn().mockResolvedValue({ platform: 'opensearchSecurity' }),
    };
    const security = new DashboardSecurity(logger, http);

    await security.setup();
    const platform = await fetchCurrentPlatform(security);

    expect(platform).toBe('opensearchSecurity');
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('requests the platform again after a failure', async () => {
    const http = {
      get: jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ platform: 'opensearchSecurity' }),
    };
    const security = new DashboardSecurity(logger, http);

    await security.setup();
    const platform = await fetchCurrentPlatform(security);

    expect(platform).toBe('opensearchSecurity');
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});

describe('DashboardSecurity.fetchAuthContextFields', () => {
  it('shares the request with the platform', async () => {
    const http = {
      get: jest.fn().mockResolvedValue({
        platform: 'opensearchSecurity',
        authContextFields: ['user_name', 'backend_roles'],
      }),
    };
    const security = new DashboardSecurity(logger, http);

    await security.setup();
    const platform = await fetchCurrentPlatform(security);
    const fields = await security.fetchAuthContextFields();

    expect(platform).toBe('opensearchSecurity');
    expect(fields).toEqual(['user_name', 'backend_roles']);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('returns no fields when the response has none', async () => {
    const http = { get: jest.fn().mockResolvedValue({ platform: '' }) };
    const security = new DashboardSecurity(logger, http);

    expect(await security.fetchAuthContextFields()).toEqual([]);
  });
});
