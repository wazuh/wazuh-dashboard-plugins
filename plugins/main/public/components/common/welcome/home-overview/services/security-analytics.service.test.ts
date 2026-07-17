import { getHttp } from '../../../../../kibana-services';
import {
  fetchDecodersCount,
  fetchDetectorsCount,
  fetchIntegrationsCount,
  fetchRulesCount,
  SECURITY_ANALYTICS_ROUTES,
} from './security-analytics.service';
import { DATA_SOURCE_NOT_FOUND } from '../data-group';

jest.mock('../../../../../kibana-services', () => ({
  getHttp: jest.fn(),
}));

const asMock = (fn: unknown) => fn as jest.Mock;

describe('fetchRulesCount', () => {
  it('POSTs size:0 with an explicit match_all query and prePackaged=true, and reads hits.total', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: true,
      response: { hits: { total: { value: 482 } } },
    });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchRulesCount()).toBe(482);
    const [route, options] = post.mock.calls[0];
    expect(route).toBe(SECURITY_ANALYTICS_ROUTES.rulesSearch);
    // Verified live: a bare `{ size: 0 }` throws
    // `illegal_argument_exception: inner bool query clause cannot be null`
    // server-side — an explicit query is required.
    expect(JSON.parse(options.body)).toEqual({
      size: 0,
      query: { match_all: {} },
    });
    expect(options.query).toEqual({ prePackaged: true });
  });

  it('hides (capability-absent) on a 404', async () => {
    const post = jest.fn().mockRejectedValue({ statusCode: 404 });
    asMock(getHttp).mockReturnValue({ post });

    await expect(fetchRulesCount()).rejects.toEqual({
      type: DATA_SOURCE_NOT_FOUND,
    });
  });

  it('treats an in-envelope ok:false as a query failure', async () => {
    const post = jest.fn().mockResolvedValue({ ok: false, error: 'boom' });
    asMock(getHttp).mockReturnValue({ post });

    await expect(fetchRulesCount()).rejects.toThrow('boom');
  });

  it('treats OpenSearch\'s "no handler found for uri" as capability-absent (cluster-side plugin lacks this endpoint)', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: false,
      error:
        'no handler found for uri [/_plugins/_security_analytics/rules/_search] and method [POST]',
    });
    asMock(getHttp).mockReturnValue({ post });

    await expect(fetchRulesCount()).rejects.toEqual({
      type: DATA_SOURCE_NOT_FOUND,
    });
  });
});

describe('fetchDecodersCount', () => {
  it('reads the custom response.total shape (not hits.total)', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: true,
      response: { total: 128, items: [] },
    });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchDecodersCount()).toBe(128);
  });
});

describe('fetchIntegrationsCount', () => {
  it('sends size:0 (count-only) and reads hits.total', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: true,
      response: { hits: { total: 14 } },
    });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchIntegrationsCount()).toBe(14);
    const [, options] = post.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ size: 0 });
  });
});

describe('fetchDetectorsCount', () => {
  it('sends size:0 with an explicit match_all query and reads hits.total', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: true,
      response: { hits: { total: { value: 9 } } },
    });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchDetectorsCount()).toBe(9);
    const [, options] = post.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      size: 0,
      query: { match_all: {} },
    });
  });
});
