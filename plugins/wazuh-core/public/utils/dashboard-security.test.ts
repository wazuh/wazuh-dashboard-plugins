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
