import { getHttp } from '../../../../../kibana-services';
import { fetchIocFeedByType, SECURITY_ANALYTICS_ROUTES } from './security-analytics-client';
import { DATA_SOURCE_NOT_FOUND } from './types';

jest.mock('../../../../../kibana-services', () => ({
  getHttp: jest.fn(),
}));

const asMock = (fn: unknown) => fn as jest.Mock;

describe('fetchIocFeedByType', () => {
  it('GETs the IOC catalog route and counts a bounded page by type', async () => {
    const get = jest.fn().mockResolvedValue({
      ok: true,
      response: {
        total: 3,
        iocs: [
          { type: 'domain' },
          { type: 'domain' },
          { type: 'ip' },
        ],
      },
    });
    asMock(getHttp).mockReturnValue({ get });

    const result = await fetchIocFeedByType(5);

    expect(get).toHaveBeenCalledWith(
      SECURITY_ANALYTICS_ROUTES.iocs,
      expect.objectContaining({ query: expect.objectContaining({ size: expect.any(Number) }) }),
    );
    expect(result).toEqual([
      { key: 'domain', count: 2 },
      { key: 'ip', count: 1 },
    ]);
  });

  it('caps the result at the requested top size', async () => {
    const get = jest.fn().mockResolvedValue({
      ok: true,
      response: {
        iocs: [{ type: 'a' }, { type: 'b' }, { type: 'b' }, { type: 'c' }],
      },
    });
    asMock(getHttp).mockReturnValue({ get });

    expect(await fetchIocFeedByType(2)).toEqual([
      { key: 'b', count: 2 },
      { key: 'a', count: 1 },
    ]);
  });

  it('throws the shared "capability absent" shape on a 404 (Security Analytics not installed)', async () => {
    const get = jest.fn().mockRejectedValue({ response: { status: 404 } });
    asMock(getHttp).mockReturnValue({ get });

    await expect(fetchIocFeedByType(5)).rejects.toEqual({
      type: DATA_SOURCE_NOT_FOUND,
    });
  });

  it('rethrows any other transport error unchanged', async () => {
    const error = new Error('boom');
    const get = jest.fn().mockRejectedValue(error);
    asMock(getHttp).mockReturnValue({ get });

    await expect(fetchIocFeedByType(5)).rejects.toBe(error);
  });

  it('treats an in-envelope ok:false as a query failure, not "absent"', async () => {
    const get = jest.fn().mockResolvedValue({ ok: false, error: 'boom' });
    asMock(getHttp).mockReturnValue({ get });

    await expect(fetchIocFeedByType(5)).rejects.toThrow('boom');
  });
});
